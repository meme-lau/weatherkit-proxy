import * as flatbuffers from "flatbuffers";
import AirQuality from "../class/AirQuality.mjs";
import AirQualityScale from "../class/AirQualityScale.mjs";
import ColorfulClouds from "../class/ColorfulClouds.mjs";
import QWeather from "../class/QWeather.mjs";
import Weather from "../class/Weather.mjs";
import WeatherKit2 from "../class/WeatherKit2.mjs";
import database from "../function/database.mjs";
import parseWeatherKitURL from "../function/parseWeatherKitURL.mjs";
import setENV from "../function/setENV.mjs";
import { Console, Storage } from "../utils/index.mjs";
/***************** Processing *****************/
export async function Response($request, $response, context = {}) {
    // 解构预取数据（从 Hono.js 并发预取传入）
    const { preFetched = {}, enviroments: preEnviroments, parameters: preParameters, Settings: preSettings, Caches: preCaches, Configs: preConfigs } = context;
    // 解构URL
    const url = new URL($request.url);
    Console.debug("url:", url.toJSON());
    // 获取连接参数
    const PATHs = url.pathname.split("/").filter(Boolean);
    Console.debug("PATHs:", PATHs);
    // 解析格式
    const FORMAT = ($response.headers?.["Content-Type"] ?? $response.headers?.["content-type"])?.split(";")?.[0];
    Console.debug("FORMAT:", FORMAT);
    // 打印 Apple 原始响应日志
    Console.debug("[Apple Response]", url.pathname, `status: ${$response.status}`, `content-type: ${FORMAT}`);
    if (url.pathname.startsWith("/api/v1/airQualityScale/")) {
        try {
            const preview = typeof $response.body === "string" ? $response.body : $response.bodyBytes ? new TextDecoder().decode(new Uint8Array($response.bodyBytes)) : "(binary)";
            Console.log(`[Apple Response Body] ${url.pathname}`, preview.length > 2000 ? `${preview.slice(0, 2000)}...` : preview);
        } catch (e) {
            Console.log(`[Apple Response Body] ${url.pathname}`, "(无法解析)", e.message);
        }
    }
    /**
     * 设置
     * @type {{Settings: import('../types').Settings}}
     */
    const { Settings, Caches, Configs } = preSettings ? { Settings: preSettings, Caches: preCaches, Configs: preConfigs } : setENV("iRingo", "WeatherKit", database);
    Console.logLevel = Settings.LogLevel;
    // 创建空数据
    let body = {};
    // airQualityScale 请求：Apple 200 直接透传，404 则本地构建
    if (url.pathname.startsWith("/api/v1/airQualityScale/")) {
        if ($response.status === 200) {
            Console.log(`[iRingo] airQualityScale Apple 返回 200，透传: ${url.pathname}`);
            return $response;
        }
        // Apple 返回 404 或其他错误，本地构建
        const pathParts = url.pathname.split("/").filter(Boolean);
        const language = pathParts[3] ?? "en";
        const scaleName = pathParts[4] ?? "";
        const localScale = AirQualityScale.buildScale(language, scaleName);
        if (localScale) {
            Console.log(`[iRingo] airQualityScale Apple 返回 ${$response.status}，本地构建: ${scaleName}`);
            $response.status = 200;
            $response.headers = { ...$response.headers, ...localScale.headers };
            $response.body = localScale.body;
            return $response;
        }
    }
    // 格式判断
    switch (FORMAT) {
        case undefined: // 视为无body
            break;
        case "application/x-www-form-urlencoded":
        case "text/plain":
        default:
            break;
        case "application/x-mpegURL":
        case "application/x-mpegurl":
        case "application/vnd.apple.mpegurl":
        case "audio/mpegurl":
            break;
        case "text/xml":
        case "text/html":
        case "text/plist":
        case "application/xml":
        case "application/plist":
        case "application/x-plist":
            break;
        case "text/vtt":
        case "application/vtt":
            break;
        case "text/json":
        case "application/json":
            body = JSON.parse($response.body);
            Console.debug(`[Apple Response] ${url.pathname}`, body);
            switch (url.hostname) {
                case "weatherkit.apple.com":
                    // 路径判断
                    if (url.pathname.startsWith("/api/v1/availability/")) {
                        body = Configs?.Availability?.v2;
                    }
                    break;
            }
            $response.body = JSON.stringify(body);
            break;
        case "application/vnd.apple.flatbuffer":
        case "application/protobuf":
        case "application/x-protobuf":
        case "application/vnd.google.protobuf":
        case "application/grpc":
        case "application/grpc+proto":
        case "application/octet-stream": {
            let rawBody = $response.bodyBytes ? new Uint8Array($response.bodyBytes) : ($response.body ?? new Uint8Array());
            switch (FORMAT) {
                case "application/vnd.apple.flatbuffer": {
                    const parameters = preParameters || parseWeatherKitURL(url);
                    const shouldReplace = Settings?.Weather?.Replace?.includes(parameters.country);
                    if (!shouldReplace) {
                        Console.log(`[iRingo] 国家 ${parameters.country} 无需替换，直接跳过 FlatBuffer 编解码。`);
                        break;
                    }

                    // 解析FlatBuffer
                    const ByteBuffer = new flatbuffers.ByteBuffer(rawBody);
                    const Builder = new flatbuffers.Builder();
                    // 主机判断
                    switch (url.hostname) {
                        case "weatherkit.apple.com":
                            // 路径判断
                            if (url.pathname.startsWith("/api/v2/weather/")) {
                                body = WeatherKit2.decode(ByteBuffer, "all");
                                // // 打印 Apple 原始 airQuality 数据
                                // if (body?.airQuality) {
                                //     Console.log(`[Apple 原始 airQuality]`, JSON.stringify(body.airQuality, null, 2));
                                // }
                                // 优先使用 Hono.js 预构建的环境实例，避免重复创建
                                const parameters = preParameters || parseWeatherKitURL(url);
                                const enviroments = preEnviroments || {
                                    colorfulClouds: new ColorfulClouds(parameters, Settings?.API?.ColorfulClouds?.Token || "Y2FpeXVuX25vdGlmeQ=="),
                                    qWeather: new QWeather(parameters, Settings?.API?.QWeather?.Token, Settings?.API?.QWeather?.Host),
                                    country: parameters.country,
                                };

                                const allSections = ["currentWeather", "forecastDaily", "forecastHourly", "forecastNextHour", "airQuality"];

                                await Promise.all(
                                    parameters.dataSets.map(async dataSet => {
                                        switch (dataSet) {
                                            case "airQuality": {
                                                body.airQuality = await InjectAirQuality(body.airQuality, Settings, Caches, enviroments, preFetched);
                                                break;
                                            }
                                            case "currentWeather": {
                                                body.currentWeather = await InjectCurrentWeather(body.currentWeather, Settings, enviroments, preFetched.currentWeather);
                                                break;
                                            }
                                            case "forecastDaily": {
                                                body.forecastDaily = await InjectForecastDaily(body.forecastDaily, Settings, enviroments, preFetched.forecastDaily);
                                                break;
                                            }
                                            case "forecastHourly": {
                                                body.forecastHourly = await InjectForecastHourly(body.forecastHourly, Settings, enviroments, preFetched.forecastHourly);
                                                break;
                                            }
                                            case "forecastNextHour": {
                                                body.forecastNextHour = await InjectForecastNextHour(body.forecastNextHour, Settings, enviroments, preFetched.forecastNextHour);
                                                break;
                                            }
                                            default:
                                                break;
                                        }
                                    }),
                                );

                                // 去掉所有 providerLogo
                                allSections.forEach(s => {
                                    if (body?.[s]?.metadata?.providerLogo) {
                                        body[s].metadata.providerLogo = undefined;
                                    }
                                });
                                const WeatherData = WeatherKit2.encode(Builder, "all", body);
                                Builder.finish(WeatherData);
                                break;
                            }
                            break;
                    }
                    rawBody = Builder.asUint8Array(); // Of type `Uint8Array`.
                    break;
                }
                case "application/protobuf":
                case "application/x-protobuf":
                case "application/vnd.google.protobuf":
                    break;
                case "application/grpc":
                case "application/grpc+proto":
                    break;
                case "application/octet-stream":
                    break;
            }
            // 写入二进制数据
            $response.body = rawBody;
            break;
        }
    }
    return $response;
}

