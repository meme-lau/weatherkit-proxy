import assert from "node:assert/strict";
import test from "node:test";
import database from "../src/function/database.mjs";
import { renderIndex } from "../src/function/indexPage.mjs";
import app from "../src/Hono.js";

const CONFIG_FILES = ["weatherkit-proxy.sgmodule", "weatherkit-proxy.srmodule", "weatherkit-proxy.plugin", "weatherkit-proxy.stoverride", "weatherkit-proxy.yaml", "weatherkit-proxy.snippet"];

function encodeConfig(config) {
    return Buffer.from(JSON.stringify(config)).toString("base64url");
}

async function downloadConfig(path) {
    const response = await app.request(`https://proxy.example${path}`, { headers: { host: "proxy.example" } });
    assert.equal(response.status, 200);
    return response.text();
}

test("配置页默认代理 airQualityScale，并启用逐日、逐小时替换", () => {
    const html = renderIndex("proxy.example", "https");
    const proxyInput = html.match(/<input[^>]*id="proxyAirQualityScale"[^>]*>/)?.[0];
    assert.ok(proxyInput, "配置页应包含 airQualityScale 代理开关");
    assert.match(proxyInput, /\bchecked\b/, "airQualityScale 代理默认应勾选");
    for (const id of ["replaceDaily", "replaceHourly"]) {
        const input = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0];
        assert.ok(input, `配置页应包含 ${id} 开关`);
        assert.match(input, /\bchecked\b/, `${id} 默认应勾选`);
    }
    assert.match(html, /id="resetConfigBtn"/, "配置页应提供恢复默认配置按钮");
    assert.equal(database.WeatherKit.Settings.Weather.ReplaceDaily, true);
    assert.equal(database.WeatherKit.Settings.Weather.ReplaceHourly, true);
});

test("客户端配置默认代理 airQualityScale", async () => {
    for (const filename of CONFIG_FILES) {
        const content = await downloadConfig(`/conf/${filename}`);
        assert.match(content, /\/api\/v1\/airQualityScale\//, filename);
        assert.doesNotMatch(content, /__AIR_QUALITY_SCALE_PROXY_/, `${filename} 不应泄露模板标记`);
        assert.match(content, /\/api\/v2\/weather\//, `${filename} 应保留天气代理规则`);
    }
});

test("页面关闭选项后，同一文件名的客户端配置不代理 airQualityScale", async () => {
    const encoded = encodeConfig({ Proxy: { AirQualityScale: false } });
    for (const filename of CONFIG_FILES) {
        const content = await downloadConfig(`/conf/${encoded}/${filename}`);
        assert.doesNotMatch(content, /\/api\/v1\/airQualityScale\//, filename);
        assert.doesNotMatch(content, /__AIR_QUALITY_SCALE_PROXY_/, `${filename} 不应泄露模板标记`);
    }
});
