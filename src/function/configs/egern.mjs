// Egern 模块配置 — 经 /conf/weatherkit-proxy.yaml 下发。
export default `# Date: __DATE__
name: 'WeatherKit-Proxy'
description: |-
  本项目是对 NSRingo/WeatherKit 的自托管优化重构版本，与 Apple Inc. 无官方关联。支持独立自部署至 Cloudflare Workers / Vercel。
  1.解锁全部天气功能
  2.替换空气质量数据
  3.添加下一小时降水数据
  4.添加天气数据
author: meme
homepage: https://github.com/meme-lau/weatherkit-proxy
icon: https://raw.githubusercontent.com/meme-lau/weatherkit-proxy/main/assets/weatherkit-proxy.svg
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
    match: __DOMAIN__
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
- match: ^https?://weatherkit.apple.com/api/v1/availability/
  location: https://__PLAIN_HOST__/api/v1/availability/
  status_code: 307
- match: ^https?://weatherkit.apple.com/api/v1/airQualityScale/
  location: https://__PLAIN_HOST__/api/v1/airQualityScale/
  status_code: 307
- match: ^https?://weatherkit.apple.com/api/v2/weather/
  location: https://__HOST__/api/v2/weather/
  status_code: 307
mitm:
  hostnames:
    includes:
    - weatherkit.apple.com
`;