/**
 * 注入当前天气数据
 * @param {any} currentWeather - 当前天气数据对象
 * @param {import('../types').Settings} Settings - 设置对象
 * @param {any} enviroments - 环境变量
 * @param {Promise<any>} [preFetchedData] - 预取的数据
 * @returns {Promise<any>} 注入后的当前天气数据
 */
async function InjectCurrentWeather(currentWeather, Settings, enviroments, preFetchedData) {
    Console.info("☑️ InjectCurrentWeather");
    if (!Settings?.Weather?.Replace?.includes(enviroments.country)) {
        Console.warn("InjectCurrentWeather", `Unreplaced country: ${enviroments.country}`);
        Console.info("✅ InjectCurrentWeather");
        return currentWeather;
    }
    let newCurrentWeather;
    if (preFetchedData) {
        newCurrentWeather = await preFetchedData;
        Console.info("InjectCurrentWeather", "使用预取数据");
    } else {
        switch (Settings?.Weather?.Provider) {
            case "WeatherKit":
            default:
                break;
            case "QWeather": {
                newCurrentWeather = await enviroments.qWeather.WeatherNow();
                break;
            }
            case "ColorfulClouds": {
                newCurrentWeather = await enviroments.colorfulClouds.CurrentWeather();
                break;
            }
        }
    }
    if (newCurrentWeather?.metadata) {
        newCurrentWeather.metadata = { ...currentWeather?.metadata, ...newCurrentWeather.metadata };
        currentWeather = { ...currentWeather, ...newCurrentWeather };
    }
    Console.info("✅ InjectCurrentWeather");
    return currentWeather;
}

