import * as WK2 from "../proto/apple/wk2.js";
import { Console } from "../utils/index.mjs";

export default class ForecastNextHour {
    Name = "ForecastNextHour";
    Version = "v1.6.5";
    Author = "iRingo";

    // iOS 27 在 NextHour 元数据超过 15 分钟后会隐藏该模块，故代理将过期时间缩短为 10 分钟，
    // 促使客户端在 relevance cutoff 之前刷新。
    static ExpirationInterval = 10 * 60;

    // Apple 会把 STOP 固定渲染为“即将停止下雨”，因此仅在 15 分钟内停雨时使用。
    static StopSoonInterval = 15 * 60;

    static #Configs = {
        Pollutants: {
            co: "CO",
            no: "NO",
            no2: "NO2",
            so2: "SO2",
            o3: "OZONE",
            nox: "NOX",
            pm25: "PM2_5",
            pm10: "PM10",
            other: "NOT_AVAILABLE",
        },
        WeatherCondition: {
            晴朗: "CLEAR",
            雨夹雪: "SLEET",
            小雨: "DRIZZLE",
            下雨: "RAIN",
            中雨: "RAIN",
            大雨: "HEAVY_RAIN",
            小雪: "FLURRIES",
            下雪: "SNOW",
            中雪: "SNOW",
            大雪: "HEAVY_SNOW",
            冰雹: "HAIL",
        },
        PrecipitationType: {
            晴朗: "CLEAR",
            雨夹雪: "SLEET",
            rain: "RAIN",
            雨: "RAIN",
            snow: "SNOW",
            雪: "SNOW",
            冰雹: "HAIL",
        },
        Precipitation: {
            Level: {
                INVALID: -1,
                NO: 0,
                LIGHT: 1,
                MODERATE: 2,
                HEAVY: 3,
                EXTREME: 4,
            },
            Range: {
                /**
                 * [降水强度 | 彩云天气 API]{@link https://docs.caiyunapp.com/weather-api/v2/v2.6/tables/precip.html}
                 */
                radar: {
                    NO: [0, 0.031],
                    LIGHT: [0.031, 0.25],
                    MODERATE: [0.25, 0.35],
                    HEAVY: [0.35, 0.48],
                    EXTREME: [0.48, Number.MAX_VALUE],
                },
                mmph: {
                    NO: [0, 0.08],
                    LIGHT: [0.08, 3.44],
                    MODERATE: [3.44, 11.33],
                    HEAVY: [11.33, 51.3],
                    EXTREME: [51.3, Number.MAX_VALUE],
                },
                precipitation: {
                    NO: [0, 0.01],
                    LIGHT: [0.01, 0.6],
                    MODERATE: [0.6, 1.65],
                    HEAVY: [1.65, 8.0],
                    EXTREME: [8.0, 205.0],
                },
            },
        },
    };

    static WeatherCondition(sentence) {
        Console.debug("☑️ WeatherCondition", `sentence: ${sentence}`);
        // 完整短语排在通用词前，首次命中即可，避免“雨夹雪”又被“雪”覆盖。
        const weatherCondition = Object.entries(ForecastNextHour.#Configs.WeatherCondition).find(([key]) => sentence.includes(key))?.[1] ?? "CLEAR";
        Console.debug(`✅ WeatherCondition: ${weatherCondition}`);
        return weatherCondition;
    }

    // 根据描述文本猜测降水类型
    static PrecipitationType(sentence) {
        Console.debug("☑️ PrecipitationType", `sentence: ${sentence}`);
        const precipitationType = Object.entries(ForecastNextHour.#Configs.PrecipitationType).find(([key]) => sentence.includes(key))?.[1] ?? "CLEAR";
        Console.debug(`✅ PrecipitationType: ${precipitationType}`);
        return precipitationType;
    }

    static Minute(minutes = [], description = "", units = "mmph") {
        Console.debug("☑️ Minute");
        let precipitationType = ForecastNextHour.PrecipitationType(description);
        // 如果文本推断为晴天，但实际存在降水，则默认回退为 RAIN
        if (precipitationType === "CLEAR" && minutes.some(m => m.precipitationIntensity > 0)) {
            precipitationType = "RAIN";
        }
        // refer: https://docs.caiyunapp.com/weather-api/v2/v2.6/tables/precip.html

        minutes = minutes.map((minute, _i) => {
            // 根据precipitationIntensity来猜测生成perceivedPrecipitationIntensity
            minute.precipitationIntensity = Math.trunc(minute.precipitationIntensity * 1000000) / 1000000;
            minute.perceivedPrecipitationIntensity = ForecastNextHour.#ConvertPrecipitationIntensity(minute.precipitationIntensity, units);
            // 然后根据perceivedPrecipitationIntensity和precipitationChance来猜测生成condition和summaryCondition
            if (minute.perceivedPrecipitationIntensity > 2) {
                // 大雨，强烈感知
                switch (precipitationType) {
                    case "RAIN":
                        minute.condition = "HEAVY_RAIN";
                        break;
                    case "SNOW":
                        minute.condition = "HEAVY_SNOW";
                        break;
                    default:
                        minute.condition = "SLEET";
                        break;
                }

                minute.summaryCondition = precipitationType;
                minute.clear = false;
            } else if (minute.perceivedPrecipitationIntensity > 1) {
                // 中雨，明显感知
                switch (precipitationType) {
                    case "RAIN":
                        minute.condition = "RAIN";
                        break;
                    case "SNOW":
                        minute.condition = "SNOW";
                        break;
                    default:
                        minute.condition = "SLEET";
                        break;
                }
                minute.summaryCondition = precipitationType;
                minute.clear = false;
            } else if (minute.perceivedPrecipitationIntensity > 0.1) {
                // ❓ perceivedPrecipitationIntensity 小于 0.1, 苹果天气显示为无降水
                // 小雨，可以感知到
                switch (precipitationType) {
                    case "RAIN":
                        minute.condition = "DRIZZLE";
                        break;
                    case "SNOW":
                        minute.condition = "SNOW"; // 降级 FLURRIES 至 SNOW
                        break;
                    default:
                        minute.condition = "SLEET";
                        break;
                }
                minute.summaryCondition = precipitationType;
                minute.clear = false;
            } else if (minute.perceivedPrecipitationIntensity > 0) {
                // 可能降水
                switch (precipitationType) {
                    case "RAIN":
                        minute.condition = "POSSIBLE_DRIZZLE";
                        break;
                    case "SNOW":
                        minute.condition = "POSSIBLE_SLEET"; // 降级 POSSIBLE_FLURRIES 至 POSSIBLE_SLEET
                        break;
                    default:
                        minute.condition = "POSSIBLE_SLEET";
                        break;
                }
                minute.summaryCondition = precipitationType;
                minute.clear = false;
            } else {
                minute.condition = "CLEAR";
                minute.summaryCondition = "CLEAR";
                minute.clear = true;
            }
            //Console.debug(`minutes[${i}]`, JSON.stringify(minute, null, 2));
            return minute;
        });

        Console.debug("✅ Minute");
        return minutes;
    }

    static Summary(minutes = []) {
        Console.debug("☑️ Summary");
        const Summaries = [];
        let Summary = {
            condition: "CLEAR",
            startTime: 0,
            precipitationChance: 0,
            precipitationIntensity: 0,
            maxCondition: "",
            clear: true,
        };
        let conditionsCount = {};
        const Length = Math.min(71, minutes.length);

        // 根据当前段内每分钟的 conditions 频次，判定最具代表性的条件
        const getRepresentativeCondition = counts => {
            const heavyRain = (counts["HEAVY_RAIN"] || 0) + (counts["HEAVY_SNOW"] || 0);
            const moderateRain = (counts["RAIN"] || 0) + (counts["SNOW"] || 0) + (counts["SLEET"] || 0);
            const lightRain = counts["DRIZZLE"] || 0;
            const possibleRain = (counts["POSSIBLE_DRIZZLE"] || 0) + (counts["POSSIBLE_SLEET"] || 0);

            const totalMinutes = Object.values(counts).reduce((a, b) => a + b, 0);
            // 阈值：大雨至少需要累计 12 分钟（总时长的 20%），但若该段很短则按 20% 折算，且最少 3 分钟
            const threshold = Math.max(3, Math.min(12, Math.round(totalMinutes * 0.2)));

            if (heavyRain >= threshold) {
                return counts["HEAVY_RAIN"] ? "HEAVY_RAIN" : "HEAVY_SNOW";
            }
            if (heavyRain + moderateRain >= threshold) {
                return counts["SLEET"] ? "SLEET" : counts["RAIN"] ? "RAIN" : "SNOW";
            }
            if (heavyRain + moderateRain + lightRain >= threshold) {
                return "DRIZZLE";
            }
            if (heavyRain + moderateRain + lightRain > 0) {
                // 短时段未达代表性阈值时降级为“可能”，但必须保留类型。
                if (counts["SLEET"]) return "POSSIBLE_SLEET";
                if (counts["HEAVY_SNOW"] || counts["SNOW"]) return "POSSIBLE_SLEET";
                return "POSSIBLE_DRIZZLE";
            }
            if (possibleRain > 0) {
                return counts["POSSIBLE_SLEET"] ? "POSSIBLE_SLEET" : "POSSIBLE_DRIZZLE";
            }
            return "CLEAR";
        };

        for (let i = 0; i < Length; i++) {
            const minute = minutes[i];
            const previousMinute = minutes[i - 1];

            // 统计计数
            conditionsCount[minute.condition] = (conditionsCount[minute.condition] || 0) + 1;

            switch (i) {
                case 0: // 第一个
                    Summary.startTime = minute.startTime;
                    Summary.condition = minute.summaryCondition;
                    Summary.precipitationChance = minute.precipitationChance;
                    Summary.precipitationIntensity = minute.precipitationIntensity;
                    Summary.clear = minute.clear;
                    if (Length === 1) {
                        Summary.endTime = 0;
                        Summary.maxCondition = getRepresentativeCondition(conditionsCount);
                        Summaries.push({ ...Summary });
                    }
                    break;
                case Length - 1: // 最后一个
                    if (minute.summaryCondition !== previousMinute.summaryCondition) {
                        // 最后一分钟发生状态切换：先结束并保存已累计的段，再单独保存最后一分钟。
                        // 否则上一段会与最后一分钟合并成同 clear 状态的相邻段，触发 Condition() 的防御拦截而丢失全部 token。
                        conditionsCount[minute.condition]--;
                        if (conditionsCount[minute.condition] === 0) delete conditionsCount[minute.condition];

                        Summary.endTime = minute.startTime;
                        Summary.maxCondition = getRepresentativeCondition(conditionsCount);
                        Console.debug(`Summaries[${i}]`, JSON.stringify({ ...previousMinute, ...Summary }, null, 2));
                        Summaries.push({ ...Summary });

                        conditionsCount = {};
                        conditionsCount[minute.condition] = 1;
                        Summary = {
                            startTime: minute.startTime,
                            condition: minute.summaryCondition,
                            precipitationChance: minute.precipitationChance,
                            precipitationIntensity: minute.precipitationIntensity,
                            maxCondition: "",
                            clear: minute.clear,
                        };
                    } else {
                        Summary.precipitationChance = Math.max(Summary.precipitationChance, minute.precipitationChance);
                        Summary.precipitationIntensity = Math.max(Summary.precipitationIntensity, minute.precipitationIntensity);
                    }
                    Summary.endTime = 0;
                    Summary.clear = minute.clear;
                    Summary.maxCondition = getRepresentativeCondition(conditionsCount);
                    Console.debug(`Summaries[${i}]`, JSON.stringify({ ...minute, ...Summary }, null, 2));
                    Summaries.push({ ...Summary });
                    break;
                default: // 中间
                    if (minute.summaryCondition !== previousMinute.summaryCondition) {
                        // 扣除属于新段的当前 minute 统计值
                        conditionsCount[minute.condition]--;
                        if (conditionsCount[minute.condition] === 0) delete conditionsCount[minute.condition];

                        Summary.endTime = minute.startTime;
                        Summary.maxCondition = getRepresentativeCondition(conditionsCount);
                        Console.debug(`Summaries[${i}]`, JSON.stringify({ ...previousMinute, ...Summary }, null, 2));
                        Summaries.push({ ...Summary });

                        // 开始新的summary
                        conditionsCount = {};
                        conditionsCount[minute.condition] = 1;
                        Summary = {
                            startTime: minute.startTime,
                            condition: minute.summaryCondition,
                            precipitationChance: minute.precipitationChance,
                            precipitationIntensity: minute.precipitationIntensity,
                            maxCondition: "",
                            clear: minute.clear,
                        };
                    } else {
                        // 条件相同，更新最大值
                        Summary.precipitationChance = Math.max(Summary.precipitationChance, minute.precipitationChance);
                        Summary.precipitationIntensity = Math.max(Summary.precipitationIntensity, minute.precipitationIntensity);
                    }
                    break;
            }
        }
        Console.debug(`Summaries: ${JSON.stringify(Summaries, null, 2)}`);
        Console.debug("✅ Summary");
        return Summaries;
    }

    static Condition(summaries = [], referenceTime = undefined) {
        Console.debug("☑️ Condition");
        const Conditions = [];
        if (!summaries.length) {
            Console.debug(`Conditions: ${JSON.stringify(Conditions, null, 2)}`);
            Console.debug("✅ Condition");
            return Conditions;
        }

        // Summary() 输出的是 clear / 降水交替的段。这里防御性地拦截相邻同 clear 状态的非法输入，
        // 保持返回空结果（与历史行为一致），避免下文循环里产生无意义的 token。
        for (let i = 1; i < summaries.length; i++) {
            if (summaries[i - 1].clear === summaries[i].clear) {
                Console.warn("Condition", `Adjacent summaries have the same clear state at indexes ${i - 1} and ${i}`);
                Console.debug(`Conditions: ${JSON.stringify(Conditions, null, 2)}`);
                Console.debug("✅ Condition");
                return Conditions;
            }
        }

        // 当前正在降水但 15 分钟内不会停止时，不提前生成 STOP / STOP_START。
        // 将当前段视为持续降水，避免 Apple 显示语义不符的“即将停止下雨”。
        const current = summaries[0];
        if (Number.isFinite(referenceTime) && !current.clear && current.endTime > referenceTime + ForecastNextHour.StopSoonInterval) {
            summaries = [{ ...current, endTime: 0 }];
        }

        // 通用多段处理：不再限定 1~4 段，任意数量的 clear / 降水交替段都能正确生成 token。
        for (let i = 0; i < summaries.length; i++) {
            const current = summaries[i];
            const next = summaries[i + 1];
            const afterNext = summaries[i + 2];

            if (current.clear) {
                if (!next) {
                    // 末段 CLEAR
                    Conditions.push({
                        beginCondition: current.maxCondition,
                        endCondition: current.maxCondition,
                        forecastToken: "CLEAR",
                        parameters: [],
                        startTime: current.startTime,
                        endTime: 0,
                    });
                } else if (afterNext) {
                    // CLEAR 后还有第二次降水：START_STOP
                    Conditions.push({
                        beginCondition: next.maxCondition,
                        endCondition: next.maxCondition,
                        forecastToken: "START_STOP",
                        parameters: [
                            { date: next.startTime, type: "FIRST_AT" },
                            { date: next.endTime, type: "SECOND_AT" },
                        ],
                        startTime: current.startTime,
                        endTime: current.endTime,
                    });
                } else {
                    // CLEAR 后只有一次降水：START
                    Conditions.push({
                        beginCondition: next.maxCondition,
                        endCondition: next.maxCondition,
                        forecastToken: "START",
                        parameters: [{ date: next.startTime, type: "FIRST_AT" }],
                        startTime: current.startTime,
                        endTime: current.endTime,
                    });
                }
            } else if (!next) {
                // 末段降水：CONSTANT
                Conditions.push({
                    beginCondition: current.maxCondition,
                    endCondition: current.maxCondition,
                    forecastToken: "CONSTANT",
                    parameters: [],
                    startTime: current.startTime,
                    endTime: 0,
                });
            } else if (afterNext) {
                // 降水后 CLEAR 再降水：STOP_START
                Conditions.push({
                    beginCondition: current.maxCondition,
                    endCondition: afterNext.maxCondition,
                    forecastToken: "STOP_START",
                    parameters: [
                        { date: current.endTime, type: "FIRST_AT" },
                        { date: afterNext.startTime, type: "SECOND_AT" },
                    ],
                    startTime: current.startTime,
                    endTime: current.endTime,
                });
            } else {
                // 降水后 CLEAR：STOP
                Conditions.push({
                    beginCondition: current.maxCondition,
                    endCondition: current.maxCondition,
                    forecastToken: "STOP",
                    parameters: [{ date: current.endTime, type: "FIRST_AT" }],
                    startTime: current.startTime,
                    endTime: current.endTime,
                });
            }
        }
        // pinned WK2 schema 不认识的值会被 FlatBuffer 当成 0（CLEAR），因此整条条件必须跳过。
        const safeConditions = Conditions.filter(condition => {
            const supported = [condition.beginCondition, condition.endCondition].every(value => typeof WK2.ConditionType[value] === "number");
            if (!supported) Console.warn("Condition", `Unsupported ConditionType: ${condition.beginCondition}/${condition.endCondition}`);
            return supported;
        });
        Console.debug(`Conditions: ${JSON.stringify(safeConditions, null, 2)}`);
        Console.debug("✅ Condition");
        return safeConditions;
    }

    static #ConvertPrecipitationIntensity(precipitationIntensity, units = "mmph") {
        //Console.debug("☑️ ConvertPrecipitationIntensity");
        //Console.debug(`precipitationIntensity: ${precipitationIntensity}`, `units: ${units}`);
        const Range = ForecastNextHour.#Configs.Precipitation.Range[units];
        let perceivedPrecipitationIntensity = 0;

        if (precipitationIntensity === 0) {
            // 无降水
            perceivedPrecipitationIntensity = 0;
        } else if (precipitationIntensity > Range.NO[0] && precipitationIntensity <= Range.NO[1]) {
            // 轻微降水，可能感知不到
            perceivedPrecipitationIntensity = 0; // 轻微降水通常感知不到
        } else if (precipitationIntensity > Range.LIGHT[0] && precipitationIntensity <= Range.LIGHT[1]) {
            // 小雨，可以感知到
            // 根据强度计算感知强度，在0-1之间
            perceivedPrecipitationIntensity = Math.min(1, (precipitationIntensity - Range.LIGHT[0]) / (Range.LIGHT[1] - Range.LIGHT[0]));
        } else if (precipitationIntensity > Range.MODERATE[0] && precipitationIntensity <= Range.MODERATE[1]) {
            // 中雨，明显感知
            // 根据强度计算感知强度，在1-2之间
            perceivedPrecipitationIntensity = 1 + Math.min(1, (precipitationIntensity - Range.MODERATE[0]) / (Range.MODERATE[1] - Range.MODERATE[0]));
        } else if (precipitationIntensity > Range.HEAVY[0]) {
            // 大雨，强烈感知
            // 根据强度计算感知强度，在2-3之间
            perceivedPrecipitationIntensity = 2 + Math.min(1, (precipitationIntensity - Range.HEAVY[0]) / (Range.HEAVY[1] - Range.HEAVY[0]));
        }

        // 使用Math.trunc保留一位小数（性能最快，截断不四舍五入）
        perceivedPrecipitationIntensity = Math.trunc(perceivedPrecipitationIntensity * 1000) / 1000;

        //Console.debug(`perceivedPrecipitationIntensity: ${perceivedPrecipitationIntensity}`);
        //Console.debug(`✅ ConvertPrecipitationIntensity`);
        return perceivedPrecipitationIntensity;
    }
}
