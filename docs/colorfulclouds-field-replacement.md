# 彩云天气替换 WeatherKit 响应字段分析

> 以 ColorfulClouds（彩云天气）为例，分析本项目对 WeatherKit 上游响应字段的可配置替换方式。

## 概述

项目接收 WeatherKit FlatBuffer 响应，解码后按配置用彩云天气数据选择性替换部分字段，再重新编码返回客户端。

**合并策略：**
- `currentWeather` — Object spread 覆盖
- `forecastDaily` / `forecastHourly` — 按 `forecastStart` 时间戳匹配，逐条合并
- `forecastNextHour` — 整体替换（仅在原数据为空时注入）
- `airQuality` — 多阶段独立注入（污染物 / AQI 指数 / 昨日对比各自可配不同 provider）

**核心思路：** 彩云提供「天况 + 温湿度 + 风 + 降水 + 能见度 + 气压」这些中国用户更关心的实时/预报数据；日出日落、月相、UV 指数、雪量等则保留上游响应原值。

---

## 1. currentWeather（当前天气）

**合并方式：** Object spread 覆盖 — `{ ...original, ...colorfulClouds }`

**API 端点：** `#RealTime()`

### 替换字段

| WeatherKit 字段 | 彩云来源 | 转换逻辑 |
|---|---|---|
| `cloudCover` | `realtime.cloudrate` | `Math.round(value × 100)` 分数→百分比 |
| `conditionCode` | `realtime.skycon` | `Weather.ConvertWeatherCode()` 天气代码映射 |
| `humidity` | `realtime.humidity` | `Math.round(value × 100)` |
| `perceivedPrecipitationIntensity` | `realtime.precipitation.local.intensity` | 直接取值（mm/h） |
| `pressure` | `realtime.pressure` | `value / 100` Pa→hPa |
| `temperature` | `realtime.temperature` | 直接取值（°C） |
| `temperatureApparent` | `realtime.apparent_temperature` | 直接取值（°C） |
| `visibility` | `realtime.visibility` | `value × 1000` km→m |
| `windDirection` | `realtime.wind.direction` | 直接取值（度） |
| `windSpeed` | `realtime.wind.speed` | 直接取值（m/s） |

### 保留原值的字段

`asOf`、`daylight`、`uvIndex`、`windGust`、`temperatureDewPoint`、`pressureTrend`、各级降水量（1h/6h/24h）、`snowfallAmount*`、`cloudCoverLowAltPct` / `cloudCoverMidAltPct` / `cloudCoverHighAltPct`

---

## 2. forecastDaily（每日预报）

**合并方式：** `Weather.mergeForecast()` 按 `forecastStart` 时间戳匹配，逐天合并。`daytimeForecast` / `overnightForecast` 子对象也用 spread 覆盖。

**API 端点：** `#daily()`

### 每日顶层字段替换

| WeatherKit 字段 | 彩云来源 | 转换逻辑 |
|---|---|---|
| `conditionCode` | `daily.skycon[i].value` | `Weather.ConvertWeatherCode()` |
| `humidityMax` | `daily.humidity[i].max` | `Math.round(value × 100)` |
| `humidityMin` | `daily.humidity[i].min` | `Math.round(value × 100)` |
| `precipitationAmount` | `daily.precipitation[i].avg` | 直接取值 |
| `precipitationChance` | `daily.precipitation[i].probability` | 直接取值（%） |
| `temperatureMax` | `daily.temperature[i].max` | 直接取值 |
| `temperatureMin` | `daily.temperature[i].min` | 直接取值 |
| `visibilityMax` | `daily.visibility[i].max` | `value × 1000` km→m |
| `visibilityMin` | `daily.visibility[i].min` | `value × 1000` km→m |
| `windSpeedAvg` | `daily.wind[i].avg.speed` | 直接取值 |
| `windSpeedMax` | `daily.wind[i].max.speed` | 直接取值 |

### daytimeForecast（白天 08h-20h）替换

| WeatherKit 字段 | 彩云来源 | 转换逻辑 |
|---|---|---|
| `cloudCover` | `daily.cloudrate[i].avg` | 直接取值（分数） |
| `conditionCode` | `daily.skycon_08h_20h[i].value` | `Weather.ConvertWeatherCode()` |
| `precipitationAmount` | `daily.precipitation_08h_20h[i].avg` | 直接取值 |
| `precipitationChance` | `daily.precipitation_08h_20h[i].probability` | 直接取值 |
| `temperatureMax` | `daily.temperature_08h_20h[i].max` | 直接取值 |
| `temperatureMin` | `daily.temperature_08h_20h[i].min` | 直接取值 |
| `windDirection` | `daily.wind_08h_20h[i].avg.direction` | 直接取值 |
| `windSpeed` | `daily.wind_08h_20h[i].avg.speed` | 直接取值 |
| `windSpeedMax` | `daily.wind_08h_20h[i].max.speed` | 直接取值 |

