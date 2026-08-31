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

test("Response leaves a configured root outside the request dataSets untouched", async () => {
    const originalBytes = createWeatherRoot([4, 5]);
    const preFetched = { forecastNextHour: Promise.resolve(makeVisibleNextHour("CONFIGURED_PROVIDER")) };
    const Settings = { DataSets: ["forecastNextHour"], Weather: { Replace: ["CN"] }, NextHour: { Provider: "ColorfulClouds" } };

    const res = await Response({ url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-CN/22.5/114.0?country=CN&dataSets=news" }, { bodyBytes: originalBytes, headers: { "Content-Type": "application/vnd.apple.flatbuffer" }, status: 200 }, { preFetched, Settings });

    assert.deepEqual(new Uint8Array(res.body), originalBytes);
});

test("Response leaves requested roots untouched when no dataSets are configured", async () => {
    const originalBytes = createWeatherRoot([4, 5]);
    const preFetched = { forecastNextHour: Promise.resolve(makeVisibleNextHour("UNUSED_PROVIDER")) };
    const Settings = { DataSets: [], Weather: { Replace: ["CN"] }, NextHour: { Provider: "ColorfulClouds" } };

    const res = await Response({ url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-CN/22.5/114.0?country=CN&dataSets=forecastNextHour,news" }, { bodyBytes: originalBytes, headers: { "Content-Type": "application/vnd.apple.flatbuffer" }, status: 200 }, { preFetched, Settings });

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

test("Response keeps Apple forecastNextHour when provider says CLEAR but original minutes contain precipitation", async () => {
    const originalBytes = createOriginalRainNextHour();
    const preFetched = {
        forecastNextHour: Promise.resolve({
            ...makeVisibleNextHour("CLEAR_PROVIDER"),
            condition: [{ forecastToken: "CLEAR", parameters: [], startTime: 0, endTime: 0, beginCondition: "CLEAR", endCondition: "CLEAR" }],
            minutes: [],
        }),
    };
    const Settings = { DataSets: ["forecastNextHour"], Weather: { Replace: ["CN"] }, NextHour: { Provider: "ColorfulClouds" } };

    const res = await Response({ url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-CN/22.5/114.0?country=CN&dataSets=forecastNextHour" }, { bodyBytes: originalBytes, headers: { "Content-Type": "application/vnd.apple.flatbuffer" }, status: 200 }, { preFetched, Settings });

    const all = WeatherKit2.decode(new ByteBuffer(new Uint8Array(res.body)), "all");
    assert.equal(all.forecastNextHour.metadata.providerName, "APPLE_PROVIDER");
    assert.ok(Math.abs(all.forecastNextHour.minutes[0].precipitationIntensity - 0.4) < 1e-6);
});

test("Response removes forecastNextHour when prefetch has only trace / possible precipitation (blank chart)", async () => {
    // 彩云常返回「未来2小时有降水」但强度仅属可能/微量：perceivedPrecipitationIntensity ≤ 0.1，
    // 分类为 POSSIBLE_DRIZZLE，条件非 CLEAR。Apple 降水强度图此时渲染为空白网格，应隐藏卡片。
    const originalBytes = createWeatherRoot([0, 1, 4, 5]);
    const preFetched = {
        forecastNextHour: Promise.resolve({
            metadata: {
                attributionUrl: "https://example.com",
                expireTime: 1,
                language: "zh",
                latitude: 1,
                longitude: 1,
                providerLogo: "logo",
                providerName: "TRACE_PROVIDER",
                readTime: 1,
                reportedTime: 1,
                temporarilyUnavailable: false,
                sourceType: "MODELED",
            },
            condition: [{ forecastToken: "CONSTANT", parameters: [], startTime: 0, endTime: 0, beginCondition: "POSSIBLE_DRIZZLE", endCondition: "POSSIBLE_DRIZZLE" }],
            summary: [{ condition: "RAIN", startTime: 0, endTime: 0, precipitationChance: 10, precipitationIntensity: 0.09, clear: false }],
            minutes: Array.from({ length: 60 }, (_, index) => ({
                startTime: index * 60,
                precipitationChance: 10,
                precipitationIntensity: 0.09,
                perceivedPrecipitationIntensity: 0.003, // ≤ 0.1 → 仅可能降水，Apple 图为空白
            })),
            forecastStart: 0,
            forecastEnd: 60 * 60,
        }),
    };
    const Settings = { Weather: { Replace: ["CN"] }, NextHour: { Provider: "ColorfulClouds" } };

    const res = await Response({ url: "https://weatherkit.apple.com/api/v2/weather/en-CN/22.5/114.0?country=CN&dataSets=forecastNextHour,news" }, { bodyBytes: originalBytes, headers: { "Content-Type": "application/vnd.apple.flatbuffer" }, status: 200 }, { preFetched, Settings });

    const all = WeatherKit2.decode(new ByteBuffer(new Uint8Array(res.body)), "all");
    assert.equal(all.forecastNextHour, undefined); // 仅微量降水 → 清空槽 4，隐藏空白卡片
    assert.ok(all.news); // 其余未触及产品仍保留
});

test("Response keeps forecastNextHour when prefetch has visible (light+) precipitation", async () => {
    // 存在轻度及以上降水（perceivedPrecipitationIntensity > 0.1）时，应正常注入并展示卡片。
    // 本用例聚焦「是否有可见降水」的判定，condition/summary 留空，仅靠 minutes 判定保留。
    const originalBytes = createWeatherRoot([0, 1, 4, 5]);
    const preFetched = {
        forecastNextHour: Promise.resolve({
            metadata: {
                attributionUrl: "https://example.com",
                expireTime: 1,
                language: "zh",
                latitude: 1,
                longitude: 1,
                providerLogo: "logo",
                providerName: "RAIN_PROVIDER",
                readTime: 1,
                reportedTime: 1,
                temporarilyUnavailable: false,
                sourceType: "MODELED",
            },
            condition: [],
            summary: [],
            minutes: Array.from({ length: 60 }, (_, index) => ({
                startTime: index * 60,
                precipitationChance: 60,
                precipitationIntensity: 0.6,
                perceivedPrecipitationIntensity: 0.15, // > 0.1 → 轻度降水，Apple 图可见
            })),
            forecastStart: 0,
            forecastEnd: 60 * 60,
        }),
    };
    const Settings = { Weather: { Replace: ["CN"] }, NextHour: { Provider: "ColorfulClouds" } };

    const res = await Response({ url: "https://weatherkit.apple.com/api/v2/weather/en-CN/22.5/114.0?country=CN&dataSets=forecastNextHour,news" }, { bodyBytes: originalBytes, headers: { "Content-Type": "application/vnd.apple.flatbuffer" }, status: 200 }, { preFetched, Settings });

    const all = WeatherKit2.decode(new ByteBuffer(new Uint8Array(res.body)), "all");
    assert.ok(all.forecastNextHour); // 有可见降水 → 保留并注入
    assert.equal(all.forecastNextHour.metadata.providerName, "RAIN_PROVIDER");
});

test("Response repairs a displayed-zero daily total from same-day hourly precipitation", async () => {
    const forecastStart = 1_784_092_800;
    const originalBytes = createDailyAndHourlyWeather(forecastStart);
    const Settings = { Weather: { Replace: ["CN"], ReplaceDaily: false, ReplaceHourly: false } };

    const res = await Response({ url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-CN/22.5/114.0?country=CN&dataSets=forecastDaily,forecastHourly" }, { bodyBytes: originalBytes, headers: { "Content-Type": "application/vnd.apple.flatbuffer" }, status: 200 }, { Settings });

    const all = WeatherKit2.decode(new ByteBuffer(new Uint8Array(res.body)), "all");
    const day = all.forecastDaily.days[0];
    assert.equal(day.precipitationAmount, 0.75);
    assert.equal(day.precipitationType, "RAIN");
    assert.deepEqual(day.precipitationAmountByType, [
        {
            expected: 0.75,
            expectedSnow: 0,
            maximumSnow: 0,
            minimumSnow: 0,
            precipitationType: "RAIN",
        },
    ]);
    assert.equal(all.forecastHourly.hours[0].precipitationAmount, 0.25);
    assert.equal(all.forecastHourly.hours[1].precipitationAmount, 0.5);
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

function makeVisibleNextHour(providerName) {
    return {
        metadata: {
            attributionUrl: "https://example.com",
            expireTime: 1,
            language: "zh",
            latitude: 1,
            longitude: 1,
            providerName,
            readTime: 1,
            reportedTime: 1,
            temporarilyUnavailable: false,
            sourceType: "MODELED",
        },
        condition: [],
        summary: [],
        minutes: [{ startTime: 0, precipitationChance: 60, precipitationIntensity: 0.6, perceivedPrecipitationIntensity: 0.15 }],
        forecastStart: 0,
        forecastEnd: 60,
    };
}

function createOriginalRainNextHour() {
    const builder = new Builder(1024);
    const root = WeatherKit2.encode(builder, "all", {
        forecastNextHour: {
            ...makeVisibleNextHour("APPLE_PROVIDER"),
            condition: [],
            summary: [],
            minutes: [{ startTime: 0, precipitationChance: 80, precipitationIntensity: 0.4, perceivedPrecipitationIntensity: 0.2 }],
        },
    });
    builder.finish(root);
    return builder.asUint8Array().slice();
}

function createDailyAndHourlyWeather(forecastStart) {
    const builder = new Builder(1024);
    const root = WeatherKit2.encode(builder, "all", {
        forecastDaily: {
            days: [
                {
                    conditionCode: "RAIN",
                    forecastEnd: forecastStart + 24 * 3600,
                    forecastStart,
                    precipitationAmount: 0.2,
                    precipitationAmountByType: [],
                    precipitationChance: 70,
                    precipitationType: "RAIN",
                },
            ],
        },
        forecastHourly: {
            hours: [
                { conditionCode: "RAIN", forecastStart: forecastStart + 3 * 3600, precipitationAmount: 0.25, precipitationChance: 60, precipitationType: "RAIN" },
                { conditionCode: "RAIN", forecastStart: forecastStart + 4 * 3600, precipitationAmount: 0.5, precipitationChance: 60, precipitationType: "RAIN" },
            ],
        },
    });
    builder.finish(root);
    return builder.asUint8Array().slice();
}