/**
 * 注入每日天气预报数据
 * @param {any} forecastDaily - 每日预报数据对象
 * @param {import('../types').Settings} Settings - 设置对象
 * @param {any} enviroments - 环境变量
 * @param {Promise<any>} [preFetchedData] - 预取的数据
 * @returns {Promise<any>} 注入后的每日预报数据
 */
async function InjectForecastDaily(forecastDaily, Settings, enviroments, preFetchedData) {
    Console.info("☑️ InjectForecastDaily");
    const replaceDaily = Settings?.Weather?.ReplaceDaily ?? true;
    if (!replaceDaily || !Settings?.Weather?.Replace?.includes(enviroments.country)) {
        Console.warn("InjectForecastDaily", `Unreplaced or skipped country: ${enviroments.country}`);
        Console.info("✅ InjectForecastDaily");
        return forecastDaily;
    }
    let newForecastDaily;
    if (preFetchedData) {
        newForecastDaily = await preFetchedData;
        Console.info("InjectForecastDaily", "使用预取数据");
    } else {
        switch (Settings?.Weather?.Provider) {
            case "WeatherKit":
            default:
                break;
            case "QWeather": {
                newForecastDaily = await enviroments.qWeather.Daily();
                break;
            }
            case "ColorfulClouds": {
                const dailysteps = forecastDaily.days?.length || 11;
                const begin = forecastDaily.days?.[0]?.forecastStart || undefined;
                newForecastDaily = await enviroments.colorfulClouds.Daily(dailysteps, begin);
                break;
            }
        }
    }
    if (newForecastDaily?.metadata) {
        forecastDaily.metadata = { ...forecastDaily?.metadata, ...newForecastDaily.metadata };
        Weather.mergeForecast(forecastDaily?.days, newForecastDaily?.days);
    }
    Console.info("✅ InjectForecastDaily");
    return forecastDaily;
}

/**
 * 注入小时天气预报数据
 * @param {any} forecastHourly - 小时预报数据对象
 * @param {import('../types').Settings} Settings - 设置对象
 * @param {any} enviroments - 环境变量
 * @returns {Promise<any>} 注入后的小时预报数据
 */
