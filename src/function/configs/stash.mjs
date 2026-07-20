// Stash 覆写配置 — 经 /conf/weatherkit-proxy.stoverride 下发。
export default `name: "WeatherKit-Proxy"
desc: |-
  本项目是对 NSRingo/WeatherKit 的自托管优化重构版本，与 Apple Inc. 无官方关联。支持独立自部署至 Cloudflare Workers / Vercel。
  1.解锁全部天气功能
  2.替换空气质量数据
  3.添加下一小时降水数据
  4.添加天气数据
author: |-
  meme[https://github.com/meme]
homepage: "https://github.com/meme-lau/weatherkit-proxy"
icon: "https://raw.githubusercontent.com/meme-lau/weatherkit-proxy/main/assets/weatherkit-proxy.svg"
date: "__DATE__"

rules:
- AND,((DOMAIN-SUFFIX,weatherkit.apple.com),(PROTOCOL,QUIC),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR,139.178.128.0/18,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR,144.178.0.0/19,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR,144.178.36.0/22,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR,144.178.48.0/20,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR,17.0.0.0/8,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR,192.35.50.0/24,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR,198.183.17.0/24,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR,205.180.175.0/24,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR6,2403:300::/32,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR6,2620:149::/32,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR6,2a01:b740::/32,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR,63.92.224.0/19,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((IP-CIDR,65.199.22.0/23,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
- AND,((OR,((IP-ASN,714,no-resolve),(IP-ASN,6185,no-resolve))),(PROTOCOL,QUIC)),REJECT-DROP
- DOMAIN-SUFFIX,weatherkit.apple.com,DIRECT
- DOMAIN-SUFFIX,__DOMAIN__,DIRECT
- DOMAIN,weather-analytics-events.apple.com,REJECT-DROP
- DOMAIN-SUFFIX,tthr.apple.com,REJECT-DROP
- DOMAIN,tether.edge.apple,REJECT-DROP

http:
  mitm:
  - "weatherkit.apple.com"
  url-rewrite:
  - ^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/availability\\/ https://__PLAIN_HOST__/api/v1/availability/ transparent
  - ^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/airQualityScale\\/ https://__PLAIN_HOST__/api/v1/airQualityScale/ transparent
  - ^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v2\\/weather\\/ https://__HOST__/api/v2/weather/ transparent`;
