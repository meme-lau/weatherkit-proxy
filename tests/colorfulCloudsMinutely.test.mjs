import assert from "node:assert/strict";
import test from "node:test";
import ColorfulClouds from "../src/class/ColorfulClouds.mjs";

const parameters = {
    country: "CN",
    language: "zh-Hans",
    latitude: 22.537,
    longitude: 113.899,
    version: "v2",
};

test("彩云分钟概率按整组量纲归一化，百分制中的 1 保持 1%", async () => {
    const forecast = await withMinutelyFixture([1, 25, 50, 75], "未来两小时有雨");

    assert.equal(forecast.minutes[0].precipitationChance, 1);
    assert.equal(forecast.minutes[30].precipitationChance, 25);
    assert.equal(forecast.minutes[60].precipitationChance, 50);
});

test("彩云分钟概率将完整的 0–1 比例数组转换为百分比", async () => {
    const forecast = await withMinutelyFixture([0.01, 0.25, 0.5, 0.75], "未来两小时有雨");

    assert.equal(forecast.minutes[0].precipitationChance, 1);
    assert.equal(forecast.minutes[30].precipitationChance, 25);
    assert.equal(forecast.minutes[60].precipitationChance, 50);
});

test("彩云描述缺失但分钟强度有效时回退为雨而不是 CLEAR", async () => {
    const forecast = await withMinutelyFixture([0.5, 0.5, 0.5, 0.5], "");

    assert.equal(forecast.minutes[0].summaryCondition, "RAIN");
    assert.notEqual(forecast.minutes[0].condition, "CLEAR");
    assert.notEqual(forecast.condition[0].forecastToken, "CLEAR");
});

async function withMinutelyFixture(probability, description) {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
        new Response(
            JSON.stringify({
                status: "ok",
                location: [113.899, 22.537],
                server_time: 1_784_167_551,
                result: {
                    minutely: {
                        status: "ok",
                        description,
                        probability,
                        precipitation_2h: Array.from({ length: 85 }, () => 0.5),
                    },
                },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
        );
    try {
        return await new ColorfulClouds(parameters, "test-token").Minutely();
    } finally {
        globalThis.fetch = originalFetch;
    }
}
