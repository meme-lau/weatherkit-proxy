import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Builder, ByteBuffer } from "flatbuffers";
import ColorfulClouds from "../src/class/ColorfulClouds.mjs";
import QWeather, { QWEATHER_ALERT_TIMEOUT_SECONDS, QWEATHER_PUBLIC_TOKEN } from "../src/class/QWeather.mjs";
import WeatherAlerts from "../src/class/WeatherAlerts.mjs";
import WeatherKit2 from "../src/class/WeatherKit2.mjs";
import { encodeConfigPayload } from "../src/function/configPayload.mjs";
import app from "../src/Hono.js";
import { Response } from "../src/process/Response.mjs";

const QWEATHER_ALERT_HTML = `<!doctype html>
<html>
    <head><title>建邺天气预警</title></head>
    <body>
        <h1 class="c-submenu__location">建邺</h1>
        <span class="c-submenu__location-adm">江苏 南京</span>
        <div class="c-city-warning-events warning--orange">
            <h3>建邺区气象台发布雷暴橙色预警信号。</h3>
            <p>发布日期：2026-07-31T11:00:00+08:00</p>
            <p class="warning-events__txt">预计午后将出现雷暴天气。</p>
            <div class="warning-explain"><h4>预警标准</h4><p>可能伴有短时强降水。</p></div>
            <div class="warning-defense__txt"><p>1. 注意防范雷电。</p><p>2. 远离高大树木。</p></div>
        </div>
        <div class="c-city-warning-around"></div>
        <a class="data-source__txt">预警数据来源：国家预警信息发布中心</a>
    </body>
</html>`;

const QWEATHER_ALERT_ORDER_HTML = `<!doctype html>
<html>
    <head><title>建邺天气预警</title></head>
    <body>
        <h1 class="c-submenu__location">建邺</h1>
        <div class="c-city-warning-events warning--red">
            <h3>建邺区气象台发布大风红色预警信号。</h3>
            <p>发布日期：2026-08-14T09:00:00+08:00</p>
            <p class="warning-events__txt">大风红色预警正在生效。</p>
        </div>
        <div class="c-city-warning-events warning--orange">
            <h3>建邺区气象台发布暴雨橙色预警信号。</h3>
            <p>发布日期：2026-08-14T10:00:00+08:00</p>
            <p class="warning-events__txt">暴雨橙色预警正在生效。</p>
        </div>
        <div class="c-city-warning-events warning--yellow">
            <h3>建邺区气象台发布雷电黄色预警信号。</h3>
            <p>发布日期：2026-08-14T11:00:00+08:00</p>
            <p class="warning-events__txt">雷电黄色预警正在生效。</p>
        </div>
        <div class="c-city-warning-events warning--blue">
            <h3>建邺区气象台发布台风蓝色预警信号。</h3>
            <p>发布日期：2026-08-14T12:00:00+08:00</p>
            <p class="warning-events__txt">台风蓝色预警正在生效。</p>
        </div>
        <div class="c-city-warning-events warning--blue">
            <h3>建邺区气象台解除台风蓝色预警信号。</h3>
            <p>发布日期：2026-08-14T13:00:00+08:00</p>
            <p class="warning-events__txt">台风蓝色预警已经解除。</p>
        </div>
        <div class="c-city-warning-around"></div>
    </body>
</html>`;

test("Vercel 将 weatherAlerts 详情请求路由到函数", () => {
    const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
    const routeIndex = config.routes.findIndex(route => route.src === "/api/v1/weatherAlerts");
    const fallbackIndex = config.routes.findIndex(route => route.src === "/(.*)" && route.status === 404);

    assert.notEqual(routeIndex, -1);
    assert.equal(config.routes[routeIndex].dest, "src/Vercel.js");
    assert.ok(routeIndex < fallbackIndex, "weatherAlerts 路由应位于兜底 404 之前");
});

test("weatherAlerts 只接管合法的明文经纬度标识", () => {
    assert.deepEqual(WeatherAlerts.ParseCoordinateIdentifier("32.115,118.814"), { latitude: "32.115", longitude: "118.814" });
    assert.deepEqual(WeatherAlerts.ParseCoordinateIdentifier("-90,-180"), { latitude: "-90", longitude: "-180" });
    for (const identifier of ["32.115%2C118.814", ".115,118.814", "91,118", "32,181", "35889ee6-fa82-5f9f-8e49-fad78c4f383a", "https://evil.example"]) {
        assert.equal(WeatherAlerts.ParseCoordinateIdentifier(identifier), null, identifier);
    }
});

