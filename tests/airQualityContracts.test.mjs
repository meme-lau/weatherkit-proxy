import assert from "node:assert/strict";
import test from "node:test";
import { Builder, ByteBuffer } from "flatbuffers";
import AirQuality from "../src/class/AirQuality.mjs";
import QWeather from "../src/class/QWeather.mjs";
import WeatherKit2 from "../src/class/WeatherKit2.mjs";

const parameters = {
    country: "CN",
    language: "zh-Hans",
    latitude: 22.537,
    longitude: 113.899,
    version: "v2",
};

test("Apple 内置 AQ 算法使用无版本 scale alias", () => {
    const expectedScales = {
        UBA: "UBA",
        EU_EAQI: "EU.EAQI",
        HJ6332012: "HJ6332012",
        HJ6332025_DRAFT: "HJ6332012",
        EPA_NowCast: "EPA_NowCast",
        WAQI_InstantCast_US: "EPA_NowCast",
        WAQI_InstantCast_CN: "HJ6332012",
        WAQI_InstantCast_CN_25_DRAFT: "HJ6332012",
    };

    for (const [algorithm, expectedScale] of Object.entries(expectedScales)) {
        assert.equal(AirQuality.ToWeatherKitScale(AirQuality.Config.Scales[algorithm].weatherKitScale), expectedScale, algorithm);
    }
});

test("AQ scale 辅助函数保留含点 alias 并迁移旧版本", () => {
    assert.equal(AirQuality.GetNameFromScale("EU.EAQI"), "EU.EAQI");
    assert.equal(AirQuality.GetNameFromScale("EU.EAQI.2414"), "EU.EAQI");
    assert.equal(AirQuality.ToWeatherKitScale({ name: "HK.AQHI", version: "2414" }), "HK.AQHI.2414");

    const stale = { categoryIndex: 2, index: 13, pollutants: [{ pollutantType: "NO2" }], scale: "EU.EAQI.2414" };
    const normalized = AirQuality.NormalizeScaleIdentifier(stale);
    assert.notEqual(normalized, stale);
    assert.equal(normalized.scale, "EU.EAQI");
    assert.equal(normalized.index, stale.index);
    assert.deepEqual(normalized.pollutants, stale.pollutants);
    assert.equal(AirQuality.NormalizeScaleIdentifier({ scale: "HK.AQHI.2414" }).scale, "HK.AQHI");
    assert.equal(AirQuality.ScaleMatches("EU.EAQI.2414", "EU.EAQI"), true);
    assert.equal(AirQuality.ScaleMatches("EU.EAQI.beta", "EU.EAQI"), false);
});

test("空值或不可用等级不参与空气质量对比", () => {
    const { UNKNOWN } = AirQuality.Config.CompareCategoryIndexes;
    for (const pair of [
        [-1, 2],
        [0, 2],
        [null, 2],
        [2, -1],
        [2, undefined],
    ]) {
        assert.equal(AirQuality.CompareCategoryIndexes(...pair), UNKNOWN, JSON.stringify(pair));
    }
});

test("和风空气质量在 level 为空时依据 AQI 推导有效等级", async () => {
    await withFetch(
        () => ({
            indexes: [{ aqi: "46", code: "us-epa", level: null, primaryPollutant: { code: "pm25" } }],
            pollutants: [
                {
                    code: "pm25",
                    concentration: { unit: "μg/m3", value: 12 },
                    subIndexes: [{ aqi: 46, code: "us-epa" }],
                },
            ],
        }),
        async () => {
            const airQuality = await new QWeather({ ...parameters, country: "US" }, "test-token").CurrentAirQuality();
            assert.equal(airQuality.index, 46);
            assert.equal(airQuality.categoryIndex, 1);
            assert.equal(airQuality.scale, "EPA_NowCast");
        },
    );
});

test("和风各预报产品使用接口 updateTime 作为 reportedTime", async () => {
    const expected = Math.trunc(Date.parse(qWeatherHourly.updateTime) / 1000);
    const expectedMinutely = Math.trunc(Date.parse(qWeatherMinutely.updateTime) / 1000);
    await withFetch(
        url => {
            if (url.includes("/v7/minutely/5m")) return qWeatherMinutely;
            if (url.includes("/v7/weather/24h")) return qWeatherHourly;
            return qWeatherDaily;
        },
        async () => {
            const provider = new QWeather(parameters, "test-token");
            const nextHour = await provider.Minutely();
            const hourly = await provider.Hourly(24);
            const daily = await provider.Daily(10);

            assert.equal(nextHour.metadata.reportedTime, expectedMinutely);
            assert.equal(hourly.metadata.reportedTime, expected);
            assert.equal(daily.metadata.reportedTime, expected);
            assert.equal(roundTrip("forecastNextHour", nextHour).metadata.reportedTime, expectedMinutely);
            assert.equal(roundTrip("forecastHourly", hourly).metadata.reportedTime, expected);
        },
    );
});

async function withFetch(bodyForUrl, callback) {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async input => {
        const url = typeof input === "string" ? input : input.url;
        const body = bodyForUrl(url);
        return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    };
    try {
        await callback();
    } finally {
        globalThis.fetch = originalFetch;
    }
}

function roundTrip(dataSet, data) {
    const builder = new Builder(4096);
    const offset = WeatherKit2.encode(builder, "all", { [dataSet]: data });
    builder.finish(offset);
    return WeatherKit2.decode(new ByteBuffer(builder.asUint8Array()), dataSet);
}

const qWeatherHourly = {
    code: "200",
    fxLink: "https://www.qweather.com/",
    hourly: [
        {
            cloud: "50",
            dew: "24",
            fxTime: "2026-07-16T09:00:00+08:00",
            humidity: "80",
            pop: "80",
            precip: "1.0",
            pressure: "1000",
            temp: "26",
            text: "中雨",
            wind360: "180",
            windSpeed: "3",
        },
    ],
    updateTime: "2026-07-16T08:00:00+08:00",
};

const qWeatherDaily = {
    code: "200",
    daily: [
        {
            fxDate: "2026-07-16",
            moonPhase: "满月",
            moonrise: "20:00",
            moonset: "06:00",
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
    updateTime: qWeatherHourly.updateTime,
};

const qWeatherMinutely = {
    code: "200",
    fxLink: "https://www.qweather.com/",
    minutely: [
        {
            fxTime: "2026-07-16T08:05:00+08:00",
            precip: "0.2",
        },
    ],
    summary: "未来一小时有小雨",
    updateTime: "2026-07-16T08:00:37+08:00",
};