async function InjectForecastHourly(forecastHourly, Settings, enviroments, preFetchedData) {
    Console.info("☑️ InjectForecastHourly");
    const replaceHourly = Settings?.Weather?.ReplaceHourly ?? true;
    if (!replaceHourly || !Settings?.Weather?.Replace?.includes(enviroments.country)) {
        Console.warn("InjectForecastHourly", `Unreplaced or skipped country: ${enviroments.country}`);
        Console.info("✅ InjectForecastHourly");
        return forecastHourly;
    }
    let newForecastHourly;
    if (preFetchedData) {
        newForecastHourly = await preFetchedData;
        Console.info("InjectForecastHourly", "使用预取数据");
    } else {
        switch (Settings?.Weather?.Provider) {
            case "WeatherKit":
            default:
                break;
            case "QWeather": {
                newForecastHourly = await enviroments.qWeather.Hourly();
                break;
            }
            case "ColorfulClouds": {
                Console.info("✅ InjectForecastHourly ColorfulClouds");
                const hourlysteps = forecastHourly.hours?.length || 273;
                const begin = forecastHourly.hours?.[0]?.forecastStart || undefined;
                newForecastHourly = await enviroments.colorfulClouds.ForecastHourly(hourlysteps, begin);
                break;
            }
        }
    }
    if (newForecastHourly?.metadata) {
        forecastHourly.metadata = { ...forecastHourly?.metadata, ...newForecastHourly.metadata };
        forecastHourly.hours = Weather.mergeForecast(forecastHourly?.hours, newForecastHourly?.hours);
    }
    Console.info("✅ InjectForecastHourly");
    return forecastHourly;
}

/**
 * 注入下一小时天气预报数据
 * @param {any} forecastNextHour - 下一小时预报数据对象
 * @param {import('../types').Settings} Settings - 设置对象
 * @param {any} enviroments - 环境变量
 * @param {Promise<any>} [preFetchedData] - 预取的数据
 * @returns {Promise<any>} 注入后的下一小时预报数据
 */
async function InjectForecastNextHour(forecastNextHour, Settings, enviroments, preFetchedData) {
    Console.info("☑️ InjectForecastNextHour");

    // if (forecastNextHour) {
    //     Console.info("✅ InjectForecastNextHour");
    //     return forecastNextHour;
    // }

    let newForecastNextHour;
    if (preFetchedData) {
        newForecastNextHour = await preFetchedData;
        Console.info("InjectForecastNextHour", "使用预取数据");
    } else {
        switch (Settings?.NextHour?.Provider) {
            case "WeatherKit":
                break;
            case "QWeather": {
                newForecastNextHour = await enviroments.qWeather.Minutely();
                break;
            }
            case "ColorfulClouds":
            default: {
                newForecastNextHour = await enviroments.colorfulClouds.Minutely();
                break;
            }
        }
    }
    if (newForecastNextHour?.metadata) {
        const isClear = newForecastNextHour?.condition?.[0]?.forecastToken === "CLEAR" || newForecastNextHour?.condition?.length === 0;
        if (isClear) {
            Console.info("InjectForecastNextHour", "未来一小时无降水，跳过注入并清除该模块（隐藏空白卡片）");
            forecastNextHour = undefined;
        } else {
            newForecastNextHour.metadata = { ...forecastNextHour?.metadata, ...newForecastNextHour.metadata };
            forecastNextHour = { ...forecastNextHour, ...newForecastNextHour };
        }
    }
    Console.info("✅ InjectForecastNextHour");
    return forecastNextHour;
}

/**
 * 注入并合并空气质量数据（污染物、指数、昨日对比）
 * @param {any} airQuality - WeatherKit 原始空气质量对象
 * @param {import('../types').Settings} Settings - 设置对象
 * @param {any} Caches - 缓存对象
 * @param {any} enviroments - 各数据源实例与定位信息
 * @param {Object} [preFetched={}] - 预取的数据（含 pollutants、index 等 Promise）
 * @returns {Promise<any>} 合并后的空气质量对象
 */
