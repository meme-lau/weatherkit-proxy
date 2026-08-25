import { Hono } from "hono/tiny";
import ColorfulClouds from "./class/ColorfulClouds.mjs";
import HonoWorkerAdapter from "./class/HonoWorkerAdapter.mjs";
import QWeather from "./class/QWeather.mjs";
import WeatherAlerts from "./class/WeatherAlerts.mjs";
import buildSettings from "./function/buildSettings.mjs";
import { decodeConfigPayload } from "./function/configPayload.mjs";
import configs, { renderClientConfig } from "./function/configs/index.mjs";
import database from "./function/database.mjs";
import { renderIndex } from "./function/indexPage.mjs";
import parseWeatherKitURL from "./function/parseWeatherKitURL.mjs";
import { Response } from "./process/Response.mjs";
import { fetch, merge, requestContext, set } from "./utils/index.mjs";

function getCSTDateString() {
    const d = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const minutes = String(d.getUTCMinutes()).padStart(2, "0");
    const seconds = String(d.getUTCSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const app = new Hono();

// 方法守卫：仅允许 GET 与 HEAD 请求，其余方法一律返回 405，避免代理接口被写入/删除类方法滥用。
// 路径白名单守卫：仅放行首页、配置下载与 WeatherKit API 代理路径，其余一律返回 404。
// 与下方仅注册 app.get 的 catch-all 路由 /:rest{.*} 配合：白名单内路径继续走后续路由，其余在进入路由前即被拦截。
const WEATHER_ALERTS_PATH = "/api/v1/weatherAlerts";
const ALLOWED_PATH_PREFIXES = ["/conf/", "/p/", "/api/v1/availability/", "/api/v1/airQualityScale/", "/api/v2/weather/"];

// /p/:configBase64/:rest 路由放行的 WeatherKit 上游子路径前缀（rest 形态，无前导斜杠）。
// 仅允许这些前缀，避免 /p/ 后乱输入被原样转发给 Apple，或被 routeRewrite 当作自定义上游 host（SSRF）。
const ALLOWED_REST_PREFIXES = ["api/v1/availability/", "api/v1/airQualityScale/", "api/v2/weather/"];

// 校验 rest 是否为合法的 WeatherKit 上游子路径，供 /p/ 与裸主机 catch-all 路由共用。
// /p/<单段> 等不合法形态会从 /p/ 路由滑落到 catch-all，此处一并拦截，避免转发给 Apple。
function isAllowedWeatherKitRest(rest = "") {
    return rest === WEATHER_ALERTS_PATH.slice(1) || ALLOWED_REST_PREFIXES.some(prefix => rest.startsWith(prefix));
}

app.use("*", async (c, next) => {
    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
        c.header("Allow", "GET, HEAD");
        return c.text("Method Not Allowed", 405);
    }
    const { pathname } = new URL(c.req.url);
    if (pathname === "/" || pathname === WEATHER_ALERTS_PATH || ALLOWED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
        return next();
    }
    return c.text("Not Found", 404);
});

// 根路径路由，返回配置列表及一键导入可视化页面
app.get("/", async c => {
    const host = c.req.header("host");
    const protocol = c.req.url.startsWith("https") ? "https" : "http";
    const htmlContent = renderIndex(host, protocol);
    c.header("Content-Type", "text/html; charset=utf-8");
    return c.body(htmlContent);
});

// 配置下载通用处理逻辑
async function handleConfigDownload(c, filename, configParam) {
    const filenameParam = (filename || "").toLowerCase();
    const defaultConfigContent = configs[filenameParam];

    if (!defaultConfigContent) {
        return c.text("Configuration not found", 404);
    }

    let proxyAirQualityScale = true;
    let domainPolicy = "DIRECT";
    if (configParam) {
        try {
            const pageConfig = JSON.parse(decodeConfigPayload(configParam));
            proxyAirQualityScale = pageConfig?.Proxy?.AirQualityScale !== false;
            domainPolicy = normalizeDomainPolicy(pageConfig?.Proxy?.DomainPolicy);
        } catch (e) {
            console.warn("Failed to read proxy options from config:", e);
        }
    }
    const configContent = renderClientConfig(filenameParam, proxyAirQualityScale);

    // 获取当前的主机名
    const host = c.req.header("host");
    const cstDateString = getCSTDateString();

    let targetHost = host;
    if (configParam) {
        targetHost = `${host}/p/${configParam}`;
    }

    // 动态替换默认的主机名占位符
    // __HOST__：携带 base64 配置路径（host/p/<config>），供 weather 与 weatherAlerts 等逐用户配置接口使用；
    // __PLAIN_HOST__：裸主机（不含配置路径），availability/airQualityScale 等无需配置的接口使用。
    const domainOnly = host.split(":")[0];
    let content = configContent.replaceAll("__PLAIN_HOST__", host);
    content = content.replaceAll("__HOST__", targetHost);
    content = content.replaceAll("__DOMAIN__", domainOnly);
    content = content.replaceAll("__DOMAIN_POLICY__", formatDomainPolicy(filenameParam, domainPolicy));
    content = content.replaceAll("__DATE__", cstDateString);

    c.header("Content-Type", "text/plain; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filenameParam}"`);
    return c.body(content);
}

function normalizeDomainPolicy(value) {
    if (typeof value !== "string") return "DIRECT";
    const policy = value.trim();
    return policy && policy.length <= 64 && !/[,\r\n\0]/.test(policy) ? policy : "DIRECT";
}

function formatDomainPolicy(filename, policy) {
    if (filename === "weatherkit-proxy.snippet") {
        if (/^direct$/i.test(policy)) return "direct";
        if (/^reject$/i.test(policy)) return "reject";
    }
    if (filename === "weatherkit-proxy.yaml") {
        return JSON.stringify(policy);
    }
    return policy;
}

// 配置下载路由，将占位域名替换为当前部署的域名（兼容旧参数形式）
app.get("/conf/:filename", async c => {
    return handleConfigDownload(c, c.req.param("filename"), c.req.query("config"));
});

// 新增配置下载路由，支持将 base64 直接放在 URL 路径中
app.get("/conf/:configBase64/:filename", async c => {
    return handleConfigDownload(c, c.req.param("filename"), c.req.param("configBase64"));
});

function parseQueryArguments(query = {}) {
    const args = {};
    for (const [key, value] of Object.entries(query)) {
        if (key.includes(".")) {
            set(args, key, value);
        } else {
            args[key] = value;
        }
    }
    return args;
}

async function buildWeatherAlertsDetails(url, Settings, requestHeaders = {}) {
    const identifier = url.searchParams.get("ids");
    const pageIdentifier = QWeather.IsWeatherAlertPageIdentifier(identifier);
    const coordinates = WeatherAlerts.ParseCoordinateIdentifier(identifier);
    if (!pageIdentifier && !coordinates) return null;

    // Coordinate identifiers were generated only by the removed API alert
    // providers. Keep legacy requests away from Apple, which accepts UUIDs.
    if (coordinates) return [];
    if (!WeatherAlerts.CanUseProvider(Settings)) return [];

    const language = url.searchParams.get("lang")?.trim() || "zh-CN";
    const parameters = { country: url.searchParams.get("country")?.trim().toUpperCase() || "CN", language, version: "v1" };

    const sourceUrl = QWeather.BuildWeatherAlertPageURL(identifier, language)?.toString();
    const provider = new QWeather(parameters);
    const extracted = await provider.WeatherAlertWeb(sourceUrl, requestHeaders);
    const attributionUrl = QWeather.BuildWeatherAlertPageURL(identifier, language, false)?.toString();

    const detailsCountry = identifier.match(/-([0-9]{9})$/)?.[1]?.startsWith("101") ? "CN" : "";
    const alerts = WeatherAlerts.Build(extracted, {
        attributionUrl,
        identifier,
        language,
        countryCode: detailsCountry,
        eventSource: detailsCountry,
    });
    return alerts;
}

async function handleWeatherRequest(c, queryArguments = {}) {
    let executionCtx;
    try {
        executionCtx = c.executionCtx;
    } catch {
        // Vercel Edge or testing environment might not have executionCtx
    }

    const store = {
        executionCtx,
        Settings: null,
    };
    return requestContext.run(store, async () => {
        // 使用 HonoWorkerAdapter 构建标准的内部统一请求对象 $request
        const $request = await HonoWorkerAdapter.buildRequest(c.req);
        const url = new URL($request.url);

        // 解析请求 Query 里的扁平参数，并与已有的 queryArguments 进行合并
        const urlArguments = parseQueryArguments(c.req.query());
        const finalArguments = {};
        merge(finalArguments, queryArguments, urlArguments);

        // 提前解析 URL 参数，用于并发预取第三方数据
        const { Settings, Configs } = buildSettings(database, finalArguments);
        store.Settings = Settings;

        if (url.pathname === WEATHER_ALERTS_PATH) {
            const weatherAlerts = await buildWeatherAlertsDetails(url, Settings, $request.headers);
            if (weatherAlerts !== null) {
                c.header("Access-Control-Allow-Origin", "*");
                c.header("Cache-Control", "max-age=0");
                c.header("Content-Type", "application/json; charset=utf-8");
                return c.body(JSON.stringify(weatherAlerts), 200);
            }
        }

        // Settings.DataSets 只控制代理解析和注入哪些 FlatBuffer root slot。
        // Apple 的原始 dataSets 请求必须保持不变，避免把客户端最低数据需求误当成代理处理范围。
        const parameters = parseWeatherKitURL(url);
        const enviroments = {
            colorfulClouds: new ColorfulClouds(parameters, Settings?.API?.ColorfulClouds?.Token || "Y2FpeXVuX25vdGlmeQ=="),
            qWeather: new QWeather(parameters, Settings?.API?.QWeather?.Token, Settings?.API?.QWeather?.Host),
            country: parameters.country,
        };

        // 并发预取第三方数据，与 Apple API 调用同时进行
        const preFetched = {};
        const shouldReplace = Settings?.Weather?.Replace?.includes(parameters.country);

        if (shouldReplace) {
            if (parameters.dataSets?.includes("currentWeather")) {
                switch (Settings?.Weather?.Provider) {
                    case "QWeather":
                        preFetched.currentWeather = enviroments.qWeather.WeatherNow().catch(() => undefined);
                        break;
                    case "ColorfulClouds":
                        preFetched.currentWeather = enviroments.colorfulClouds.CurrentWeather().catch(() => undefined);
                        break;
                }
            }
            if (parameters.dataSets?.includes("forecastNextHour")) {
                switch (Settings?.NextHour?.Provider) {
                    case "QWeather":
                        preFetched.forecastNextHour = enviroments.qWeather.Minutely().catch(() => undefined);
                        break;
                    case "ColorfulClouds":
                    default:
                        preFetched.forecastNextHour = enviroments.colorfulClouds.Minutely().catch(() => undefined);
                        break;
                }
            }
            if (parameters.dataSets?.includes("airQuality")) {
                // 污染物预取
                switch (Settings?.AirQuality?.Current?.Pollutants?.Provider) {
                    case "QWeather":
                        preFetched.pollutants = enviroments.qWeather.CurrentAirQuality().catch(() => undefined);
                        break;
                    case "ColorfulClouds":
                    default:
                        preFetched.pollutants = enviroments.colorfulClouds.CurrentAirQuality().catch(() => undefined);
                        break;
                }
                // 指数预取（独立于污染物，仅限外部提供商）
                const indexProvider = Settings?.AirQuality?.Current?.Index?.Provider;
                if (indexProvider && indexProvider !== "Calculate") {
                    switch (indexProvider) {
                        case "QWeather":
                            preFetched.index = enviroments.qWeather.CurrentAirQuality(Settings?.AirQuality?.Current?.Index?.ForceCNPrimaryPollutants).catch(() => undefined);
                            break;
                        case "ColorfulCloudsUS":
                        case "ColorfulCloudsCN":
                            preFetched.index = enviroments.colorfulClouds.CurrentAirQuality(indexProvider === "ColorfulCloudsUS", Settings?.AirQuality?.Current?.Index?.ForceCNPrimaryPollutants).catch(() => undefined);
                            break;
                    }
                }
                // 昨日对比预取
                const comparisonProvider = Settings?.AirQuality?.Comparison?.Yesterday?.IndexProvider;
                if (comparisonProvider === "ColorfulCloudsCN" || comparisonProvider === "ColorfulCloudsUS") {
                    preFetched.yesterdayHourly = enviroments.colorfulClouds.prefetchYesterdayHourly().catch(() => undefined);
                } else if (comparisonProvider === "QWeather") {
                    const locationsGrid = await QWeather.GetLocationsGrid(undefined, () => {});
                    preFetched.locationsGrid = locationsGrid;
                    const locationInfo = QWeather.GetLocationInfo(locationsGrid, parameters.latitude, parameters.longitude);
                    preFetched.yesterdayHourly = enviroments.qWeather.prefetchYesterdayAirQuality(locationInfo).catch(() => undefined);
                }
            }
        }

        // 提前触发并等待 Apple API 响应，第三方预取在后台并行执行
        let $response = await fetch($request);
        $response.headers["content-length"] = undefined;

        /* todo */
        // globalThis.$arguments = url.searchParams.get("Weather_Provider");

        $response = await Response($request, $response, { preFetched, enviroments, parameters, Settings, Configs });
        return HonoWorkerAdapter.writeResponse(c, $response);
    });
}

// 带配置前缀的请求路由
app.get("/p/:configBase64/:rest{.*}", async c => {
    // rest 必须是合法的 WeatherKit 上游子路径，否则不转发，避免乱输入打到 Apple 或被当作自定义上游 host
    if (!isAllowedWeatherKitRest(c.req.param("rest") || "")) {
        return c.text("Not Found", 404);
    }
    const configBase64 = c.req.param("configBase64");
    let queryArguments = {};
    try {
        if (configBase64) {
            const decoded = decodeConfigPayload(configBase64);
            queryArguments = JSON.parse(decoded);
        }
    } catch (e) {
        console.error("Failed to parse configBase64:", e);
    }
    return handleWeatherRequest(c, queryArguments);
});

// 不带配置前缀的默认请求路由
app.get("/:rest{.*}", async c => {
    // rest 必须是合法的 WeatherKit 上游子路径；拦截 /p/<单段> 等滑落到此路由的不合法形态
    if (!isAllowedWeatherKitRest(c.req.param("rest") || "")) {
        return c.text("Not Found", 404);
    }
    return handleWeatherRequest(c, {});
});

app.onError((e, c) => {
    console.error(`${e}`);
    return c.body(`${e}`, 500);
});

export default app;
