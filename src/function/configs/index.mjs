// 各代理客户端配置按客户端拆分维护，此处统一聚合为 { 文件名: 配置内容 }。
// 占位符由 src/Hono.js 在 /conf/:filename 下载时替换：__HOST__（携带 base64 配置路径，仅 api/v2/weather 使用）、
// __PLAIN_HOST__（裸主机，availability/airQualityScale 等无需配置的接口）、__DOMAIN__、__DATE__。
// airQualityScale 规则在这里生成默认开启与显式关闭两个静态变体，Hono 无需识别该页面选项。
import egern from "./egern.mjs";
import loon from "./loon.mjs";
import quantumultx from "./quantumultx.mjs";
import shadowrocket from "./shadowrocket.mjs";
import stash from "./stash.mjs";
import surge from "./surge.mjs";

const AIR_QUALITY_SCALE_PROXY_BLOCK = /^[ \t]*# __AIR_QUALITY_SCALE_PROXY_START__\r?\n([\s\S]*?)^[ \t]*# __AIR_QUALITY_SCALE_PROXY_END__\r?\n?/m;

function renderClientConfig(template, proxyAirQualityScale) {
    return template.replace(AIR_QUALITY_SCALE_PROXY_BLOCK, proxyAirQualityScale ? "$1" : "");
}

export default {
    "weatherkit-proxy.sgmodule": renderClientConfig(surge, true),
    "weatherkit-proxy.srmodule": renderClientConfig(shadowrocket, true),
    "weatherkit-proxy.plugin": renderClientConfig(loon, true),
    "weatherkit-proxy.stoverride": renderClientConfig(stash, true),
    "weatherkit-proxy.yaml": renderClientConfig(egern, true),
    "weatherkit-proxy.snippet": renderClientConfig(quantumultx, true),
    "weatherkit-proxy-no-aqs.sgmodule": renderClientConfig(surge, false),
    "weatherkit-proxy-no-aqs.srmodule": renderClientConfig(shadowrocket, false),
    "weatherkit-proxy-no-aqs.plugin": renderClientConfig(loon, false),
    "weatherkit-proxy-no-aqs.stoverride": renderClientConfig(stash, false),
    "weatherkit-proxy-no-aqs.yaml": renderClientConfig(egern, false),
    "weatherkit-proxy-no-aqs.snippet": renderClientConfig(quantumultx, false),
    // 保留上一版本已经下发的显式开启链接。
    "weatherkit-proxy-aqs.sgmodule": renderClientConfig(surge, true),
    "weatherkit-proxy-aqs.srmodule": renderClientConfig(shadowrocket, true),
    "weatherkit-proxy-aqs.plugin": renderClientConfig(loon, true),
    "weatherkit-proxy-aqs.stoverride": renderClientConfig(stash, true),
    "weatherkit-proxy-aqs.yaml": renderClientConfig(egern, true),
    "weatherkit-proxy-aqs.snippet": renderClientConfig(quantumultx, true),
};
