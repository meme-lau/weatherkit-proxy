import { Hono } from "hono/tiny";
import HonoWorkerAdapter from "./class/HonoWorkerAdapter.mjs";
import ColorfulClouds from "./class/ColorfulClouds.mjs";
import QWeather from "./class/QWeather.mjs";
import configs from "./function/configs.mjs";
import database from "./function/database.mjs";
import parseWeatherKitURL from "./function/parseWeatherKitURL.mjs";
import setENV from "./function/setENV.mjs";
import { renderIndex } from "./function/indexPage.mjs";
import { Response } from "./process/Response.mjs";
import { fetch } from "./utils/index.mjs";

const app = new Hono();

// 根路径路由，返回配置列表及一键导入可视化页面
app.get("/", async c => {
    const host = c.req.header("host");
    const protocol = c.req.url.startsWith("https") ? "https" : "http";
    const htmlContent = renderIndex(host, protocol);
    c.header("Content-Type", "text/html; charset=utf-8");
    return c.body(htmlContent);
});

// 配置下载路由，将占位域名替换为当前部署的域名
app.get("/conf/:filename", async c => {
    const filenameParam = (c.req.param("filename") || "").toLowerCase();
    const configContent = configs[filenameParam];

    if (!configContent) {
        return c.text("Configuration not found", 404);
    }

    // 获取当前的主机名
    const host = c.req.header("host");

    // 动态替换默认的主机名占位符
    const content = configContent.replaceAll("__HOST__", host);

    c.header("Content-Type", "text/plain; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filenameParam}"`);
    return c.body(content);
});

app.all("/:rest{.*}", async c => {
    // 使用 HonoWorkerAdapter 构建标准的内部统一请求对象 $request
    const $request = await HonoWorkerAdapter.buildRequest(c.req);
    const url = new URL($request.url);

    // 提前解析 URL 参数，用于并发预取第三方数据
    const { Settings, Caches, Configs } = setENV("iRingo", "WeatherKit", database);
    const parameters = parseWeatherKitURL(url);
    const enviroments = {
        colorfulClouds: new ColorfulClouds(parameters, Settings?.API?.ColorfulClouds?.Token || "Y2FpeXVuX25vdGlmeQ=="),
        qWeather: new QWeather(parameters, Settings?.API?.QWeather?.Token, Settings?.API?.QWeather?.Host),
        country: parameters.country,
    };

    // 并发预取第三方数据，与 Apple API 调用同时进行
    const preFetched = {};
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
        // 昨日对比预取（ColorfulClouds 的 YesterdayAirQuality 需要 /hourly 数据）
        const comparisonProvider = Settings?.AirQuality?.Comparison?.Yesterday?.IndexProvider;
        if (comparisonProvider === "ColorfulCloudsCN" || comparisonProvider === "ColorfulCloudsUS") {
            preFetched.yesterdayHourly = enviroments.colorfulClouds.prefetchYesterdayHourly().catch(() => undefined);
        }
    }

    // 并发等待 Apple API 响应 and 所有第三方预取完成
    const [appleResponse] = await Promise.all([fetch($request), ...Object.values(preFetched).filter(Boolean)]);
    let $response = appleResponse;
    $response.headers["content-length"] = undefined;

    /* todo */
    // globalThis.$arguments = url.searchParams.get("Weather_Provider");

    $response = await Response($request, $response, { preFetched, enviroments, parameters, Settings, Caches, Configs });
    return HonoWorkerAdapter.writeResponse(c, $response);
});

app.onError((e, c) => {
    console.error(`${e}`);
    return c.body(`${e}`, 500);
});

export default app;
