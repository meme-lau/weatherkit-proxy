import assert from "node:assert/strict";
import test from "node:test";
import ColorfulClouds from "../src/class/ColorfulClouds.mjs";
import QWeather from "../src/class/QWeather.mjs";
import Weather from "../src/class/Weather.mjs";

// 本仓库的 fetch（src/utils/fetch.mjs）最终调用 globalThis.fetch 并把响应包成 { body }。
// 测试中按 URL 分流返回上游 PR #73 的 fixture，验证逐日降水总量修复。
const originalFetch = globalThis.fetch;
test.before(() => {
    globalThis.fetch = input => {
        const url = typeof input === "string" ? input : (input?.url ?? "");
        let body;
        if (url.includes("api.caiyunapp.com")) body = colorfulCloudsDaily;
        else if (url.includes("/v7/weather/")) body = qWeatherDaily;
        else throw new Error(`unexpected request: ${url}`);
        return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));
    };
});
test.after(() => {
    globalThis.fetch = originalFetch;
});

const parameters = {
    country: "CN",
    language: "zh-Hans",
    latitude: 22.537,
    longitude: 113.899,
    version: "v2",
};

test("ColorfulClouds keeps WeatherKit daily amount pairs while replacing supported fields", async () => {
    const forecast = await new ColorfulClouds(parameters, "token").Daily(1);
    const providerDay = forecast.days[0];

    assertProviderDoesNotSupplyUnpairedAmounts(providerDay);
    const appleDay = mergeIntoAppleDay(providerDay);
    assertAppleAmountPairsRemainIntact(appleDay);
    assert.equal(appleDay.precipitationChance, 80);
    assert.equal(appleDay.daytimeForecast.precipitationChance, 70);
    assert.equal(appleDay.overnightForecast.precipitationChance, 60);
});

test("QWeather keeps WeatherKit daily amount pairs instead of reusing one daily total", async () => {
    const forecast = await new QWeather(parameters, "token").Daily(10);
    const providerDay = forecast.days[0];

    assertProviderDoesNotSupplyUnpairedAmounts(providerDay);
    const appleDay = mergeIntoAppleDay(providerDay);
    assertAppleAmountPairsRemainIntact(appleDay);
    assert.equal(appleDay.daytimeForecast.conditionCode, "RAIN");
    assert.equal(appleDay.overnightForecast.conditionCode, "CLOUDY");
});

// 回归保护：provider 仍会正常覆盖它能可靠提供的字段（降水概率、天气状况），
// 避免把"不再覆盖累计量"误扩大成"禁用整个逐日预报"。
test("ColorfulClouds still replaces supported daily fields", async () => {
    const forecast = await new ColorfulClouds(parameters, "token").Daily(1);
    const providerDay = forecast.days[0];
    const appleDay = mergeIntoAppleDay(providerDay);
    // 降水概率应被 provider 覆盖（彩云能可靠提供）
    assert.equal(appleDay.precipitationChance, 80);
    assert.equal(appleDay.daytimeForecast.precipitationChance, 70);
    // 累计量仍保留上游原始成对数据，未被 provider 覆盖
    assert.equal(appleDay.precipitationAmount, 19);
});

test("daily total displayed as zero is repaired from hours in the same forecast day", () => {
    const forecastStart = 1_784_092_800;
    const day = {
        conditionCode: "RAIN",
        forecastStart,
        forecastEnd: forecastStart + 24 * 3600,
        precipitationAmount: 0.2,
        precipitationAmountByType: [],
        precipitationType: "RAIN",
    };
    const hours = [
        { conditionCode: "RAIN", forecastStart: forecastStart - 3600, precipitationAmount: 10, precipitationType: "RAIN" },
        { conditionCode: "RAIN", forecastStart, precipitationAmount: 0.25, precipitationType: "RAIN" },
        { conditionCode: "HEAVY_RAIN", forecastStart: forecastStart + 3600, precipitationAmount: 0.5, precipitationType: "RAIN" },
        { conditionCode: "RAIN", forecastStart: day.forecastEnd, precipitationAmount: 10, precipitationType: "RAIN" },
    ];

    assert.equal(Weather.repairDailyPrecipitationTotals([day], hours), 1);
    assert.equal(day.precipitationAmount, 0.75);
    assert.deepEqual(day.precipitationAmountByType, [
        {
            expected: 0.75,
            expectedSnow: 0,
            maximumSnow: 0,
            minimumSnow: 0,
            precipitationType: "RAIN",
        },
    ]);
});

