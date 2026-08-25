import assert from "node:assert/strict";
import test from "node:test";
import buildSettings from "../src/function/buildSettings.mjs";
import database from "../src/function/database.mjs";
import mergeWeatherKitAvailability from "../src/function/mergeWeatherKitAvailability.mjs";
import parseWeatherKitURL from "../src/function/parseWeatherKitURL.mjs";
import app from "../src/Hono.js";
import { Response } from "../src/process/Response.mjs";

test("WeatherKit locales split language, script, and country deterministically", () => {
    const cases = [
        ["en-US", "en", "US"],
        ["pt-BR", "pt", "BR"],
        ["zh-Hans-US", "zh-Hans", "US"],
    ];

    for (const [locale, language, country] of cases) {
        const parsed = parseWeatherKitURL(new URL(`https://weatherkit.apple.com/api/v2/weather/${locale}/22.5431/114.0579?dataSets=currentWeather`));
        assert.equal(parsed.language, language, locale);
        assert.equal(parsed.country, country, locale);
        assert.equal(parsed.countrySource, "locale", locale);
    }
});

test("WeatherKit country resolution uses query, location timezone, then locale fallback", () => {
    const cases = [
        {
            name: "native country query",
            url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-CN/23/113?country=us&timezone=Asia%2FShanghai",
            expected: { country: "US", source: "query" },
        },
        {
            name: "REST countryCode query",
            url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans/23/113?countryCode=hk&timezone=Asia%2FShanghai",
            expected: { country: "HK", source: "query" },
        },
        {
            name: "locale region",
            url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-CN/23/113?timezone=Asia%2FTokyo",
            expected: { country: "CN", source: "locale" },
        },
        {
            name: "location timezone is stronger than localization region",
            url: "https://weatherkit.apple.com/api/v2/weather/en-US/23/113?timezone=Asia%2FShanghai",
            expected: { country: "CN", source: "timezone" },
        },
        {
            name: "mainland timezone",
            url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans/23/113?timezone=Asia%2FShanghai",
            expected: { country: "CN", source: "timezone" },
        },
        {
            name: "legacy mainland timezone alias",
            url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans/23/113?timezone=Asia%2FChungking",
            expected: { country: "CN", source: "timezone" },
        },
        {
            name: "Hong Kong is not mainland China",
            url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-CN/23/113?timezone=Asia%2FHong_Kong",
            expected: { country: "HK", source: "timezone" },
        },
        {
            name: "invalid query falls through",
            url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans/23/113?country=china&timezone=Asia%2FShanghai",
            expected: { country: "CN", source: "timezone" },
        },
        {
            name: "language alone never implies country",
            url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans/23/113?timezone=Asia%2FSingapore",
            expected: { country: undefined, source: "unknown" },
        },
    ];

    for (const { name, url, expected } of cases) {
        const parsed = parseWeatherKitURL(new URL(url));
        assert.equal(parsed.country, expected.country, name);
        assert.equal(parsed.countrySource, expected.source, name);
    }
});

test("timezone fallback enables third-party prefetch for country-less mainland requests", async () => {
    const originalFetch = globalThis.fetch;
    const requestedUrls = [];
    globalThis.fetch = async input => {
        const url = typeof input === "string" ? input : input.url;
        requestedUrls.push(url);
        if (url.includes("api.caiyunapp.com")) {
            return new globalThis.Response(JSON.stringify({ status: "ok", result: { realtime: { status: "ok" } } }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        }
        return new globalThis.Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    };

    try {
        const response = await app.request("https://proxy.example/api/v2/weather/zh-Hans/23/113?timezone=Asia%2FShanghai&dataSets=currentWeather");
        assert.equal(response.status, 200);
        assert.ok(
            requestedUrls.some(url => url.includes("api.caiyunapp.com")),
            requestedUrls.join("\n"),
        );
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("default processed datasets and FlatBuffer root mappings match the release contract", () => {
    assert.deepEqual(database.WeatherKit.Settings.DataSets, ["airQuality", "currentWeather", "forecastDaily", "forecastHourly", "forecastNextHour", "weatherAlerts"]);
    assert.deepEqual(database.WeatherKit.Configs.DataSets, {
        airQuality: "airQuality",
        currentWeather: "currentWeather",
        forecastDaily: "forecastDaily",
        forecastHourly: "forecastHourly",
        forecastNextHour: "forecastNextHour",
        news: "news",
        weatherAlerts: "weatherAlerts",
        weatherChange: "weatherChanges",
        trendComparison: "historicalComparisons",
        locationInfo: "locationInfo",
    });
});

test("comma-separated dataSet settings normalize to a flat array", () => {
    const { Settings } = buildSettings(database, { DataSets: "airQuality,currentWeather" });
    assert.deepEqual(Settings.DataSets, ["airQuality", "currentWeather"]);
});

test("Hono 转发层不使用代理处理开关裁剪 Apple 原始 dataSets", async () => {
    const originalFetch = globalThis.fetch;
    let forwardedUrl;
    globalThis.fetch = async input => {
        forwardedUrl = typeof input === "string" ? input : input.url;
        return new globalThis.Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    };

    try {
        const requested = "airQuality,news,forecastPrecipitation,forecastNextHour,currentWeather";
        const response = await app.request(`https://proxy.example/api/v2/weather/en-US/22.5/114?dataSets=${requested}&DataSets=airQuality,currentWeather`);
        assert.equal(response.status, 200);
        assert.equal(new URL(forwardedUrl).searchParams.get("dataSets"), requested);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("availability keeps Apple capabilities and appends proxy requirements", async () => {
    const appleCapabilities = ["currentWeather", "forecastSnowfall", "weatherMaps"];
    const expected = mergeWeatherKitAvailability(appleCapabilities, database.WeatherKit.Configs.Availability.v2);
    const response = await Response(
        { url: "https://weatherkit.apple.com/api/v1/availability/en-US/22.5431/114.0579" },
        {
            body: JSON.stringify(appleCapabilities),
            headers: { "Content-Type": "application/json" },
        },
    );

    assert.deepEqual(JSON.parse(response.body), expected);
    assert.ok(expected.includes("forecastSnowfall"));
    assert.ok(expected.includes("forecastNextHour"));
});

test("availability helper leaves non-array Apple responses untouched", () => {
    const errorBody = { error: "temporarily unavailable" };
    assert.equal(mergeWeatherKitAvailability(errorBody, ["forecastNextHour"]), errorBody);
});