async function InjectAirQuality(airQuality, Settings, Caches, enviroments, preFetched = {}) {
    // Step1. 修复污染物单位
    airQuality = AirQuality.FixPollutantsUnits(airQuality);

    // Step2. 判断原始污染物是否为空，并在需要时注入污染物数据
    const isPollutantEmpty = !Array.isArray(airQuality?.pollutants) || airQuality.pollutants.length === 0;
    const needReplacePollutants = Settings?.AirQuality?.Current?.Pollutants?.Provider && Settings.AirQuality.Current.Pollutants.Provider !== "WeatherKit";
    const shouldInjectPollutants = isPollutantEmpty || needReplacePollutants;
    const injectedPollutants = shouldInjectPollutants ? (preFetched.pollutants ? await preFetched.pollutants : await InjectPollutants(Settings, enviroments)) : airQuality;
    if (shouldInjectPollutants && preFetched.pollutants) Console.info("InjectAirQuality", "污染物使用预取数据");
    const needPollutants = shouldInjectPollutants && !!(injectedPollutants?.metadata && !injectedPollutants.metadata.temporarilyUnavailable);

    // Step3. 根据污染物补齐情况与替换配置，决定是否注入 AQI 指数
    const needInjectIndex = needPollutants || Settings?.AirQuality?.Current?.Index?.Replace?.includes(AirQuality.GetNameFromScale(airQuality?.scale));
    let injectedIndex = injectedPollutants;
    if (needInjectIndex) {
        if (preFetched.index) {
            injectedIndex = await preFetched.index;
            Console.info("InjectAirQuality", "指数使用预取数据");
        } else {
            injectedIndex = await InjectIndex(injectedPollutants, Settings, enviroments);
        }
    }

    // Step4. 计算昨日对比是否需要重算；若未知则注入昨日对比结果
    const weatherKitComparison = airQuality?.previousDayComparison ?? AirQuality.Config.CompareCategoryIndexes.UNKNOWN;
    const previousDayComparison = needInjectIndex && Settings?.AirQuality?.Comparison?.ReplaceWhenCurrentChange ? AirQuality.Config.CompareCategoryIndexes.UNKNOWN : weatherKitComparison;
    const needInjectComparison = previousDayComparison === AirQuality.Config.CompareCategoryIndexes.UNKNOWN;
    const currentIndexProvider = needInjectIndex ? Settings?.AirQuality?.Current?.Index?.Provider : "WeatherKit";
    const injectedComparison = needInjectComparison ? await InjectComparison(injectedIndex, currentIndexProvider, Settings, Caches, enviroments) : { ...injectedIndex, previousDayComparison: weatherKitComparison };

    // Step5. 收集各阶段元数据，拼接最终 providerName 展示文案
    const weatherKitMetadata = airQuality?.metadata;
    const pollutantMetadata = injectedPollutants?.metadata;
    const indexMetadata = injectedIndex?.metadata;
    const comparisonMetadata = injectedComparison?.metadata;

    const pName = needPollutants && pollutantMetadata && !pollutantMetadata.temporarilyUnavailable ? pollutantMetadata.providerName : null;
    const iName = needInjectIndex && indexMetadata && !indexMetadata.temporarilyUnavailable ? indexMetadata.providerName : null;
    const cName = needInjectComparison && comparisonMetadata && !comparisonMetadata.temporarilyUnavailable ? comparisonMetadata.providerName : null;

    const providers = [];
    if (pName && pName === iName && (!cName || pName === cName)) {
        // 如果各环节提供商都一致（或者没开启部分注入），则合并展示，去除多余的“污染物”、“指数”前缀
        providers.push(AirQuality.appendScaleToProviderName(injectedIndex, Settings));
    } else {
        if ((!needInjectIndex || !needPollutants || !needInjectComparison) && weatherKitMetadata?.providerName && !weatherKitMetadata.temporarilyUnavailable) {
            providers.push(weatherKitMetadata.providerName);
        }
        if (pName) providers.push(`污染物：${pName}`);
        if (iName) providers.push(`指数：${AirQuality.appendScaleToProviderName(injectedIndex, Settings)}`);
        if (cName) providers.push(`对比昨日：${cName}`);
    }

    const activeMetadata = injectedIndex?.metadata && !injectedIndex.metadata.temporarilyUnavailable && injectedIndex.metadata.attributionUrl ? injectedIndex.metadata : pollutantMetadata && !pollutantMetadata.temporarilyUnavailable && pollutantMetadata.attributionUrl ? pollutantMetadata : null;

    // Step7. 合并输出：优先使用可用注入结果，并统一 metadata / pollutants / previousDayComparison
    airQuality = {
        ...airQuality,
        ...(injectedIndex?.metadata && !injectedIndex.metadata.temporarilyUnavailable ? injectedIndex : {}),
        metadata: {
            ...(airQuality?.metadata ? airQuality.metadata : injectedPollutants?.metadata),
            providerName: providers.join("\n"),
            ...(activeMetadata ? { attributionUrl: activeMetadata.attributionUrl } : {}),
        },
        pollutants: AirQuality.ConvertPollutants(airQuality, injectedPollutants, needInjectIndex, injectedIndex, Settings) ?? [],
        previousDayComparison: injectedComparison?.previousDayComparison ?? AirQuality.Config.CompareCategoryIndexes.UNKNOWN,
    };
    Console.debug("airQuality:", airQuality);
    return airQuality;
}