test("daily precipitation fallback does not overwrite a normal daily total", () => {
    const forecastStart = 1_784_092_800;
    const day = {
        forecastStart,
        forecastEnd: forecastStart + 24 * 3600,
        precipitationAmount: 8,
        precipitationAmountByType: [{ expected: 8, precipitationType: "RAIN" }],
    };
    const hours = [{ forecastStart, precipitationAmount: 20, precipitationType: "RAIN" }];

    assert.equal(Weather.repairDailyPrecipitationTotals([day], hours), 0);
    assert.equal(day.precipitationAmount, 8);
    assert.deepEqual(day.precipitationAmountByType, [{ expected: 8, precipitationType: "RAIN" }]);
});

function assertProviderDoesNotSupplyUnpairedAmounts(day) {
    assert.equal(Object.hasOwn(day, "precipitationAmount"), false);
    assert.equal(Object.hasOwn(day.daytimeForecast, "precipitationAmount"), false);
    assert.equal(Object.hasOwn(day.overnightForecast, "precipitationAmount"), false);
}

function mergeIntoAppleDay(providerDay) {
    const appleDay = {
        forecastStart: providerDay.forecastStart,
        precipitationAmount: 19,
        precipitationAmountByType: [{ expected: 19, precipitationType: "RAIN" }],
        daytimeForecast: {
            precipitationAmount: 3,
            precipitationAmountByType: [{ expected: 3, precipitationType: "RAIN" }],
        },
        overnightForecast: {
            precipitationAmount: 16,
            precipitationAmountByType: [{ expected: 16, precipitationType: "RAIN" }],
        },
    };
    Weather.mergeForecast([appleDay], [providerDay]);
    return appleDay;
}

function assertAppleAmountPairsRemainIntact(day) {
    assert.equal(day.precipitationAmount, day.precipitationAmountByType[0].expected);
    assert.equal(day.daytimeForecast.precipitationAmount, day.daytimeForecast.precipitationAmountByType[0].expected);
    assert.equal(day.overnightForecast.precipitationAmount, day.overnightForecast.precipitationAmountByType[0].expected);
}

const colorfulCloudsDaily = {
    location: [113.899, 22.537],
    result: {
        daily: {
            cloudrate: [{ avg: 0.8 }],
            humidity: [{ max: 0.9, min: 0.7 }],
            precipitation: [{ avg: 1, probability: 80 }],
            precipitation_08h_20h: [{ avg: 2, probability: 70 }],
            precipitation_20h_32h: [{ avg: 3, probability: 60 }],
            skycon: [{ date: "2026-07-16T00:00:00+08:00", value: "RAIN" }],
            skycon_08h_20h: [{ value: "RAIN" }],
            skycon_20h_32h: [{ value: "CLOUDY" }],
            status: "ok",
            temperature: [{ max: 30, min: 25 }],
            temperature_08h_20h: [{ max: 30, min: 27 }],
            temperature_20h_32h: [{ max: 28, min: 25 }],
            visibility: [{ max: 20, min: 5 }],
            wind: [{ avg: { speed: 3 }, max: { speed: 5 } }],
            wind_08h_20h: [{ avg: { direction: 180, speed: 3 }, max: { speed: 5 } }],
            wind_20h_32h: [{ avg: { direction: 200, speed: 2 }, max: { speed: 4 } }],
        },
    },
    server_time: 1_784_167_551,
    status: "ok",
};

const qWeatherDaily = {
    code: "200",
    daily: [
        {
            fxDate: "2026-07-16",
            moonPhase: "满月",
            moonrise: "20:00",
            moonset: "06:00",
            precip: "1.0",
            sunrise: "05:48",
            sunset: "19:10",
            tempMax: "30",
            tempMin: "25",
            textDay: "中雨",
            textNight: "阴",
            uvIndex: "5",
            wind360Day: "180",
            wind360Night: "200",
            windSpeedDay: "3",
            windSpeedNight: "2",
        },
    ],
    fxLink: "https://www.qweather.com/",
    updateTime: "2026-07-16T08:00:00+08:00",
};