test("QWeather 网页标识与 Apple 提供的详情 URL 使用严格白名单", () => {
    assert.equal(QWeather.IsWeatherAlertPageIdentifier("jianye-101190110"), true);
    assert.equal(QWeather.IsWeatherAlertPageIdentifier("jian'an-101180407"), true);
    for (const identifier of ["jianye-10119011", "jianye-1011901100", "101190110", "35889ee6-fa82-5f9f-8e49-fad78c4f383a", "https://evil.example"]) {
        assert.equal(QWeather.IsWeatherAlertPageIdentifier(identifier), false, identifier);
    }

    const sourceUrl = "https://www.qweather.com/severe-weather/jianye-101190110.html?from=AppleWeatherService";
    assert.equal(QWeather.ParseWeatherAlertPageURL(sourceUrl), "jianye-101190110");
    assert.equal(QWeather.ParseWeatherAlertPageURL("https://www.qweather.com/en/severe-weather/jianye-101190110.html?from=AppleWeatherService"), "jianye-101190110");
    for (const url of ["https://www.qweather.com/severe-weather/jianye-101190110.html", "https://www.qweather.com/severe-weather/jianye-101190110.html?from=AppleWeatherService&lang=zh-CN", "https://evil.example/severe-weather/jianye-101190110.html?from=AppleWeatherService"]) {
        assert.equal(QWeather.ParseWeatherAlertPageURL(url), undefined, url);
    }
    assert.equal(QWeather.BuildWeatherAlertPageURL("jianye-101190110", "en-US").toString(), "https://www.qweather.com/en/severe-weather/jianye-101190110.html?from=AppleWeatherService");
    assert.equal(QWeather.BuildAppleAlertDetailsURL("jianye-101190110", "zh-CN"), "https://weatherkit.apple.com/alertDetails/index.html?ids=jianye-101190110&lang=zh-CN&party=qweather");
});

