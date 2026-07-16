import assert from "node:assert/strict";
import test from "node:test";
import { Builder, ByteBuffer } from "flatbuffers";
import WeatherKit2 from "../src/class/WeatherKit2.mjs";
import { Response } from "../src/process/Response.mjs";

test("Response passes through original bytes when the country is not replaced", async () => {
    const originalBytes = createWeatherRoot([4, 5]); // forecastNextHour(4)、news(5)
    const res = await Response({ url: "https://weatherkit.apple.com/api/v2/weather/en-US/22.5/114.0?country=US&dataSets=forecastNextHour,news" }, { bodyBytes: originalBytes, headers: { "Content-Type": "application/vnd.apple.flatbuffer" }, status: 200 }, {});

    assert.deepEqual(new Uint8Array(res.body), originalBytes);
});

test("Response removes forecastNextHour and preserves untouched products when prefetch says CLEAR", async () => {
    // 原始 Weather：airQuality(0)、currentWeather(1)、forecastNextHour(4)、news(5) 均存在（空表）
    const originalBytes = createWeatherRoot([0, 1, 4, 5]);
    const preFetched = {
        // 预取数据声明未来一小时无降水 -> InjectForecastNextHour 会清空 forecastNextHour（隐藏空白卡片）
        forecastNextHour: Promise.resolve({
            metadata: {
                attributionUrl: "https://example.com",
                expireTime: 1,
                language: "en",
                latitude: 1,
                longitude: 1,
                providerLogo: "logo",
                providerName: "CLEAR_PROVIDER",
                readTime: 1,
                reportedTime: 1,
                temporarilyUnavailable: false,
                sourceType: "MODELED",
            },
            condition: [{ forecastToken: "CLEAR", parameters: [], startTime: 0, endTime: 0, beginCondition: "CLEAR", endCondition: "CLEAR" }],
            summary: [],
            minutes: [],
            forecastStart: 0,
            forecastEnd: 0,
        }),
    };
    const Settings = { Weather: { Replace: ["CN"] }, NextHour: { Provider: "ColorfulClouds" } };

    const res = await Response({ url: "https://weatherkit.apple.com/api/v2/weather/en-CN/22.5/114.0?country=CN&dataSets=forecastNextHour,news" }, { bodyBytes: originalBytes, headers: { "Content-Type": "application/vnd.apple.flatbuffer" }, status: 200 }, { preFetched, Settings });

    const all = WeatherKit2.decode(new ByteBuffer(new Uint8Array(res.body)), "all");
    assert.equal(all.forecastNextHour, undefined); // 槽 4 被移除（隐藏空白卡片）
    assert.ok(all.news); // 槽 5 保留（非可注入，作为不透明表保留，模拟 iOS 27 新增/未识别产品不丢失）
    assert.ok(all.airQuality); // 槽 0 保留
    assert.ok(all.currentWeather); // 槽 1 保留
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
