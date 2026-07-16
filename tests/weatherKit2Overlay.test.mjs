import assert from "node:assert/strict";
import test from "node:test";
import { Builder, ByteBuffer } from "flatbuffers";
import WeatherKit2 from "../src/class/WeatherKit2.mjs";
import { Weather } from "../src/proto/apple/wk2.js";

const injectableDataSets = ["airQuality", "currentWeather", "forecastDaily", "forecastHourly", "forecastNextHour"];
const unrelatedKnownDataSets = ["news", "weatherAlerts", "weatherChanges", "historicalComparisons", "locationInfo"];

test("selected root decode only opens injectable products", () => {
    const sourceBytes = createWeatherRoot([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const allDecoded = WeatherKit2.decode(new ByteBuffer(sourceBytes), "all");
    const originalDecode = WeatherKit2.decode;
    const decodeCalls = [];
    const originalAccessors = new Map();

    WeatherKit2.decode = function (...args) {
        decodeCalls.push(args[1]);
        return originalDecode.apply(this, args);
    };
    for (const accessor of unrelatedKnownDataSets) {
        originalAccessors.set(accessor, Weather.prototype[accessor]);
        Weather.prototype[accessor] = () => {
            throw new Error(`unexpected root accessor: ${accessor}`);
        };
    }

    try {
        const decoded = WeatherKit2.decode(new ByteBuffer(sourceBytes), [...injectableDataSets, ...unrelatedKnownDataSets]);
        assert.deepEqual(Object.keys(decoded), injectableDataSets);
        for (const dataSet of injectableDataSets) assert.deepEqual(decoded[dataSet], allDecoded[dataSet]);
    } finally {
        WeatherKit2.decode = originalDecode;
        for (const [accessor, implementation] of originalAccessors) Weather.prototype[accessor] = implementation;
    }

    const decodedProducts = decodeCalls.filter(call => typeof call === "string" && call !== "metadata");
    assert.deepEqual(decodedProducts, injectableDataSets);
});

test("encodeRootOverlay replaces, removes, and preserves root products", () => {
    // 原始 Weather：airQuality(0)、currentWeather(1)、forecastNextHour(4)、news(5) 均存在（空表）
    const sourceBytes = createWeatherRoot([0, 1, 4, 5]);
    const sourceBB = new ByteBuffer(sourceBytes);
    const body = WeatherKit2.decode(sourceBB, ["airQuality", "currentWeather", "forecastNextHour"]);
    assert.deepEqual(Object.keys(body), ["airQuality", "currentWeather", "forecastNextHour"]);

    // 用真实数据替换 forecastNextHour（槽 4），显式移除 airQuality（槽 0），
    // 不触及 currentWeather(1) 与 news(5)：后者应作为不透明表原样保留。
    body.forecastNextHour = {
        metadata: {
            attributionUrl: "https://example.com",
            expireTime: 1,
            language: "en",
            latitude: 1,
            longitude: 1,
            providerLogo: "logo",
            providerName: "NEW_PROVIDER",
            readTime: 1,
            reportedTime: 1,
            temporarilyUnavailable: false,
            sourceType: "MODELED",
        },
        condition: [],
        summary: [],
        minutes: [],
        forecastStart: 0,
        forecastEnd: 0,
    };
    body.airQuality = undefined; // 显式移除
    const replacementDataSets = new Set(["forecastNextHour", "airQuality"]);

    const builder = new Builder(16);
    const rootOffset = WeatherKit2.encodeRootOverlay(builder, sourceBB, replacementDataSets, body);
    builder.finish(rootOffset);
    const out = builder.asUint8Array();

    const all = WeatherKit2.decode(new ByteBuffer(out), "all");
    assert.equal(all.forecastNextHour?.metadata?.providerName, "NEW_PROVIDER"); // 槽 4 被替换
    assert.equal(all.airQuality, undefined); // 槽 0 被移除
    assert.ok(all.currentWeather); // 槽 1 保留（未触及）
    assert.ok(all.news); // 槽 5 保留（非可注入，作为不透明表保留）
});

function createWeatherRoot(presentSlots) {
    const builder = new Builder(256);
    const tables = new Map(presentSlots.map(slot => [slot, createEmptyTable(builder)]));
    builder.startObject(10);
    for (const [slot, offset] of tables) builder.addFieldOffset(slot, offset, 0);
    const root = builder.endObject();
    builder.finish(root);
    return builder.asUint8Array().slice();
}

function createEmptyTable(builder) {
    builder.startObject(0);
    return builder.endObject();
}
