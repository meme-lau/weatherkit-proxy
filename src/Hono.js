import { Hono } from "hono/tiny";
import ColorfulClouds from "./class/ColorfulClouds.mjs";
import HonoWorkerAdapter from "./class/HonoWorkerAdapter.mjs";
import QWeather from "./class/QWeather.mjs";
import configs from "./function/configs.mjs";
import database from "./function/database.mjs";
import { renderIndex } from "./function/indexPage.mjs";
import parseWeatherKitURL from "./function/parseWeatherKitURL.mjs";
import buildSettings from "./function/buildSettings.mjs";
import { Response } from "./process/Response.mjs";
import { set, merge, fetch, requestContext } from "./utils/index.mjs";

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
    const configContent = configs[filenameParam];

    if (!configContent) {
        return c.text("Configuration not found", 404);
    }

    // 获取当前的主机名
    const host = c.req.header("host");
    const cstDateString = getCSTDateString();

    let targetHost = host;
    if (configParam) {
        targetHost = `${host}/p/${configParam}`;
    }

    // 动态替换默认的主机名占位符
    const domainOnly = host.split(":")[0];
    let content = configContent.replaceAll("__HOST__", targetHost);
    content = content.replaceAll("__DOMAIN__", domainOnly);
    content = content.replaceAll("__DATE__", cstDateString);

    c.header("Content-Type", "text/plain; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filenameParam}"`);
    return c.body(content);
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
app.all("/p/:configBase64/:rest{.*}", async c => {
    const configBase64 = c.req.param("configBase64");
    let queryArguments = {};
    try {
        if (configBase64) {
            const decoded = decodeURIComponent(escape(atob(configBase64)));
            queryArguments = JSON.parse(decoded);
        }
    } catch (e) {
        console.error("Failed to parse configBase64:", e);
    }
    return handleWeatherRequest(c, queryArguments);
});

// 不带配置前缀的默认请求路由
app.all("/:rest{.*}", async c => {
    return handleWeatherRequest(c, {});
});

app.onError((e, c) => {
    console.error(`${e}`);
    return c.body(`${e}`, 500);
});

export default app;
