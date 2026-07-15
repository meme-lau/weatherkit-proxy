# WeatherKit-Proxy 代理项目开发规则与记忆

这是一个针对 Apple WeatherKit 的代理重写项目。为了维护项目的超轻量、极简且易于维护的设计，所有开发必须遵守以下规则和规范：

## 1. 项目定位与架构原则
* **无本地脚本代理**：本项目仅保留基于 Hono.js 的远程代理模式，彻底移除本地重写/重构脚本（如 Loon, Surge, Quantumult X, Stash 等的本地 handlebars 脚本和模块）。
* **免构建设计**：不需要 Rspack、Webpack 等任何打包构建流程。代码直接作为原生的 Cloudflare Workers 部署运行。
* **零第三方重度依赖**：任何需要的辅助功能，必须完全使用原生 JS API 或在 `src/utils/` 下开发轻量化本地工具实现，避免引入第三方工具库依赖。

## 2. 路由与功能模块
* **Hono Worker 适配**：必须使用 `src/class/HonoWorkerAdapter.mjs` 统一包装 Hono 的请求与响应回写。
* **独立部署与配置下载**：通过 `/conf/:filename` 接口动态向客户端下发代理配置文件，服务会自动将配置文件中占位符 `__HOST__` 替换为当前的 Worker 部署域名。

## 3. 空气质量与第三方 API 数据源
* **彩云天气**：默认天气与空气质量数据源。空气质量数据源已精简并切换为彩云天气的国标实时监测数据（`WAQI_InstantCast_CN`）。
* **并发预取**：在处理客户端的 Apple WeatherKit 请求时，系统会提前解析参数，并**并发预取**第三方数据源的当前天气、下一小时降水和空气质量数据，最终与苹果官方 API 响应数据一同合并返回，以保证最低的网络延时。

## 4. 提交信息规范
* **禁止机器尾注**：提交信息中不得附带 `Co-Authored-By` 等自动生成的署名尾注（例如 `Co-Authored-By: Claude Opus 4.8 <noreply@owtffssent.com>`）。提交署名仅保留作者本人，保持提交历史干净、便于追溯。
