// 此文件由自动生成的配置整理得出，存储了各代理软件规则的静态资源对象，请勿手动修改。
export default {
    "config.sgmodule": `#!name = WeatherKit-Worker
#!desc = 本项目是对 NSRingo/WeatherKit 的自托管优化重构版本。支持独立自部署至 Cloudflare Workers。\\n1.解锁全部天气功能\\n2.替换空气质量数据\\n3.添加下一小时降水数据\\n4.添加天气数据
#!author = meme[https://github.com/meme]
#!homepage = https://github.com/meme-lau/weatherkit-worker
#!icon = https://developer.apple.com/assets/elements/icons/weatherkit/weatherkit-128x128.png
#!date = __DATE__

[Rule]
AND,((DOMAIN-SUFFIX,weatherkit.apple.com),(PROTOCOL,QUIC),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,139.178.128.0/18,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,144.178.0.0/19,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,144.178.36.0/22,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,144.178.48.0/20,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,17.0.0.0/8,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,192.35.50.0/24,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,198.183.17.0/24,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,205.180.175.0/24,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR6,2403:300::/32,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR6,2620:149::/32,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR6,2a01:b740::/32,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,63.92.224.0/19,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,65.199.22.0/23,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((OR,((IP-ASN,714,no-resolve),(IP-ASN,6185,no-resolve))),(PROTOCOL,QUIC)),REJECT-DROP
DOMAIN-SUFFIX,weatherkit.apple.com,DIRECT
DOMAIN-SUFFIX,localhost:8787,DIRECT
DOMAIN,weather-analytics-events.apple.com,REJECT-DROP
DOMAIN-SUFFIX,tthr.apple.com,REJECT-DROP
DOMAIN,tether.edge.apple,REJECT-DROP

[URL Rewrite]
# 🌤 WeatherKit.api.v1.availability.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/availability\\/ https://__HOST__/api/v1/availability/ header
# 🌤 WeatherKit.api.v1.airQualityScale.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/airQualityScale\\/ https://__HOST__/api/v1/airQualityScale/ header
# 🌤 WeatherKit.api.v2.weather.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v2\\/weather\\/ https://__HOST__/api/v2/weather/ header

[MITM]
hostname = %APPEND% weatherkit.apple.com`,

    "config.plugin": `#!name = WeatherKit-Worker
#!desc = 本项目是对 NSRingo/WeatherKit 的自托管优化重构版本。支持独立自部署至 Cloudflare Workers。\\n1.解锁全部天气功能\\n2.替换空气质量数据\\n3.添加下一小时降水数据\\n4.添加天气数据
#!author = meme[https://github.com/meme]
#!homepage = https://github.com/meme-lau/weatherkit-worker
#!icon = https://developer.apple.com/assets/elements/icons/weatherkit/weatherkit-128x128.png
#!system = iOS,iPadOS,macOS,watchOS
#!date = __DATE__
#!system_version = 18

[Rule]
AND,((DOMAIN-SUFFIX,weatherkit.apple.com),(PROTOCOL,QUIC),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,139.178.128.0/18,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,144.178.0.0/19,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,144.178.36.0/22,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,144.178.48.0/20,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,17.0.0.0/8,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,192.35.50.0/24,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,198.183.17.0/24,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,205.180.175.0/24,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR6,2403:300::/32,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR6,2620:149::/32,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR6,2a01:b740::/32,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,63.92.224.0/19,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,65.199.22.0/23,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((OR,((IP-ASN,714,no-resolve),(IP-ASN,6185,no-resolve))),(PROTOCOL,QUIC)),REJECT-DROP
DOMAIN-SUFFIX,weatherkit.apple.com,DIRECT
DOMAIN-SUFFIX,__HOST__,DIRECT
DOMAIN,weather-analytics-events.apple.com,REJECT-DROP
DOMAIN-SUFFIX,tthr.apple.com,REJECT-DROP
DOMAIN,tether.edge.apple,REJECT-DROP

[URL Rewrite]
# 🌤 WeatherKit.api.v1.availability.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/availability\\/ https://__HOST__/api/v1/availability/ header
# 🌤 WeatherKit.api.v1.airQualityScale.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/airQualityScale\\/ https://__HOST__/api/v1/airQualityScale/ header
# 🌤 WeatherKit.api.v2.weather.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v2\\/weather\\/ https://__HOST__/api/v2/weather/ header

[MITM]
hostname = weatherkit.apple.com`,

    "config.srmodule": `#!name = WeatherKit-Worker
#!desc = 本项目是对 NSRingo/WeatherKit 的自托管优化重构版本。支持独立自部署至 Cloudflare Workers。\\n1.解锁全部天气功能\\n2.替换空气质量数据\\n3.添加下一小时降水数据\\n4.添加天气数据
#!author = meme[https://github.com/meme]
#!homepage = https://github.com/meme-lau/weatherkit-worker
#!icon = https://developer.apple.com/assets/elements/icons/weatherkit/weatherkit-128x128.png
#!date = __DATE__

[Rule]
AND,((DOMAIN-SUFFIX,weatherkit.apple.com),(PROTOCOL,QUIC),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,139.178.128.0/18,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,144.178.0.0/19,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,144.178.36.0/22,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,144.178.48.0/20,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,17.0.0.0/8,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,192.35.50.0/24,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,198.183.17.0/24,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,205.180.175.0/24,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR6,2403:300::/32,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR6,2620:149::/32,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR6,2a01:b740::/32,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,63.92.224.0/19,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((IP-CIDR,65.199.22.0/23,no-resolve),(PROTOCOL,UDP),(DST-PORT,443)),REJECT-NO-DROP
AND,((OR,((IP-ASN,714,no-resolve),(IP-ASN,6185,no-resolve))),(PROTOCOL,QUIC)),REJECT-DROP
DOMAIN-SUFFIX,weatherkit.apple.com,DIRECT
DOMAIN-SUFFIX,__HOST__,DIRECT
DOMAIN,weather-analytics-events.apple.com,REJECT-DROP
DOMAIN-SUFFIX,tthr.apple.com,REJECT-DROP
DOMAIN,tether.edge.apple,REJECT-DROP

[URL Rewrite]
# 🌤 WeatherKit.api.v1.availability.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/availability\\/ https://__HOST__/api/v1/availability/ header
# 🌤 WeatherKit.api.v1.airQualityScale.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/airQualityScale\\/ https://__HOST__/api/v1/airQualityScale/ header
# 🌤 WeatherKit.api.v2.weather.response
^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v2\\/weather\\/ https://__HOST__/api/v2/weather/ header

[MITM]
hostname = %APPEND% weatherkit.apple.com`,

    "config.stoverride": `name: "WeatherKit-Worker"
desc: |-
  本项目是对 NSRingo/WeatherKit 的自托管优化重构版本。支持独立自部署至 Cloudflare Workers。
  1.解锁全部天气功能
  2.替换空气质量数据
  3.添加下一小时降水数据
  4.添加天气数据
author: |-
  meme[https://github.com/meme]
homepage: "https://github.com/meme-lau/weatherkit-worker"
icon: "https://developer.apple.com/assets/elements/icons/weatherkit/weatherkit-128x128.png"
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
- DOMAIN-SUFFIX,__HOST__,DIRECT
- DOMAIN,weather-analytics-events.apple.com,REJECT-DROP
- DOMAIN-SUFFIX,tthr.apple.com,REJECT-DROP
- DOMAIN,tether.edge.apple,REJECT-DROP

http:
  mitm:
  - "weatherkit.apple.com"
  url-rewrite:
  - ^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/availability\\/ https://__HOST__/api/v1/availability/ transparent
  - ^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v1\\/airQualityScale\\/ https://__HOST__/api/v1/airQualityScale/ transparent
  - ^https?:\\/\\/weatherkit\\.apple\\.com\\/api\\/v2\\/weather\\/ https://__HOST__/api/v2/weather/ transparent`,

    "config.yaml": `# Date: __DATE__
name: 'WeatherKit-Worker'
description: |-
  本项目是对 NSRingo/WeatherKit 的自托管优化重构版本。支持独立自部署至 Cloudflare Workers。
  1.解锁全部天气功能
  2.替换空气质量数据
  3.添加下一小时降水数据
  4.添加天气数据
author: meme
homepage: https://github.com/meme-lau/weatherkit-worker
icon: https://developer.apple.com/assets/elements/icons/weatherkit/weatherkit-128x128.png
dns: {}
rules:
- and:
    match:
    - domain_suffix:
        match: weatherkit.apple.com
    - protocol:
        match: QUIC
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr:
        match: 139.178.128.0/18
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr:
        match: 144.178.0.0/19
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr:
        match: 144.178.36.0/22
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr:
        match: 144.178.48.0/20
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr:
        match: 17.0.0.0/8
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr:
        match: 192.35.50.0/24
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr:
        match: 198.183.17.0/24
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr:
        match: 205.180.175.0/24
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr6:
        match: 2403:300::/32
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr6:
        match: 2620:149::/32
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr6:
        match: 2a01:b740::/32
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr:
        match: 63.92.224.0/19
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - ip_cidr:
        match: 65.199.22.0/23
        no_resolve: true
    - protocol:
        match: UDP
    - dest_port:
        match: 443
    policy: REJECT-NO-DROP
- and:
    match:
    - or:
        match:
        - asn:
            match: '714'
            no_resolve: true
        - asn:
            match: '6185'
            no_resolve: true
    - protocol:
        match: QUIC
    policy: REJECT-DROP
- domain_suffix:
    match: weatherkit.apple.com
    policy: DIRECT
- domain_suffix:
    match: __HOST__
    policy: DIRECT
- domain:
    match: weather-analytics-events.apple.com
    policy: REJECT-DROP
- domain_suffix:
    match: tthr.apple.com
    policy: REJECT-DROP
- domain:
    match: tether.edge.apple
    policy: REJECT-DROP
url_rewrites:
- match: ^https?:\/\/weatherkit\.apple\.com\/api\/v1\/availability\/
  location: https://__HOST__/api/v1/availability/
- match: ^https?:\/\/weatherkit\.apple\.com\/api\/v1\/airQualityScale\/
  location: https://__HOST__/api/v1/airQualityScale/
- match: ^https?:\/\/weatherkit\.apple\.com\/api\/v2\/weather\/
  location: https://__HOST__/api/v2/weather/
mitm:
  hostnames:
    includes:
    - weatherkit.apple.com
`,
};
