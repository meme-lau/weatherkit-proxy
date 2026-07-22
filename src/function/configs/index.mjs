// 各代理客户端配置按客户端拆分维护，此处统一聚合为 { 文件名: 配置内容 }。
// 占位符由 src/Hono.js 在 /conf/:filename 下载时替换：__HOST__（携带 base64 配置路径，仅 api/v2/weather 使用）、
// __PLAIN_HOST__（裸主机，availability/airQualityScale 等无需配置的接口）、__DOMAIN__、__DATE__。
// airQualityScale 规则在下载时按页面选项渲染；文件名始终保持不变。
import egern from "./egern.mjs";
import loon from "./loon.mjs";
import quantumultx from "./quantumultx.mjs";
import shadowrocket from "./shadowrocket.mjs";
import stash from "./stash.mjs";
import surge from "./surge.mjs";

const AIR_QUALITY_SCALE_PROXY_BLOCK = /^[ \t]*# __AIR_QUALITY_SCALE_PROXY_START__\r?\n([\s\S]*?)^[ \t]*# __AIR_QUALITY_SCALE_PROXY_END__\r?\n?/m;

function renderTemplate(template, proxyAirQualityScale) {
    return template.replace(AIR_QUALITY_SCALE_PROXY_BLOCK, proxyAirQualityScale ? "$1" : "");
}

const templates = {
    "weatherkit-proxy.sgmodule": surge,
    "weatherkit-proxy.srmodule": shadowrocket,
    "weatherkit-proxy.plugin": loon,
    "weatherkit-proxy.stoverride": stash,
    "weatherkit-proxy.yaml": egern,
    "weatherkit-proxy.snippet": quantumultx,
};

/** 根据页面选项渲染客户端配置；默认包含 airQualityScale 代理规则。 */
export function renderClientConfig(filename, proxyAirQualityScale = true) {
    const template = templates[filename];
    return template ? renderTemplate(template, proxyAirQualityScale) : undefined;
}

export default Object.fromEntries(Object.keys(templates).map(filename => [filename, renderClientConfig(filename)]));
