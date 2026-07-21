import assert from "node:assert/strict";
import test from "node:test";
import { renderIndex } from "../src/function/indexPage.mjs";
import app from "../src/Hono.js";

const CONFIG_FILES = [
    ["weatherkit-proxy.sgmodule", "weatherkit-proxy-aqs.sgmodule"],
    ["weatherkit-proxy.srmodule", "weatherkit-proxy-aqs.srmodule"],
    ["weatherkit-proxy.plugin", "weatherkit-proxy-aqs.plugin"],
    ["weatherkit-proxy.stoverride", "weatherkit-proxy-aqs.stoverride"],
    ["weatherkit-proxy.yaml", "weatherkit-proxy-aqs.yaml"],
    ["weatherkit-proxy.snippet", "weatherkit-proxy-aqs.snippet"],
];

async function downloadConfig(path) {
    const response = await app.request(`https://proxy.example${path}`, { headers: { host: "proxy.example" } });
    assert.equal(response.status, 200);
    return response.text();
}

test("配置页提供默认关闭的 airQualityScale 代理开关", () => {
    const html = renderIndex("proxy.example", "https");
    const input = html.match(/<input[^>]*id="proxyAirQualityScale"[^>]*>/)?.[0];
    assert.ok(input, "配置页应包含 airQualityScale 代理开关");
    assert.doesNotMatch(input, /\bchecked\b/, "代理开关默认不应勾选");
});

test("客户端配置默认不代理 airQualityScale", async () => {
    for (const [filename] of CONFIG_FILES) {
        const content = await downloadConfig(`/conf/${filename}`);
        assert.doesNotMatch(content, /\/api\/v1\/airQualityScale\//, filename);
        assert.doesNotMatch(content, /__AIR_QUALITY_SCALE_PROXY_/, `${filename} 不应泄露模板标记`);
        assert.match(content, /\/api\/v2\/weather\//, `${filename} 应保留天气代理规则`);
    }
});

test("页面配置开启后，所有客户端配置均代理 airQualityScale", async () => {
    for (const [, filename] of CONFIG_FILES) {
        const content = await downloadConfig(`/conf/${filename}`);
        assert.match(content, /\/api\/v1\/airQualityScale\//, filename);
        assert.doesNotMatch(content, /__AIR_QUALITY_SCALE_PROXY_/, `${filename} 不应泄露模板标记`);
    }
});
