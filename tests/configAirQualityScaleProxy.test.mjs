import assert from "node:assert/strict";
import test from "node:test";
import database from "../src/function/database.mjs";
import { renderIndex } from "../src/function/indexPage.mjs";
import app from "../src/Hono.js";

const CONFIG_FILES = [
    ["weatherkit-proxy.sgmodule", "weatherkit-proxy-no-aqs.sgmodule"],
    ["weatherkit-proxy.srmodule", "weatherkit-proxy-no-aqs.srmodule"],
    ["weatherkit-proxy.plugin", "weatherkit-proxy-no-aqs.plugin"],
    ["weatherkit-proxy.stoverride", "weatherkit-proxy-no-aqs.stoverride"],
    ["weatherkit-proxy.yaml", "weatherkit-proxy-no-aqs.yaml"],
    ["weatherkit-proxy.snippet", "weatherkit-proxy-no-aqs.snippet"],
];

async function downloadConfig(path) {
    const response = await app.request(`https://proxy.example${path}`, { headers: { host: "proxy.example" } });
    assert.equal(response.status, 200);
    return response.text();
}

test("配置页默认代理 airQualityScale 并启用逐日、逐小时替换", () => {
    const html = renderIndex("proxy.example", "https");
    for (const id of ["proxyAirQualityScale", "replaceDaily", "replaceHourly"]) {
        const input = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0];
        assert.ok(input, `配置页应包含 ${id} 开关`);
        assert.match(input, /\bchecked\b/, `${id} 默认应勾选`);
    }
    assert.match(html, /id="resetConfigBtn"/, "配置页应提供恢复默认配置按钮");
    assert.equal(database.WeatherKit.Settings.Weather.ReplaceDaily, true);
    assert.equal(database.WeatherKit.Settings.Weather.ReplaceHourly, true);
});

test("客户端配置默认代理 airQualityScale", async () => {
    for (const [filename] of CONFIG_FILES) {
        const content = await downloadConfig(`/conf/${filename}`);
        assert.match(content, /\/api\/v1\/airQualityScale\//, filename);
        assert.doesNotMatch(content, /__AIR_QUALITY_SCALE_PROXY_/, `${filename} 不应泄露模板标记`);
        assert.match(content, /\/api\/v2\/weather\//, `${filename} 应保留天气代理规则`);
    }
});

test("页面关闭选项后，所有客户端配置均不代理 airQualityScale", async () => {
    for (const [, filename] of CONFIG_FILES) {
        const content = await downloadConfig(`/conf/${filename}`);
        assert.doesNotMatch(content, /\/api\/v1\/airQualityScale\//, filename);
        assert.doesNotMatch(content, /__AIR_QUALITY_SCALE_PROXY_/, `${filename} 不应泄露模板标记`);
    }
});