async function InjectPollutants(Settings, enviroments) {
    Console.info("☑️ InjectPollutants");

    switch (Settings?.AirQuality?.Current?.Pollutants?.Provider) {
        case "QWeather": {
            const currentAirQuality = await enviroments.qWeather.CurrentAirQuality();
            Console.info("✅ InjectPollutants");
            return currentAirQuality;
        }
        case "ColorfulClouds":
        default: {
            const currentAirQuality = await enviroments.colorfulClouds.CurrentAirQuality();
            Console.info("✅ InjectPollutants");
            return currentAirQuality;
        }
    }
}

/**
 * 注入空气质量数据
 * @param {any} airQuality - 空气质量数据对象
 * @param {import('../types').Settings} Settings - 设置对象
 * @param {any} enviroments - 环境变量
 * @returns {Promise<any>} 注入后的空气质量数据
 */
async function InjectIndex(airQuality, Settings, enviroments) {
    Console.info("☑️ InjectIndex");

    switch (Settings?.AirQuality?.Current?.Index?.Provider) {
        case "QWeather": {
            const currentAirQuality = await enviroments.qWeather.CurrentAirQuality(Settings.AirQuality.Current.Index.ForceCNPrimaryPollutants);
            Console.info("✅ InjectIndex");
            return currentAirQuality;
        }
        case "ColorfulCloudsUS":
        case "ColorfulCloudsCN": {
            const currentAirQuality = await enviroments.colorfulClouds.CurrentAirQuality(Settings.AirQuality.Current.Index.Provider === "ColorfulCloudsUS", Settings.AirQuality.Current.Index.ForceCNPrimaryPollutants);
            Console.info("✅ InjectIndex");
            return currentAirQuality;
        }
        case "Calculate":
        default: {
            const currentAirQuality = AirQuality.Pollutants2AQI(airQuality, Settings);
            Console.info("✅ InjectIndex");
            return currentAirQuality;
        }
    }
}

