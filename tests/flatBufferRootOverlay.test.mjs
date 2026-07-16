import assert from "node:assert/strict";
import test from "node:test";
import { Builder, ByteBuffer } from "flatbuffers";
import seedFlatBufferRootOverlay from "../src/function/flatBufferRootOverlay.mjs";

test("root overlay preserves opaque tables while replacing and adding slots", () => {
    const originalBuilder = new Builder(256);
    const originalKnown = createLeaf(originalBuilder, 11, "known-old");
    const opaquePeriodic = createLeaf(originalBuilder, 66, "opaque-periodic");
    const opaqueLeaf = createLeaf(originalBuilder, 77, "opaque-nested-string");
    const opaqueTable = createContainer(originalBuilder, opaqueLeaf);
    originalBuilder.startObject(16);
    originalBuilder.addFieldOffset(0, originalKnown, 0);
    originalBuilder.addFieldOffset(12, opaquePeriodic, 0);
    originalBuilder.addFieldOffset(15, opaqueTable, 0);
    const originalRoot = originalBuilder.endObject();
    originalBuilder.finish(originalRoot);
    const originalBytes = originalBuilder.asUint8Array().slice();

    const builder = new Builder(16);
    const overlay = seedFlatBufferRootOverlay(builder, new ByteBuffer(originalBytes));
    const replacementKnown = createLeaf(builder, 22, "known-new");
    const addedTable = createLeaf(builder, 33, "added-slot");
    const root = overlay.createRoot(
        new Map([
            [0, replacementKnown],
            [4, addedTable],
        ]),
    );
    builder.finish(root);

    const outputBytes = builder.asUint8Array();
    assert.notEqual(Buffer.from(outputBytes).indexOf(originalBytes), -1);
    const output = new ByteBuffer(outputBytes);
    const outputRoot = output.__indirect(output.position());
    const known = tableAt(output, outputRoot, 0);
    const added = tableAt(output, outputRoot, 4);
    const periodic = tableAt(output, outputRoot, 12);
    const opaque = tableAt(output, outputRoot, 15);
    const nestedOpaque = tableAt(output, opaque, 0);

    assert.deepEqual(readLeaf(output, known), { text: "known-new", value: 22 });
    assert.deepEqual(readLeaf(output, added), { text: "added-slot", value: 33 });
    assert.deepEqual(readLeaf(output, periodic), { text: "opaque-periodic", value: 66 });
    assert.deepEqual(readLeaf(output, nestedOpaque), { text: "opaque-nested-string", value: 77 });
    assert.equal(overlay.sourceSlotCount, 16);
    assert.deepEqual([...overlay.presentSlots], [0, 12, 15]);
});

test("root overlay rejects a present root slot that is not an offset table", () => {
    const builder = new Builder(64);
    builder.startObject(2);
    builder.addFieldInt32(1, 123, 0);
    const root = builder.endObject();
    builder.finish(root);

    assert.throws(() => seedFlatBufferRootOverlay(new Builder(), new ByteBuffer(builder.asUint8Array())), /root slot 1 table/);
});

// 本仓库适配：replacements 值为 null 时显式移除该槽位，而不是回退保留原始表。
// 用于「无降水时清空 forecastNextHour」等场景，避免被保留的原始数据重新出现。
test("root overlay removes a present slot when its replacement is null", () => {
    const originalBuilder = new Builder(256);
    const keep = createLeaf(originalBuilder, 11, "keep");
    const drop = createLeaf(originalBuilder, 22, "drop");
    originalBuilder.startObject(16);
    originalBuilder.addFieldOffset(0, keep, 0);
    originalBuilder.addFieldOffset(3, drop, 0);
    const originalRoot = originalBuilder.endObject();
    originalBuilder.finish(originalRoot);
    const originalBytes = originalBuilder.asUint8Array().slice();

    const builder = new Builder(16);
    const overlay = seedFlatBufferRootOverlay(builder, new ByteBuffer(originalBytes));
    const replacementKeep = createLeaf(builder, 33, "keep-new");
    const root = overlay.createRoot(
        new Map([
            [0, replacementKeep],
            [3, null],
        ]),
    );
    builder.finish(root);

    const output = new ByteBuffer(builder.asUint8Array());
    const outputRoot = output.__indirect(output.position());
    assert.deepEqual(readLeaf(output, tableAt(output, outputRoot, 0)), { text: "keep-new", value: 33 });
    assert.equal(tableAt(output, outputRoot, 3), 0); // slot 3 已移除
});

function createLeaf(builder, value, text) {
    const textOffset = builder.createString(text);
    builder.startObject(2);
    builder.addFieldInt32(0, value, 0);
    builder.addFieldOffset(1, textOffset, 0);
    return builder.endObject();
}

function createContainer(builder, nestedOffset) {
    builder.startObject(1);
    builder.addFieldOffset(0, nestedOffset, 0);
    return builder.endObject();
}

function tableAt(byteBuffer, table, slot) {
    const fieldOffset = byteBuffer.__offset(table, 4 + slot * 2);
    return fieldOffset ? byteBuffer.__indirect(table + fieldOffset) : 0;
}

function readLeaf(byteBuffer, table) {
    const valueOffset = byteBuffer.__offset(table, 4);
    const textOffset = byteBuffer.__offset(table, 6);
    return {
        text: textOffset ? byteBuffer.__string(table + textOffset) : null,
        value: valueOffset ? byteBuffer.readInt32(table + valueOffset) : 0,
    };
}
