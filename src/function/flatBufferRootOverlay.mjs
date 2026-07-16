const ROOT_OFFSET_SIZE = 4;
const VTABLE_HEADER_SIZE = 4;
const VTABLE_ENTRY_SIZE = 2;
const OFFSET_FIELD_SIZE = 4;
const MAX_SCALAR_ALIGNMENT = 8;

/**
 * 在 FlatBuffers Builder 中种入既有缓冲，返回 root 表的 copy-on-write 上下文。
 *
 * 源字节作为一段对齐的 Builder 载荷整体保留，因此其内部各对象的相对偏移仍然有效。
 * 用同一个 Builder 编码替换表，再把它们的偏移以 Map<rootSlot, builderOffset> 形式
 * 交给 createRoot：传入偏移则替换该槽位，传入 null 则显式移除该槽位，未传入则保留原始表。
 * 这样未触及的 root 产品（含 iOS 27 等新 schema 引入、本代理不识别的槽位）会在
 * decode/encode 往返中作为不透明字节原样保留，不会因重编码而丢失。
 *
 * @param {import("flatbuffers").Builder} builder
 * @param {import("flatbuffers").ByteBuffer} source
 */
export default function seedFlatBufferRootOverlay(builder, source) {
    if (builder.offset() !== 0) throw new Error("FlatBuffer root overlay must seed an empty Builder");

    const root = inspectOffsetTableRoot(source);
    const sourceBytes = source.bytes().subarray(root.sourceStart).slice();
    const sourceLength = sourceBytes.length;

    // 将原始缓冲作为对齐字节向量保存。向量前缀故意不可达；
    // 其载荷是一个不透明的对象图，常量重定位后内部相对偏移仍然有效。
    builder.startVector(1, sourceLength, MAX_SCALAR_ALIGNMENT);
    for (let index = sourceLength - 1; index >= 0; index--) builder.writeInt8(sourceBytes[index]);
    const sourceVectorOffset = builder.endVector();
    const sourceStartOffset = sourceVectorOffset - OFFSET_FIELD_SIZE;

    const opaqueOffsets = new Map(root.presentSlots.map(({ slot, tablePosition }) => [slot, sourceStartOffset - (tablePosition - root.sourceStart)]));

    return {
        presentSlots: new Set(opaqueOffsets.keys()),
        sourceSlotCount: root.slotCount,

        /**
         * 创建新的 root 表：为该槽位提供替换 Builder 偏移则指向新表，
         * 未提供则指向未触及的源表；值为 null 表示显式移除该槽位（不保留原始表）。
         *
         * @param {Map<number, number|null>} replacements
         * @returns {number} root 表偏移，供 Builder.finish() 使用
         */
        createRoot(replacements = new Map()) {
            if (!(replacements instanceof Map)) throw new TypeError("FlatBuffer root replacements must be a Map");

            let slotCount = root.slotCount;
            for (const [slot, offset] of replacements) {
                if (!Number.isSafeInteger(slot) || slot < 0) throw new RangeError(`Invalid FlatBuffer root slot: ${slot}`);
                if (offset !== null && (!Number.isSafeInteger(offset) || offset <= 0 || offset > builder.offset())) throw new RangeError(`Invalid Builder offset for root slot ${slot}: ${offset}`);
                slotCount = Math.max(slotCount, slot + 1);
            }

            builder.startObject(slotCount);
            for (let slot = 0; slot < slotCount; slot++) {
                if (replacements.has(slot)) {
                    const offset = replacements.get(slot);
                    if (offset) builder.addFieldOffset(slot, offset, 0); // null → 省略（显式移除）
                } else {
                    const offset = opaqueOffsets.get(slot);
                    if (offset) builder.addFieldOffset(slot, offset, 0); // 保留原始表
                }
            }
            return builder.endObject();
        },
    };
}

function inspectOffsetTableRoot(source) {
    const sourceStart = source.position();
    const sourceEnd = source.capacity();
    ensureRange(sourceStart, ROOT_OFFSET_SIZE, sourceStart, sourceEnd, "root offset");

    const rootPosition = sourceStart + source.readUint32(sourceStart);
    const rootTable = inspectTable(source, rootPosition, sourceStart, sourceEnd, "root table");
    const slotCount = (rootTable.vtableLength - VTABLE_HEADER_SIZE) / VTABLE_ENTRY_SIZE;
    const presentSlots = [];

    for (let slot = 0; slot < slotCount; slot++) {
        const fieldOffset = source.readUint16(rootTable.vtablePosition + VTABLE_HEADER_SIZE + slot * VTABLE_ENTRY_SIZE);
        if (fieldOffset === 0) continue;
        if (fieldOffset < ROOT_OFFSET_SIZE || fieldOffset + OFFSET_FIELD_SIZE > rootTable.objectLength) {
            throw new Error(`FlatBuffer root slot ${slot} has an invalid field offset: ${fieldOffset}`);
        }

        const fieldPosition = rootPosition + fieldOffset;
        ensureRange(fieldPosition, OFFSET_FIELD_SIZE, sourceStart, sourceEnd, `root slot ${slot}`);
        const relativeOffset = source.readUint32(fieldPosition);
        if (relativeOffset === 0) throw new Error(`FlatBuffer root slot ${slot} has a null table offset`);

        const tablePosition = fieldPosition + relativeOffset;
        inspectTable(source, tablePosition, sourceStart, sourceEnd, `root slot ${slot} table`);
        presentSlots.push({ slot, tablePosition });
    }

    return { presentSlots, slotCount, sourceStart };
}

function inspectTable(source, tablePosition, sourceStart, sourceEnd, label) {
    ensureRange(tablePosition, ROOT_OFFSET_SIZE, sourceStart, sourceEnd, label);
    const vtablePosition = tablePosition - source.readInt32(tablePosition);
    ensureRange(vtablePosition, VTABLE_HEADER_SIZE, sourceStart, sourceEnd, `${label} vtable`);

    const vtableLength = source.readUint16(vtablePosition);
    const objectLength = source.readUint16(vtablePosition + VTABLE_ENTRY_SIZE);
    if (vtableLength < VTABLE_HEADER_SIZE || vtableLength % VTABLE_ENTRY_SIZE !== 0) {
        throw new Error(`${label} has an invalid vtable length: ${vtableLength}`);
    }
    if (objectLength < ROOT_OFFSET_SIZE) throw new Error(`${label} has an invalid object length: ${objectLength}`);

    ensureRange(vtablePosition, vtableLength, sourceStart, sourceEnd, `${label} vtable`);
    ensureRange(tablePosition, objectLength, sourceStart, sourceEnd, label);
    return { objectLength, vtableLength, vtablePosition };
}

function ensureRange(position, length, start, end, label) {
    if (!Number.isSafeInteger(position) || !Number.isSafeInteger(length) || position < start || length < 0 || position + length > end) {
        throw new Error(`${label} is outside the FlatBuffer`);
    }
}