### overnightForecast（夜间 20h-32h）替换

同白天结构，数据源为 `skycon_20h_32h`、`precipitation_20h_32h`、`temperature_20h_32h`、`wind_20h_32h`。

### 保留原值的字段

`forecastStart` / `forecastEnd`、`sunrise` / `sunset`（含 Civil/Nautical/Astronomical 变体）、`moonPhase`、`moonrise` / `moonset`、`maxUvIndex`、`snowfallAmount`、`solarNoon` / `solarMidnight`、`temperatureMaxTime` / `temperatureMinTime`、`windGustSpeedMax`、`precipitationAmountByType` / `precipitationType`

白天/夜间子对象保留：`humidityMax/Min`、`cloudCover*AltPct`、`snowfallAmount`、`visibilityMax/Min`、`windGustSpeedMax`、`uvIndexMin/Max`、`temperatureApparentMin/Max`、`daylight`、`precipitationIntensityMax`、`perceivedPrecipitationIntensityMax`

---

## 3. forecastHourly（小时预报）

**合并方式：** `Weather.mergeForecast()` 按 `forecastStart` 匹配逐小时合并。

**API 端点：** `#hourly()`

### 替换字段

| WeatherKit 字段 | 彩云来源 | 转换逻辑 |
|---|---|---|
| `cloudCover` | `hourly.cloudrate[i].value` | 直接取值（分数） |
| `conditionCode` | `hourly.skycon[i].value` | `Weather.ConvertWeatherCode()` |
| `forecastStart` | `hourly.skycon[i].datetime` | 转 unix 时间戳 |
| `humidity` | `hourly.humidity[i].value` | `Math.round(value × 100)` |
| `precipitationAmount` | `hourly.precipitation[i].value` | 直接取值 |
| `precipitationChance` | `hourly.precipitation[i].probability` | 直接取值 |
| `pressure` | `hourly.pressure[i].value` | `value / 100` Pa→hPa |
| `temperature` | `hourly.temperature[i].value` | 直接取值 |
| `temperatureApparent` | `hourly.apparent_temperature[i].value` | 直接取值 |
| `visibility` | `hourly.visibility[i].value` | `value × 1000` km→m |
| `windDirection` | `hourly.wind[i].direction` | 直接取值 |
| `windSpeed` | `hourly.wind[i].speed` | 直接取值 |

### 保留原值的字段

`uvIndex`、`windGust`、`snowfallAmount` / `snowfallIntensity`、`temperatureDewPoint`、`pressureTrend`、`cloudCover*AltPct`、`daylight`、`perceivedPrecipitationIntensity`、`precipitationIntensity` / `precipitationType`

---

## 4. forecastNextHour（下一小时降水预报）

**特殊逻辑：** 仅在 WeatherKit 原始数据为空时才注入（`Response.mjs:276-279`），整体替换，不合并。

**API 端点：** `#minutely()`

数据经过 `ForecastNextHour` 的 3 阶段转换管道：

### 输出字段

| WeatherKit 字段 | 来源 | 说明 |
|---|---|---|
| `forecastStart` | 由 `server_time` 计算 | 向下取整到分钟 −1 |
| `forecastEnd` | 计算值 | `forecastStart + 60 × minutes.length`（上限 85 分钟） |
| `minutes[]` | `minutely.precipitation_2h` | 每分钟：`precipitationIntensity`（原始值）、`perceivedPrecipitationIntensity`（映射到 0-3 级）、`precipitationChance`（30 分钟分桶）、`startTime` |
| `summary[]` | 由分钟数据聚合 | 连续同类型降水归为一段：`condition`、`startTime/End`、`precipitationChance`、`precipitationIntensity` |
| `condition[]` | 由 summary 推导 | `forecastToken`（CLEAR / START / STOP / CONSTANT / START_STOP / STOP_START）、`parameters`（FIRST_AT / SECOND_AT 时间戳） |
| `metadata` | API 响应 | `providerName="彩云天气"`、`sourceType="MODELED"` |

### 转换细节

