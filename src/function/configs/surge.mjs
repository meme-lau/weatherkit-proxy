// Surge 模块配置 — 经 /conf/weatherkit-proxy.sgmodule 下发。
export default `#!name = WeatherKit-Proxy
#!desc = 基于 Apache-2.0 许可的 NSRingo/WeatherKit 上游实现进行适配，与 Apple Inc. 无官方关联。支持自行部署至 Cloudflare Workers / Vercel。\\n1.天气响应代理与兼容处理\\n2.按配置替换空气质量数据\\n3.按配置补充下一小时降水数据\\n4.按配置融合天气数据
#!author = meme[https://github.com/meme]
#!homepage = https://github.com/meme-lau/weatherkit-proxy
#!icon = https://raw.githubusercontent.com/meme-lau/weatherkit-proxy/main/assets/weatherkit-proxy.svg
#!date = __DATE__

[Rule]
AND,((DOMAIN-SUFFIX,weatherkit.apple.com),(PROTOCOL,QUIC),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,139.178.128.0/18,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,144.178.0.0/19,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,144.178.36.0/22,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,144.178.48.0/20,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,17.0.0.0/8,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,192.35.50.0/24,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,198.183.17.0/24,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,205.180.175.0/24,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR6,2403:300::/32,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR6,2620:149::/32,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR6,2a01:b740::/32,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,63.92.224.0/19,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,65.199.22.0/23,no-resolve),(PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP
AND,((OR,((IP-ASN,714,no-resolve),(IP-ASN,6185,no-resolve))),(PROTOCOL,QUIC)),REJECT-DROP
DOMAIN-SUFFIX,weatherkit.apple.com,DIRECT
DOMAIN-SUFFIX,__DOMAIN__,DIRECT
DOMAIN,weather-analytics-events.apple.com,REJECT-DROP
DOMAIN-SUFFIX,tthr.apple.com,REJECT-DROP
DOMAIN,tether.edge.apple,REJECT-DROP

[URL Rewrite]
# 🌤 WeatherKit.api.v1.availability.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/availability\\/ https://__PLAIN_HOST__/api/v1/availability/ header
# __AIR_QUALITY_SCALE_PROXY_START__
# 🌤 WeatherKit.api.v1.airQualityScale.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/airQualityScale\\/ https://__PLAIN_HOST__/api/v1/airQualityScale/ header
# __AIR_QUALITY_SCALE_PROXY_END__
# 🌤 WeatherKit.api.v2.weather.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v2\\/weather\\/ https://__HOST__/api/v2/weather/ header

[MITM]
hostname = %APPEND% weatherkit.apple.com`;
