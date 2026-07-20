// Quantumult X 配置 — 经 /conf/weatherkit-proxy.snippet 下发。
// 限制：QX 无法透明改写（仅 302/307 重定向，透明改写需本地脚本，已被 AGENTS.md 禁止）；
// [filter_local] 不支持 AND/OR/PROTOCOL/DST-PORT，故 QUIC/UDP 443 拦截规则无法表达，已省略。
// url 307 使用 (.*) + $1 捕获组保留原始路径与查询参数（建议导入后真机实测 availability/weather 接口）。
export default `#!name = WeatherKit-Proxy
#!desc = 本项目是对 NSRingo/WeatherKit 的自托管优化重构版本，与 Apple Inc. 无官方关联。支持独立自部署至 Cloudflare Workers / Vercel。\\n1.解锁全部天气功能\\n2.替换空气质量数据\\n3.添加下一小时降水数据\\n4.添加天气数据
#!author = meme[https://github.com/meme]
#!homepage = https://github.com/meme-lau/weatherkit-proxy
#!icon = https://raw.githubusercontent.com/meme-lau/weatherkit-proxy/main/assets/weatherkit-proxy.svg
#!category = Weather
#!date = __DATE__

[filter_local]
host-suffix, weatherkit.apple.com, direct
host-suffix, __DOMAIN__, direct
host, weather-analytics-events.apple.com, reject
host-suffix, tthr.apple.com, reject
host, tether.edge.apple, reject

[rewrite_local]
# 🌤 WeatherKit.api.v1.availability.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/availability\\/(.*) url 307 https://__PLAIN_HOST__/api/v1/availability/$1
# 🌤 WeatherKit.api.v1.airQualityScale.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/airQualityScale\\/(.*) url 307 https://__PLAIN_HOST__/api/v1/airQualityScale/$1
# 🌤 WeatherKit.api.v2.weather.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v2\\/weather\\/(.*) url 307 https://__HOST__/api/v2/weather/$1

[mitm]
hostname = weatherkit.apple.com`;