async function InjectComparison(airQuality, currentIndexProvider, Settings, Caches, enviroments) {
    Console.info("☑️ InjectComparison");

    const { UNKNOWN } = AirQuality.Config.CompareCategoryIndexes;

    /**
     * HJ 633—2012
     * [环境空气质量指数（AQI）技术规定（试行）_中华人民共和国生态环境部]{@link https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/jcffbz/201203/t20120302_224166.shtml}
     */
    const isHJ6332012 = (currentIndexProvider, currentScale, Settings) => {
        Console.info("☑️ isHJ6332012", `currentIndexProvider: ${currentIndexProvider}`);

        switch (currentIndexProvider) {
            case "Calculate": {
                Console.debug(`Settings?.AirQuality?.Calculate?.Algorithm: ${Settings?.AirQuality?.Calculate?.Algorithm}`);
                const result = Settings?.AirQuality?.Calculate?.Algorithm === "WAQI_InstantCast_CN";
                Console.info("✅ isHJ6332012", result);
                return result;
            }
            case "QWeather":
            case "ColorfulCloudsCN": {
                Console.info("✅ isHJ6332012", true);
                return true;
            }
            case "WeatherKit": {
                const result = AirQuality.GetNameFromScale(currentScale) === AirQuality.Config.Scales.HJ6332012.weatherKitScale.name;
                Console.info("✅ isHJ6332012", result);
                return result;
            }
            default: {
                Console.info("✅ isHJ6332012", false);
                return false;
            }
        }
    };
    /**
     * EPA 454/B-18-007
     * [Technical Assistance Document for the Reporting of Daily Air Quality – the Air Quality Index (AQI)]{@link https://www.airnow.gov/sites/default/files/2020-05/aqi-technical-assistance-document-sept2018.pdf}
     */
    const isEPA454_B18007 = currentIndexProvider => {
        Console.info("☑️ isHJ6332012", `currentIndexProvider: ${currentIndexProvider}`);

        switch (currentIndexProvider) {
            case "WAQI":
            case "ColorfulCloudsUS": {
                Console.info("✅ isHJ6332012", true);
                return true;
            }
            default: {
                Console.info("✅ isHJ6332012", false);
                return false;
            }
        }
    };

    const colorfulCloudsComparison = async (useUsa, currentCategoryIndex) => {
        Console.info("☑️ colorfulCloudsComparison", `currentCategoryIndex: ${currentCategoryIndex}`);
        const yesterdayAirQuality = await enviroments.colorfulClouds.YesterdayAirQuality(useUsa);

        const getMetadata = (temporarilyUnavailable = false) => ({
            ...yesterdayAirQuality.metadata,
            providerName: yesterdayAirQuality.metadata.providerName,
            temporarilyUnavailable,
        });

        if (!yesterdayAirQuality.metadata.temporarilyUnavailable) {
            if (currentCategoryIndex) {
                const comparisonAirQuality = {
                    ...yesterdayAirQuality,
                    metadata: getMetadata(false),
                    previousDayComparison: AirQuality.CompareCategoryIndexes(currentCategoryIndex, yesterdayAirQuality.categoryIndex),
                };
                Console.info("✅ colorfulCloudsComparison");
                return comparisonAirQuality;
            } else {
                const colorfulCloudsCurrent = await enviroments.colorfulClouds.CurrentAirQuality(useUsa);
                if (!colorfulCloudsCurrent.metadata.temporarilyUnavailable) {
                    Console.debug(`colorfulCloudsCurrent?.index: ${colorfulCloudsCurrent?.index}`);
                    const comparisonAirQuality = {
                        ...yesterdayAirQuality,
                        metadata: getMetadata(false),
                        previousDayComparison: AirQuality.CompareCategoryIndexes(colorfulCloudsCurrent.categoryIndex, yesterdayAirQuality.categoryIndex),
                    };
                    Console.info("✅ colorfulCloudsComparison");
                    return comparisonAirQuality;
                }
            }
        }

        Console.error("colorfulCloudsComparison", `无法从彩云天气获取${yesterdayAirQuality.metadata.temporarilyUnavailable ? "昨日" : "今日"}的空气质量数据`);
        return {
            ...yesterdayAirQuality,
            metadata: getMetadata(true),
            previousDayComparison: UNKNOWN,
        };
    };
    const qweatherComparison = async (currentCategoryIndex, pollutantsToAirQuality) => {
        Console.info("☑️ qweatherComparison", `currentCategoryIndex: ${currentCategoryIndex}`);

        const { latitude, longitude } = enviroments.qWeather;
        const locationInfo = QWeather.GetLocationInfo(undefined, latitude, longitude);

        const yesterdayQWeather = await enviroments.qWeather.YesterdayAirQuality(locationInfo);

        const getMetadata = (indexProvider, temporarilyUnavailable = false) => ({
            ...yesterdayQWeather.metadata,
            providerName: indexProvider,
            temporarilyUnavailable,
        });

        if (!yesterdayQWeather.metadata.temporarilyUnavailable) {
            const airQualityFromPollutants = pollutantsToAirQuality ? pollutantsToAirQuality(yesterdayQWeather) : undefined;
            const yesterdayAirQuality = airQualityFromPollutants
                ? {
                      ...airQualityFromPollutants,
                      metadata: {
                          ...airQualityFromPollutants.metadata,
                          providerName: airQualityFromPollutants.metadata.providerName,
                      },
                  }
                : {
                      ...yesterdayQWeather,
                      metadata: {
                          ...yesterdayQWeather.metadata,
                          providerName: yesterdayQWeather.metadata.providerName,
                      },
                  };

            if (currentCategoryIndex) {
                const comparisonAirQuality = {
                    ...yesterdayQWeather,
                    metadata: getMetadata(yesterdayAirQuality.metadata.providerName, false),
                    previousDayComparison: AirQuality.CompareCategoryIndexes(currentCategoryIndex, yesterdayAirQuality.categoryIndex),
                };
                Console.info("✅ qweatherComparison");
                return comparisonAirQuality;
            } else {
                const qweatherCurrent = await enviroments.qWeather.CurrentAirQuality();
                if (!qweatherCurrent.metadata.temporarilyUnavailable) {
                    Console.debug(`qweatherCurrent?.index: ${qweatherCurrent?.index}`);

                    const comparisonAirQuality = {
                        ...yesterdayQWeather,
                        metadata: getMetadata(yesterdayAirQuality.metadata.providerName, false),
                        previousDayComparison: AirQuality.CompareCategoryIndexes(qweatherCurrent.categoryIndex, yesterdayAirQuality.categoryIndex),
                    };
                    Console.info("✅ qweatherComparison");
                    return comparisonAirQuality;
                }
            }
        }

        Console.error("qweatherComparison", `无法从和风天气获取${yesterdayQWeather.metadata.temporarilyUnavailable ? "昨日" : "今日"}空气质量数据`);
        return {
            ...yesterdayQWeather,
            metadata: getMetadata(yesterdayQWeather.metadata.providerName, true),
            previousDayComparison: UNKNOWN,
        };
    };

    switch (Settings?.AirQuality?.Comparison?.Yesterday?.IndexProvider) {
        case "Calculate": {
            const algorithm = AirQuality.chooseAlogrithm(airQuality, Settings);
            const PollutantsProvider = Settings?.AirQuality?.Comparison?.Yesterday?.PollutantsProvider;
            Console.debug(`Settings?.AirQuality?.Comparison?.Yesterday?.PollutantsProvider: ${PollutantsProvider}`);

            if (algorithm !== "") {
                switch (PollutantsProvider) {
                    case "ColorfulCloudsCN": {
                        const comparisonAirQuality = await colorfulCloudsComparison(false, isHJ6332012(currentIndexProvider, airQuality?.scale, Settings) ? airQuality?.categoryIndex : undefined);
                        Console.info("✅ InjectComparison");
                        return comparisonAirQuality;
                    }
                    case "QWeather":
                    default: {
                        const pollutantsToAirQuality = airQuality => AirQuality.Pollutants2AQI(airQuality, Settings, { algorithm });
                        const comparisonAirQuality = await qweatherComparison(airQuality?.categoryIndex, pollutantsToAirQuality);
                        Console.info("✅ InjectComparison");
                        return comparisonAirQuality;
                    }
                }
            }

            Console.error("InjectComparison", "不支持今日空气质量的标准");
            return { metadata: { providerName: "iRingo", temporarilyUnavailable: true }, previousDayComparison: UNKNOWN };
        }
        case "QWeather": {
            const comparisonAirQuality = await qweatherComparison(isHJ6332012(currentIndexProvider, airQuality?.scale, Settings) ? airQuality?.categoryIndex : undefined);
            Console.info("✅ InjectComparison");
            return comparisonAirQuality;
        }
        case "ColorfulCloudsCN": {
            // Use injected AQI or ColorfulClouds AQI depends on data source
            const comparisonAirQuality = colorfulCloudsComparison(false, isHJ6332012(currentIndexProvider, airQuality?.scale, Settings) ? airQuality?.categoryIndex : undefined);
            Console.info("✅ InjectComparison");
            return comparisonAirQuality;
        }
        case "ColorfulCloudsUS":
        default: {
            const comparisonAirQuality = colorfulCloudsComparison(true, isEPA454_B18007(currentIndexProvider) ? airQuality?.categoryIndex : undefined);
            Console.info("✅ InjectComparison");
            return comparisonAirQuality;
        }
    }
}