- **`ForecastNextHour.Minute()`** — 原始降水强度 → `perceivedPrecipitationIntensity`（0=无降水、0-1=小雨、1-2=中雨、2-3=大雨），并分配分钟级 `condition`（CLEAR / DRIZZLE / RAIN / HEAVY_RAIN / FLURRIES / SNOW / HEAVY_SNOW 等）
- **`ForecastNextHour.Summary()`** — 将连续相同降水类型的分钟聚合为 summary 段，记录最大强度
- **`ForecastNextHour.Condition()`** — 从 summary 序列推导整体模式（CLEAR / START / STOP / CONSTANT / START_STOP / STOP_START）

---

## 5. airQuality（空气质量）

**最复杂的注入**，分 3 个独立子阶段，各自可配置不同 provider。

### 默认配置

| 子阶段 | Provider | 说明 |
|---|---|---|
| 污染物（Pollutants） | ColorfulClouds | 注入 8 种污染物浓度 |
| AQI 指数（Index） | ColorfulCloudsCN | 中国 HJ633-2012 标准 |
| 昨日对比（Comparison） | ColorfulCloudsCN | 与昨日 AQI 对比 |

### Stage 1: 污染物注入

**触发条件：** 原始 WeatherKit `pollutants` 数组为空

| 彩云字段 | WeatherKit pollutantType | 单位 | 转换 |
|---|---|---|---|
| `co` | `CO` | μg/m³ | `value × 1000`（mg→μg） |
| `no` | `NO` | μg/m³ | 直接取值 |
| `no2` | `NO2` | μg/m³ | 直接取值 |
| `so2` | `SO2` | μg/m³ | 直接取值 |
| `o3` | `OZONE` | μg/m³ | 直接取值 |
| `nox` | `NOX` | μg/m³ | 直接取值 |
| `pm25` | `PM2_5` | μg/m³ | 直接取值 |
| `pm10` | `PM10` | μg/m³ | 直接取值 |

CN 标准下，每种污染物还附带 `index` 字段（`{name}_iaqi_chn` 单项指数）。

### Stage 2: AQI 指数注入

| WeatherKit 字段 | 来源 | 说明 |
|---|---|---|
| `index` | `aqi.chn` | 直接取整数 |
| `categoryIndex` | 由 index + HJ633-2012 分级计算 | 0-50→1（优）、51-100→2（良）、101-150→3（轻度）… |
| `isSignificant` | `categoryIndex ≥ 3` | 轻度污染及以上为 true |
| `primaryPollutant` | `AirQuality.PrimaryPollutant()` | 单项指数最高的污染物；全 ≤ 50 时为 `NOT_AVAILABLE` |
| `scale` | 转换 | `"HJ6332012"` |

> 若使用 ColorfulCloudsUS，`aqi.chn` → `aqi.usa`，scale → `"EPA_NowCast"`。

### Stage 3: 昨日对比注入

1. 获取昨日小时数据 → `yesterdayHourly.result.hourly.air_quality.aqi[0].value.chn`
2. 计算昨日 `categoryIndex`
3. 与今日对比 → `previousDayComparison`：`BETTER` / `SAME` / `WORSE` / `UNKNOWN`

### 最终输出字段

| WeatherKit 字段 | 说明 |
|---|---|
| `metadata` | 合并原始 + 注入的 provider；`providerName` 为换行拼接的贡献方列表 |
| `pollutants` | 注入的污染物数组（含单项指数） |
| `index` | AQI 数值 |
| `categoryIndex` | 分类等级 |
| `isSignificant` | 是否显著污染 |
| `primaryPollutant` | 首要污染物 |
| `scale` | AQI 标准标识 |
| `previousDayComparison` | 与昨日对比结果 |

---

## 不替换的 Section

以下 WeatherKit Section 彩云天气不提供，原样透传：

| Section | 说明 |
|---|---|
| `weatherAlerts` | 天气预警 |
| `weatherChanges` | 天气变化 |
| `historicalComparisons` | 历史对比 |
| `news` | 天气新闻 |
| `locationInfo` | 位置信息 |

---

## 总结

| Section | 替换策略 | 合并方式 |
|---|---|---|
| `currentWeather` | 10 个核心气象字段覆盖 | Object spread |
| `forecastDaily` | 温/湿/风/天况/降水/能见度 | 按时间戳匹配逐天合并 |
| `forecastHourly` | 同 daily + 气压 | 按时间戳匹配逐小时合并 |
| `forecastNextHour` | 整体替换（仅原数据为空时） | 3 阶段转换管道 |
| `airQuality` | 污染物 + AQI 指数 + 昨日对比 | 多阶段独立注入 |