test("QWeather 网页解析正文、等级与指南，并使用受控请求头", async () => {
    const extracted = QWeather.ExtractWeatherAlertPage(QWEATHER_ALERT_HTML);
    assert.equal(extracted.areaName, "建邺");
    assert.equal(extracted.source, "建邺区气象台");
    assert.equal(extracted.alerts[0].eventName, "雷暴橙色预警信号。");
    assert.equal(extracted.alerts[0].severity, "severe");
    assert.equal(extracted.alerts[0].urgency, "expected");
    assert.equal(extracted.alerts[0].issuedTime, "2026-07-31T03:00:00.000Z");
    assert.deepEqual(extracted.alerts[0].guidelines, ["注意防范雷电。", "远离高大树木。"]);

    const originalFetch = globalThis.fetch;
    let requested;
    globalThis.fetch = async (input, init = {}) => {
        requested = { url: typeof input === "string" ? input : input.url, headers: new Headers(init.headers), signal: init.signal };
        return new globalThis.Response(QWEATHER_ALERT_HTML, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
    };
    try {
        const sourceUrl = "https://www.qweather.com/severe-weather/jianye-101190110.html?from=AppleWeatherService";
        const weatherAlerts = await new QWeather({ country: "CN", language: "zh-CN" }, null).WeatherAlertWeb(sourceUrl, { "User-Agent": "WeatherKit/Test" });
        assert.equal(requested.url, sourceUrl);
        assert.equal(requested.headers.get("Accept"), "text/html,application/xhtml+xml");
        assert.equal(requested.headers.get("Referer"), "https://www.qweather.com/");
        assert.equal(requested.headers.get("User-Agent"), "WeatherKit/Test");
        assert.ok(requested.signal instanceof AbortSignal, "网页请求应设置超时信号");
        assert.equal(weatherAlerts.detailsUrl, "https://weatherkit.apple.com/alertDetails/index.html?ids=jianye-101190110&lang=zh-CN&party=qweather");
        assert.equal(weatherAlerts.alerts[0].areaId, "101190110");
        assert.equal(weatherAlerts.alerts[0].areaName, "建邺");
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("QWeather 网页沿用紧急程度、最新同类、解除状态与严重程度排序", () => {
    const extracted = QWeather.ExtractWeatherAlertPage(QWEATHER_ALERT_ORDER_HTML);
    const built = WeatherAlerts.Build(extracted, {
        attributionUrl: "https://www.qweather.com/severe-weather/jianye-101190110.html",
        countryCode: "CN",
        eventSource: "CN",
        identifier: "jianye-101190110",
        language: "zh-CN",
    });

    assert.deepEqual(
        built.map(alert => alert.description),
        ["大风红色预警", "暴雨橙色预警", "雷电黄色预警", "建邺区气象台解除台风蓝色预警"],
    );
    assert.deepEqual(
        built.map(alert => alert.urgency),
        ["immediate", "expected", "future", "past"],
    );
    assert.deepEqual(
        built.map(alert => alert.precedence),
        [0, 1, 2, 3],
    );
    assert.deepEqual(built.at(-1).responses, ["allClear"]);

    const summaries = ["大风", "暴雨", "雷电", "台风"].map(description => ({
        description,
        responses: [],
        severity: "UNKNOWN",
        urgency: "UNKNOWN",
    }));
    WeatherAlerts.mergeAlerts(summaries, extracted.alerts);
    assert.deepEqual(
        summaries.map(alert => alert.urgency),
        ["IMMEDIATE", "EXPECTED", "FUTURE", "PAST"],
    );
    assert.deepEqual(summaries.at(-1).responses, ["ALLCLEAR"]);
});

test("天气预警只保留网页补全与 WeatherKit，旧 API 配置无请求迁移到网页", () => {
    assert.equal(typeof QWeather.prototype.WeatherAlert, "undefined");
    assert.equal(typeof ColorfulClouds.prototype.WeatherAlert, "undefined");
    assert.equal(WeatherAlerts.ResolveProvider({}), "QWeatherWeb");
    assert.equal(WeatherAlerts.ResolveProvider({ WeatherAlerts: { Provider: "unknown" } }), "WeatherKit");
    assert.equal(WeatherAlerts.ResolveProvider({ WeatherAlerts: { Provider: "QWeather" } }), "QWeatherWeb");
    assert.equal(WeatherAlerts.ResolveProvider({ WeatherAlerts: { Provider: "ColorfulClouds" } }), "QWeatherWeb");
    assert.equal(WeatherAlerts.CanUseProvider({}), true);
    assert.equal(WeatherAlerts.CanUseProvider({ WeatherAlerts: { Provider: "QWeatherWeb" } }), true);
    assert.equal(WeatherAlerts.CanUseProvider({ WeatherAlerts: { Provider: "WeatherKit" } }), false);
});

test("和风普通天气 Token 为空时继续使用上游公共 Key", async () => {
    assert.equal(QWEATHER_PUBLIC_TOKEN, "bdd98ec1d87747f3a2e8b1741a5af796");
    assert.equal(QWEATHER_ALERT_TIMEOUT_SECONDS, 10);
    await withMockedFetch(
        {
            code: "200",
            fxLink: "https://www.qweather.com/weather/nanjing-101190101.html",
            now: {
                cloud: "0",
                dew: "20",
                feelsLike: "30",
                humidity: "60",
                precip: "0",
                pressure: "1000",
                pubTime: "2026-08-14T12:00+08:00",
                temp: "28",
                text: "晴",
                vis: "10",
                wind360: "90",
                windSpeed: "10",
            },
        },
        async requested => {
            await new QWeather({ country: "CN", language: "zh-CN", latitude: "32.115", longitude: "118.814" }, null).WeatherNow();
            assert.equal(requested.length, 1);
            assert.equal(requested[0].url, "https://api.qweather.com/v7/weather/now?location=118.814,32.115");
            assert.equal(requested[0].headers.get("X-QW-Api-Key"), QWEATHER_PUBLIC_TOKEN);
        },
    );
});

test("WeatherAlerts.Build 归一化中英文发布标题并保留 CAP 事件名", () => {
    const issuedTime = "2026-08-10T00:00:00.000Z";
    const fixtures = [
        ["浦东新区气象台发布暴雨橙色预警信号。", "暴雨", "暴雨橙色预警"],
        ["臺北市氣象台發布大雨黃色預警信號。", "大雨", "大雨黃色預警"],
        ["天津市气象台更新雷雨大风蓝色预警", "天津市气象台更新雷雨大风蓝色预警", "雷雨大风蓝色预警"],
        ["江西省气象台2026年08月13日20时45分变更暴雨橙色预警信号[II/严重]", "暴雨", "暴雨橙色预警"],
        ["香港天文台變更雷雨黃色預警信號【黃色】", "雷雨", "雷雨黃色預警"],
        ["Nanjing Meteorological Observatory issues a blue typhoon warning", "Typhoon", "Blue Typhoon Warning"],
        ["Pudong New Area Meteorological Observatory issued an orange rainstorm warning", "Rainstorm", "Orange Rainstorm Warning"],
        ["Severe Thunderstorm Warning issued August 10 at 2:26AM EDT until August 10 at 3:30AM EDT by NWS Grand Rapids MI", "Severe Thunderstorm Warning", "Severe Thunderstorm Warning"],
        ["Flash Flood Warning issued for Los Angeles", "Flash Flood Warning.", "Flash Flood Warning"],
    ];

    const descriptions = fixtures.map(([description, eventName], index) => {
        const built = WeatherAlerts.Build(
            {
                alerts: [
                    {
                        description,
                        eventName,
                        guidelines: [],
                        identifier: `title-${index}`,
                        issuedTime,
                        message: description,
                        phenomenon: "Met",
                        reportedAt: issuedTime,
                        severity: "minor",
                        standard: "",
                    },
                ],
                areaName: "",
                source: "QWeather",
            },
            {
                attributionUrl: "https://www.qweather.com/",
                identifier: "title-grammar-fixtures",
                language: "en-US",
            },
        );
        assert.equal(built.length, 1);
        return built[0].description;
    });

    assert.deepEqual(
        descriptions,
        fixtures.map(([, , expected]) => expected),
    );
});

test("WeatherAlerts.Build 仅合并同一事件，不折叠不同的 Met 预警", () => {
    const alerts = WeatherAlerts.Build(
        {
            alerts: [
                {
                    description: "Flood Watch.",
                    eventName: "Flood Watch.",
                    identifier: "flood-old",
                    issuedTime: "2026-08-10T00:00:00.000Z",
                    phenomenon: "Met",
                    severity: "moderate",
                    token: "flood-watch",
                },
                {
                    description: "Severe Thunderstorm Warning",
                    eventName: "Severe Thunderstorm Warning",
                    identifier: "thunderstorm",
                    issuedTime: "2026-08-10T01:00:00.000Z",
                    phenomenon: "Met",
                    severity: "severe",
                    token: "severe-thunderstorm",
                },
                {
                    description: "Flood Watch",
                    eventName: "Flood Watch",
                    identifier: "flood-latest",
                    issuedTime: "2026-08-10T02:00:00.000Z",
                    phenomenon: "Met",
                    severity: "moderate",
                    token: "flood-watch",
                },
            ],
            areaName: "Grand Rapids",
            source: "NWS Grand Rapids MI",
        },
        {
            attributionUrl: "https://www.weather.gov/",
            countryCode: "US",
            identifier: "42.96,-85.67",
            language: "en-US",
        },
    );

    assert.equal(alerts.length, 2);
    assert.deepEqual(
        alerts.map(alert => [alert.description, alert.issuedTime]),
        [
            ["Severe Thunderstorm Warning", "2026-08-10T01:00:00.000Z"],
            ["Flood Watch", "2026-08-10T02:00:00.000Z"],
        ],
    );
});

test("v1 weatherAlerts 对默认、旧 API 与关闭配置的坐标标识均不发起请求", async () => {
    const legacyProviders = [undefined, "QWeather", "ColorfulClouds", "WeatherKit"];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async input => assert.fail(`坐标型预警标识不应发起请求: ${input}`);
    try {
        for (const provider of legacyProviders) {
            const prefix = provider ? `/p/${encodeConfigPayload(JSON.stringify({ WeatherAlerts: { Provider: provider } }))}` : "";
            const response = await app.request(`https://proxy.example${prefix}/api/v1/weatherAlerts?lang=zh-CN&ids=32.115,118.814&country=CN`);
            assert.equal(response.status, 200, provider);
            assert.deepEqual(await response.json(), [], provider);
        }
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("v1 weatherAlerts 默认按 9 位 Location ID 抓取和风网页并返回 Apple JSON", async () => {
    const originalFetch = globalThis.fetch;
    let requested;
    globalThis.fetch = async (input, init = {}) => {
        requested = { url: typeof input === "string" ? input : input.url, headers: new Headers(init.headers) };
        return new globalThis.Response(QWEATHER_ALERT_HTML, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
    };
    try {
        const response = await app.request("https://proxy.example/api/v1/weatherAlerts?lang=zh-CN&ids=jianye-101190110&country=CN", {
            headers: { "User-Agent": "Safari/Test" },
        });
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(requested.url, "https://www.qweather.com/severe-weather/jianye-101190110.html?from=AppleWeatherService");
        assert.equal(requested.headers.get("User-Agent"), "Safari/Test");
        assert.equal(body.length, 1);
        assert.equal(body[0].areaId, "101190110");
        assert.equal(body[0].areaName, "建邺");
        assert.equal(body[0].description, "雷暴橙色预警");
        assert.equal(body[0].attributionURL, "https://www.qweather.com/severe-weather/jianye-101190110.html");
        assert.equal(body[0].severity, "severe");
        assert.equal(body[0].source, "建邺区气象台");
        assert.equal(body[0].urgency, "expected");
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("v1 旧 API 预警配置改走网页，WeatherKit 配置保持关闭", async () => {
    const originalFetch = globalThis.fetch;
    const requested = [];
    globalThis.fetch = async (input, init = {}) => {
        requested.push({ url: typeof input === "string" ? input : input.url, headers: new Headers(init.headers) });
        return new globalThis.Response(QWEATHER_ALERT_HTML, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
    };
    try {
        for (const provider of ["QWeather", "ColorfulClouds"]) {
            const encoded = encodeConfigPayload(JSON.stringify({ WeatherAlerts: { Provider: provider } }));
            const response = await app.request(`https://proxy.example/p/${encoded}/api/v1/weatherAlerts?lang=zh-CN&ids=jianye-101190110&country=CN`);
            assert.equal(response.status, 200);
            assert.equal((await response.json()).length, 1, provider);
        }
        const disabled = encodeConfigPayload(JSON.stringify({ WeatherAlerts: { Provider: "WeatherKit" } }));
        const disabledResponse = await app.request(`https://proxy.example/p/${disabled}/api/v1/weatherAlerts?lang=zh-CN&ids=jianye-101190110&country=CN`);
        assert.deepEqual(await disabledResponse.json(), []);
        assert.equal(requested.length, 2);
        assert.ok(requested.every(request => request.url === "https://www.qweather.com/severe-weather/jianye-101190110.html?from=AppleWeatherService"));
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("v1 非中国 QWeather 地区标识不会被默认标成 CN", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new globalThis.Response(QWEATHER_ALERT_HTML, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
    try {
        const response = await app.request("https://proxy.example/api/v1/weatherAlerts?lang=en&ids=london-123456789");
        const body = await response.json();
        assert.equal(body.length, 1);
        assert.equal(body[0].countryCode, "");
        assert.equal(body[0].eventSource, "");
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("v1 weatherAlerts 的 Apple 原生 UUID 继续透传上游", async () => {
    const identifier = "35889ee6-fa82-5f9f-8e49-fad78c4f383a";
    const originalFetch = globalThis.fetch;
    let upstreamUrl;
    globalThis.fetch = async input => {
        upstreamUrl = typeof input === "string" ? input : input?.url;
        return new globalThis.Response(JSON.stringify([{ id: identifier, source: "Apple" }]), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    };

    try {
        const response = await app.request(`https://proxy.example/api/v1/weatherAlerts?lang=zh-CN&ids=${identifier}`);
        assert.equal(upstreamUrl, `https://weatherkit.apple.com/api/v1/weatherAlerts?lang=zh-CN&ids=${identifier}`);
        assert.deepEqual(await response.json(), [{ id: identifier, source: "Apple" }]);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("预警摘要只补缺失字段，并使用本仓库固定 schema 的枚举别名", () => {
    const target = {
        description: "高温",
        phenomenon: "Other",
        responses: [],
        severity: "UNKNOWN",
        certainty: "UNKNOWN",
        importance: "UNKNOWN",
        significance: "UNKNOWN",
        urgency: "UNKNOWN",
        source: "国家预警信息发布中心",
    };
    WeatherAlerts.mergeAlerts(
        [target],
        [
            {
                description: "高温橙色预警",
                eventName: "高温",
                phenomenon: "Met",
                guidelines: ["做好应急准备。", "危险解除后恢复正常。"],
                severity: "severe",
                certainty: "likely",
                importance: "high",
                significance: "warning",
                urgency: "expected",
                source: "南京市气象台",
            },
        ],
    );

    assert.equal(target.description, "高温橙色预警");
    assert.equal(target.phenomenon, "高温", "v2 摘要应使用具体 eventName，不能使用通用 CAP 分类");
    assert.deepEqual(target.responses, ["PREPARE", "ALLCLEAR"]);
    assert.equal(target.severity, "SEVERE");
    assert.equal(target.certainty, "LIKELY");
    assert.equal(target.importance, "HIGHER");
    assert.equal(target.significance, "WARNING");
    assert.equal(target.urgency, "EXPECTED");
    assert.equal(target.source, "国家预警信息发布中心", "已有 Apple 来源不得被覆盖");

    const unsupported = { significance: "UNKNOWN" };
    WeatherAlerts.mergeAlerts([unsupported], [{ significance: "watch" }]);
    assert.equal(unsupported.significance, "UNKNOWN", "固定 schema 不支持的枚举不得伪装成有效值");

    const established = { description: "Apple 已有的具体雷暴预警" };
    WeatherAlerts.mergeAlerts([established], [{ description: "高温橙色预警", eventName: "高温", phenomenon: "Met" }]);
    assert.equal(established.description, "Apple 已有的具体雷暴预警", "具体 Apple 摘要不得被覆盖");

    const establishedLevel = { description: "高温红色预警" };
    WeatherAlerts.mergeAlerts([establishedLevel], [{ description: "高温黄色预警", eventName: "高温", phenomenon: "Met" }]);
    assert.equal(establishedLevel.description, "高温红色预警", "已有 Apple 颜色等级不得被第三方降级覆盖");

    const establishedEnglishLevel = { description: "Red Typhoon Warning" };
    WeatherAlerts.mergeAlerts([establishedEnglishLevel], [{ description: "Blue Typhoon Warning", eventName: "Typhoon Warning", phenomenon: "Met" }]);
    assert.equal(establishedEnglishLevel.description, "Red Typhoon Warning", "已有 Apple 英文颜色等级不得被第三方覆盖");
});

test("预警摘要识别英文颜色词与繁体预警用语中的同一事件", () => {
    const english = { description: "Typhoon Warning" };
    WeatherAlerts.mergeAlerts(
        [english],
        [
            {
                description: "Nanjing Meteorological Observatory issues a blue typhoon warning",
                phenomenon: "Met",
            },
        ],
    );
    assert.equal(english.description, "Blue Typhoon Warning");

    const traditionalChinese = { description: "雷雨大風" };
    WeatherAlerts.mergeAlerts(
        [traditionalChinese],
        [
            {
                description: "臺北市氣象台更新雷雨大風藍色預警",
                phenomenon: "Met",
            },
        ],
    );
    assert.equal(traditionalChinese.description, "雷雨大風藍色預警");
});

test("v2 weatherAlerts 默认从 Apple 的 QWeather 页面链接补全并改写集合详情", async () => {
    const sourceUrl = "https://www.qweather.com/severe-weather/jianye-101190110.html?from=AppleWeatherService";
    const originalBytes = createWeatherAlertRoot(
        "QWeather",
        [
            {
                areaId: "",
                areaName: "",
                description: "雷暴",
                phenomenon: "Other",
                source: "QWeather",
                token: "",
            },
        ],
        { detailsUrl: sourceUrl },
    );
    const parameters = { country: "CN", dataSets: ["weatherAlerts"], language: "zh-Hans", latitude: 32.115, longitude: 118.814 };
    const originalFetch = globalThis.fetch;
    let requested;
    globalThis.fetch = async (input, init = {}) => {
        requested = { url: typeof input === "string" ? input : input.url, headers: new Headers(init.headers) };
        return new globalThis.Response(QWEATHER_ALERT_HTML, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
    };

    try {
        const response = await Response(
            {
                url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-CN/32.115/118.814?country=CN&dataSets=weatherAlerts",
                headers: { "User-Agent": "WeatherKit/Test" },
            },
            {
                bodyBytes: originalBytes,
                headers: { "Content-Type": "application/vnd.apple.flatbuffer" },
                status: 200,
            },
            {
                Settings: { Weather: { Replace: [] } },
                parameters,
                enviroments: {
                    country: "CN",
                    qWeather: new QWeather(parameters, null),
                },
            },
        );
        const decoded = WeatherKit2.decode(new ByteBuffer(new Uint8Array(response.body)), ["weatherAlerts"]).weatherAlerts;

        assert.equal(requested.url, sourceUrl);
        assert.equal(requested.headers.get("User-Agent"), "WeatherKit/Test");
        assert.notDeepEqual(new Uint8Array(response.body), originalBytes);
        assert.equal(decoded.detailsUrl, "https://weatherkit.apple.com/alertDetails/index.html?ids=jianye-101190110&lang=zh-CN&party=qweather");
        assert.equal(decoded.metadata.attributionUrl, sourceUrl);
        assert.equal(decoded.alerts.length, 1, "网页源不得新增 Apple 未给出的预警");
        assert.equal(decoded.alerts[0].areaId, "101190110");
        assert.equal(decoded.alerts[0].areaName, "建邺");
        assert.equal(decoded.alerts[0].description, "雷暴橙色预警");
        assert.equal(decoded.alerts[0].severity, "SEVERE");
        assert.equal(decoded.alerts[0].urgency, "EXPECTED");
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("v2 weatherAlerts 的 QWeather 网页 403 时连同 providerLogo 保留原始字节与详情 URL", async () => {
    const sourceUrl = "https://www.qweather.com/severe-weather/jianye-101190110.html?from=AppleWeatherService";
    const originalBytes = createWeatherAlertRoot("QWeather", undefined, {
        detailsUrl: sourceUrl,
        metadata: { providerLogo: "https://apple.example/provider-logo.png" },
    });
    const parameters = { country: "CN", dataSets: ["weatherAlerts"], language: "zh-CN", latitude: 32.115, longitude: 118.814 };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new globalThis.Response("denied", { status: 403, headers: { "content-type": "text/html" } });

    try {
        const response = await Response(
            {
                url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-CN/32.115/118.814?country=CN&dataSets=weatherAlerts",
                headers: {},
            },
            {
                bodyBytes: originalBytes,
                headers: { "Content-Type": "application/vnd.apple.flatbuffer" },
                status: 200,
            },
            {
                Settings: { Weather: { Replace: [] }, WeatherAlerts: { Provider: "QWeatherWeb" } },
                parameters,
                enviroments: {
                    country: "CN",
                    qWeather: new QWeather(parameters, null),
                },
            },
        );
        assert.deepEqual(new Uint8Array(response.body), originalBytes);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("v2 weatherAlerts 显式关闭补全时不请求第三方并保留原始字节", async () => {
    const originalBytes = createWeatherAlertRoot("National Early Warning Center");
    const response = await Response(
        {
            url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-CN/32.115/118.814?country=CN&dataSets=weatherAlerts",
        },
        {
            bodyBytes: originalBytes,
            headers: { "Content-Type": "application/vnd.apple.flatbuffer" },
            status: 200,
        },
        {
            Settings: { Weather: { Replace: [] }, WeatherAlerts: { Provider: "WeatherKit" } },
            parameters: { country: "CN", dataSets: ["weatherAlerts"], language: "zh-Hans", latitude: 32.115, longitude: 118.814 },
            enviroments: {
                country: "CN",
                qWeather: { WeatherAlertWeb: async () => assert.fail("显式关闭时不应请求和风预警网页") },
            },
        },
    );

    assert.deepEqual(new Uint8Array(response.body), originalBytes);
});

test("v2 weatherAlerts 在非天气替换国家也会补全，并保留单条 Apple 链接与来源", async () => {
    const sourceUrl = "https://www.qweather.com/en/severe-weather/london-123456789.html?from=AppleWeatherService";
    const originalBytes = createWeatherAlertRoot("QWeather", undefined, { detailsUrl: sourceUrl });
    const response = await Response(
        {
            url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-US/32.115/118.814?country=US&dataSets=weatherAlerts",
        },
        {
            bodyBytes: originalBytes,
            headers: { "Content-Type": "application/vnd.apple.flatbuffer" },
            status: 200,
        },
        {
            Settings: { Weather: { Replace: [] }, WeatherAlerts: { Provider: "QWeatherWeb" } },
            parameters: { country: "US", dataSets: ["weatherAlerts"], language: "zh-Hans", latitude: 32.115, longitude: 118.814 },
            enviroments: {
                country: "US",
                qWeather: {
                    WeatherAlertWeb: async url => ({
                        ...normalizedPageAlerts(),
                        attributionUrl: url,
                        detailsUrl: "https://weatherkit.apple.com/alertDetails/index.html?ids=london-123456789&lang=zh-CN&party=qweather",
                    }),
                },
            },
        },
    );
    const decoded = WeatherKit2.decode(new ByteBuffer(new Uint8Array(response.body)), ["weatherAlerts"]);
    const alerts = decoded.weatherAlerts;

    assert.notDeepEqual(new Uint8Array(response.body), originalBytes);
    assert.equal(alerts.detailsUrl, "https://weatherkit.apple.com/alertDetails/index.html?ids=london-123456789&lang=zh-CN&party=qweather");
    assert.equal(alerts.metadata.attributionUrl, sourceUrl);
    assert.equal(alerts.alerts.length, 1, "不得新增第三方预警");
    assert.equal(alerts.alerts[0].areaId, "320100");
    assert.equal(alerts.alerts[0].areaName, "南京市");
    assert.equal(alerts.alerts[0].description, "高温橙色预警");
    assert.equal(alerts.alerts[0].eventOnsetTime, 1_785_664_080);
    assert.equal(alerts.alerts[0].phenomenon, "高温", "v2 摘要应保留具体预警类型，不能写成通用 CAP 分类 Met");
    assert.deepEqual(alerts.alerts[0].responses, ["MONITOR"]);
    assert.equal(alerts.alerts[0].detailsUrl, "https://apple.example/alert/1");
    assert.equal(alerts.alerts[0].source, "QWeather");
});

test("v2 weatherAlerts 将同类型通用摘要替换为最新具体预警", async () => {
    const olderTime = Math.trunc(new Date("2026-08-10T10:00+08:00").getTime() / 1000);
    const latestTime = Math.trunc(new Date("2026-08-10T12:00+08:00").getTime() / 1000);
    const originalBytes = createWeatherAlertRoot("National Early Warning Center", [
        {
            description: "恶劣天气",
            effectiveTime: olderTime,
            id: "00000000-0000-4000-8000-000000000001",
            issuedTime: olderTime,
            severity: "SEVERE",
            token: "1201",
        },
        {
            description: "极端天气",
            effectiveTime: latestTime,
            id: "00000000-0000-4000-8000-000000000002",
            issuedTime: latestTime,
            severity: "UNKNOWN",
            token: "1201",
        },
    ]);
    const response = await Response(
        {
            url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-CN/30.2/120.2?country=CN&dataSets=weatherAlerts",
        },
        {
            bodyBytes: originalBytes,
            headers: { "Content-Type": "application/vnd.apple.flatbuffer" },
            status: 200,
        },
        {
            Settings: { Weather: { Replace: [] }, WeatherAlerts: { Provider: "QWeatherWeb" } },
            parameters: { country: "CN", dataSets: ["weatherAlerts"], language: "zh-Hans", latitude: 30.2, longitude: 120.2 },
            enviroments: {
                country: "CN",
                qWeather: {
                    WeatherAlertWeb: async () => ({
                        alerts: [
                            {
                                description: "地质灾害气象风险橙色预警",
                                eventName: "地质灾害气象风险",
                                issuedTime: "2026-08-10T10:00+08:00",
                                phenomenon: "Met",
                                severity: "severe",
                                token: "1201",
                            },
                            {
                                description: "地质灾害气象风险黄色预警",
                                eventName: "地质灾害气象风险",
                                issuedTime: "2026-08-10T12:00+08:00",
                                phenomenon: "Met",
                                severity: "moderate",
                                token: "1201",
                                urgency: "future",
                            },
                        ],
                    }),
                },
            },
        },
    );
    const decoded = WeatherKit2.decode(new ByteBuffer(new Uint8Array(response.body)), ["weatherAlerts"]);
    const alerts = decoded.weatherAlerts.alerts;

    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].description, "地质灾害气象风险黄色预警");
    assert.equal(alerts[0].issuedTime, latestTime);
    assert.equal(alerts[0].severity, "MODERATE");
    assert.equal(alerts[0].urgency, "FUTURE");
});

test("v2 weatherAlerts 对非 QWeather 页面保持字节级透传", async () => {
    const originalBytes = createWeatherAlertRoot("The Weather Channel");
    let pageRequests = 0;
    const response = await Response(
        {
            url: "https://weatherkit.apple.com/api/v2/weather/en-US/32.115/118.814?country=US&dataSets=weatherAlerts",
        },
        {
            bodyBytes: originalBytes,
            headers: { "Content-Type": "application/vnd.apple.flatbuffer" },
            status: 200,
        },
        {
            Settings: { Weather: { Replace: [] }, WeatherAlerts: { Provider: "QWeatherWeb" } },
            parameters: { country: "US", dataSets: ["weatherAlerts"], language: "en", latitude: 32.115, longitude: 118.814 },
            enviroments: {
                country: "US",
                qWeather: {
                    WeatherAlertWeb: async url => {
                        pageRequests++;
                        assert.equal(url, "https://apple.example/alerts");
                        return undefined;
                    },
                },
            },
        },
    );

    assert.equal(pageRequests, 1);
    assert.deepEqual(new Uint8Array(response.body), originalBytes);
});

test("v2 weatherAlerts 的旧彩云配置迁移到网页源", async () => {
    const originalBytes = createWeatherAlertRoot("National Early Warning Center");
    let webRequests = 0;
    const response = await Response(
        {
            url: "https://weatherkit.apple.com/api/v2/weather/zh-Hans-US/32.115/118.814?country=US&dataSets=weatherAlerts",
        },
        {
            bodyBytes: originalBytes,
            headers: { "Content-Type": "application/vnd.apple.flatbuffer" },
            status: 200,
        },
        {
            Settings: {
                Weather: { Replace: [] },
                WeatherAlerts: { Provider: "ColorfulClouds" },
                API: { ColorfulClouds: { Token: null } },
            },
            parameters: { country: "US", dataSets: ["weatherAlerts"], language: "zh-Hans", latitude: 32.115, longitude: 118.814 },
            enviroments: {
                country: "US",
                qWeather: {
                    WeatherAlertWeb: async () => {
                        webRequests++;
                        return { alerts: [] };
                    },
                },
            },
        },
    );

    assert.equal(webRequests, 1);
    assert.deepEqual(new Uint8Array(response.body), originalBytes);
});

async function withMockedFetch(responseBody, callback) {
    const originalFetch = globalThis.fetch;
    const requested = [];
    globalThis.fetch = async (input, init = {}) => {
        const url = typeof input === "string" ? input : (input?.url ?? String(input));
        requested.push({ url, headers: new Headers(init.headers ?? input?.headers ?? {}), signal: init.signal });
        return new globalThis.Response(JSON.stringify(responseBody), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    };
    try {
        await callback(requested);
    } finally {
        globalThis.fetch = originalFetch;
    }
}

function normalizedPageAlerts() {
    return {
        alerts: [
            {
                areaId: "320100",
                areaName: "南京市",
                certainty: "unknown",
                description: "南京市气象台发布高温橙色预警",
                effectiveTime: "2026-08-02T09:48:00.000Z",
                eventOnsetTime: "2026-08-02T09:48:00.000Z",
                expireTime: "2026-08-03T09:48:00.000Z",
                eventName: "高温",
                guidelines: ["密切关注天气变化。"],
                identifier: "202608021748225061499885",
                issuedTime: "2026-08-02T09:48:00.000Z",
                message: "南京市气象台继续发布高温橙色预警信号。",
                phenomenon: "Met",
                reportedAt: "2026-08-02T09:48:00.000Z",
                responses: ["monitor"],
                severity: "severe",
                source: "南京市气象台",
                standard: "",
                token: "1009",
                urgency: "unknown",
            },
        ],
        areaName: "南京市",
        source: "南京市气象台",
    };
}

function createWeatherAlertRoot(providerName, alertOverrides, collectionOverrides = {}) {
    const builder = new Builder(4096);
    const defaultAlert = {
        areaId: "",
        areaName: "",
        attributionUrl: "https://apple.example/alerts",
        certainty: "UNKNOWN",
        countryCode: "US",
        description: "高温",
        detailsUrl: "https://apple.example/alert/1",
        effectiveTime: 1_785_573_420,
        eventEndTime: 0,
        eventOnsetTime: 0,
        eventSource: "US",
        expireTime: 1_785_659_820,
        id: "3c9fabb5-4d8e-3d1a-9579-bc3c5b050c1f",
        importance: "HIGHER",
        issuedTime: 1_785_573_420,
        phenomenon: "Other",
        responses: [],
        severity: "SEVERE",
        significance: "UNKNOWN",
        source: providerName,
        token: "11B09",
        urgency: "UNKNOWN",
    };
    const alerts = Array.isArray(alertOverrides) ? alertOverrides.map(overrides => ({ ...defaultAlert, ...overrides })) : [defaultAlert];
    const root = WeatherKit2.encode(builder, "all", {
        weatherAlerts: {
            metadata: {
                attributionUrl: "https://apple.example/alerts",
                expireTime: 1_785_623_706,
                language: "zh-CN",
                latitude: 32.115,
                longitude: 118.814,
                providerName,
                readTime: 1_785_623_406,
                reportedTime: 1_785_573_420,
                temporarilyUnavailable: false,
                sourceType: "STATION",
                ...(collectionOverrides.metadata ?? {}),
            },
            alerts,
            detailsUrl: collectionOverrides.detailsUrl ?? "https://apple.example/alerts",
        },
    });
    builder.finish(root);
    return builder.asUint8Array().slice();
}
