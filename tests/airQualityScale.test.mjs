import assert from "node:assert/strict";
import test from "node:test";
import { Response } from "../src/process/Response.mjs";

const APPLE = "https://weatherkit.apple.com/api/v1/airQualityScale";

/** 临时替换 globalThis.fetch，按 URL 返回预设响应；返回恢复函数。 */
function stubFetch(handler) {
    const original = globalThis.fetch;
    globalThis.fetch = async (url, _opts) => {
        const { status, body, contentType } = handler(url.toString());
        return new globalThis.Response(body, {
            status,
            headers: { "content-type": contentType ?? "application/json" },
        });
    };
    return () => {
        globalThis.fetch = original;
    };
}

test("airQualityScale: Apple 200 直接透传，不触发重试", async () => {
    let called = false;
    const restore = stubFetch(() => {
        called = true;
        return { status: 200, body: "{}" };
    });
    try {
        const res = await Response({ url: `${APPLE}/zh-Hans-CN/HJ6332012.2604`, method: "GET", headers: {} }, { status: 200, headers: { "content-type": "application/json" }, body: '{"name":"HJ6332012.2604"}' }, {});
        assert.equal(res.status, 200);
        assert.equal(res.body, '{"name":"HJ6332012.2604"}');
        assert.equal(called, false, "200 透传不应触发额外 fetch");
    } finally {
        restore();
    }
});

test("airQualityScale: 404 用 2604 重试命中，透传 Apple 最新标尺", async () => {
    const restore = stubFetch(url => {
        // 仅重试的 2604 URL 会走到这里（首次 404 已由 $response 模拟）
        assert.ok(url.includes("HJ6332012.2604"), `重试 URL 应为 2604，实际: ${url}`);
        return { status: 200, body: JSON.stringify({ name: "HJ6332012.2604", aqi: { range: [0, 500] } }) };
    });
    try {
        const res = await Response({ url: `${APPLE}/zh-Hans-CN/HJ6332012.2414`, method: "GET", headers: {} }, { status: 404, headers: { "content-type": "text/plain" }, body: "Not Found" }, {});
        assert.equal(res.status, 200);
        assert.equal(JSON.parse(res.body).name, "HJ6332012.2604");
    } finally {
        restore();
    }
});

test("airQualityScale: 2604 重试仍 404，回退本地构建", async () => {
    const calls = [];
    const restore = stubFetch(url => {
        calls.push(url);
        return { status: 404, body: "Not Found", contentType: "text/plain" };
    });
    try {
        const res = await Response({ url: `${APPLE}/zh-Hans-CN/HJ6332012.2414`, method: "GET", headers: {} }, { status: 404, headers: { "content-type": "text/plain" }, body: "Not Found" }, {});
        assert.equal(res.status, 200, "本地构建应返回 200");
        const scale = JSON.parse(res.body);
        assert.equal(scale.name, "HJ6332012.2414", "本地构建保留客户端请求的标尺名");
        assert.ok(Array.isArray(scale.aqi?.categories), "本地构建产出完整 categories");
        assert.equal(calls.length, 1, "仅发起一次 2604 重试");
        assert.ok(calls[0].includes("HJ6332012.2604"));
    } finally {
        restore();
    }
});

test("airQualityScale: 标尺名已是 2604 仍 404，不重试直接本地构建", async () => {
    let called = false;
    const restore = stubFetch(() => {
        called = true;
        return { status: 404, body: "Not Found" };
    });
    try {
        const res = await Response({ url: `${APPLE}/zh-Hans-CN/EPA_NowCast.2604`, method: "GET", headers: {} }, { status: 404, headers: { "content-type": "text/plain" }, body: "Not Found" }, {});
        assert.equal(res.status, 200, "本地构建兜底");
        assert.equal(JSON.parse(res.body).name, "EPA_NowCast.2604");
        assert.equal(called, false, "已是 2604 不应再次重试");
    } finally {
        restore();
    }
});
