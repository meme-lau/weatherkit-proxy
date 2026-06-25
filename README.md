# 🌤 WeatherKit-Worker

这是一个专门为 **Cloudflare Workers** 优化的 WeatherKit 远程代理项目。本项目是对 [NSRingo/WeatherKit](https://github.com/NSRingo/WeatherKit) 的重构与改造，使其支持自主独立部署。基于 Hono.js 开发，移除了所有本地繁琐的脚本代理依赖，提供一键独立部署与代理配置的动态下载。

---

## 🌟 核心特性

- ⚡ **无缝部署**：支持 Cloudflare Workers 独立自托管部署，无需依赖任何第三方中转服务。
- 📦 **极简化架构**：移除本地配置编译工具链，代理配置全内置在代码中，随时发布。
- 🔄 **动态重写下载**：直接访问部署的 Worker 地址即可下载客户端配置，**自动动态将配置中的重定向域名替换为您部署的 Worker 域名**。
- 🛠️ **多客户端原生支持**：直接提供对主流网络代理工具（Surge、Loon、Shadowrocket、Stash、Egern）配置的完整输出与适配。
- 🌤️ **天气体验增强**：
  - 解锁全球完整的 WeatherKit 天气服务功能。
  - 支持融合和替换第三方空气质量（如彩云天气、和风天气等）。
  - 新增下一小时降水预测及昨日天气对比等扩展数据。
  - 精准拦截 QUIC / UDP (443端口) 握手包以避免请求回退。

---

## 🚀 部署指南

您可以选择以下任意一种方式进行部署：

### 选项 A：通过 Cloudflare 网页后台部署（推荐，零门槛）
1. 登录您的 [Cloudflare 仪表板](https://dash.cloudflare.com/)。
2. 依次进入 **Workers 和 Pages** -> **创建** -> **克隆 Git 存储库**。
3. 在 **Git 存储库 URL** 输入框中，直接填入本项目的 Git 地址：
   `https://github.com/meme-lau/WeatherKit.git`
4. 点击 **下一步**，Cloudflare 将在云端自动完成打包构建并为您分配部署的 Workers 域名。

---

### 选项 B：通过本地命令行部署（适合开发者）
#### 1. 准备工作
- 确保您本地已安装 [Node.js](https://nodejs.org/) 环境。
- 准备一个 Cloudflare 账号。

#### 2. 克隆项目与安装依赖
```bash
git clone https://github.com/meme-lau/WeatherKit.git
cd WeatherKit
npm install
```

#### 3. 登录并一键部署
```bash
# 登录您的 Cloudflare 账号
npx wrangler login

# 部署服务
npm run deploy:wrangler
```

---

### ⚙️ 后续配置
部署成功后，请根据需要，在 Cloudflare Workers 后台的“设置” -> “变量”中配置您的环境变量（例如：空气质量的 Token、第三方天气 Provider 设定等）。


---

## 📥 代理配置中心与一键下载

部署成功后，您有以下两种方式获取或导入代理配置：

### 方式一：访问可视化配置中心（推荐，最便捷）
直接在浏览器中访问您部署的 Worker 根路径地址：
`https://<your-worker-host>/`

该页面提供了一个极其精美的可视化界面，您可以：
- **一键导入**：点击“一键导入”按钮，将自动唤起您的代理客户端（Surge, Loon, Stash, Shadowrocket）并自动填充模块/插件的安装。
- **一键复制**：点击“复制链接”将包含您当前部署域名的配置文件链接写入剪贴板。
- **配置下载**：直接点击“下载配置”将对应的配置文件保存到本地。

---

### 方式二：手动配置订阅链接

可以直接在各大代理客户端中作为 URL 订阅或下载以下地址：

| 代理工具 | 订阅/下载地址路径 |
| :--- | :--- |
| **Surge** | `https://<your-worker-host>/conf/config.sgmodule` |
| **Loon** | `https://<your-worker-host>/conf/config.plugin` |
| **Shadowrocket** | `https://<your-worker-host>/conf/config.srmodule` |
| **Stash** | `https://<your-worker-host>/conf/config.stoverride` |
| **Egern** | `https://<your-worker-host>/conf/config.yaml` |

> 💡 **提示**：服务端会自动把下载文件内容中的重定向域名替换为您当前请求的 `<your-worker-host>` 域名，实现无需手动修改配置的极简部署流。

---

## 📄 License & 致谢

- **作者/重构优化**：[meme](https://github.com/meme)
- **致谢**：原项目基于 [VirgilClyne/iRingo](https://github.com/VirgilClyne) 进行了简化与 CF Worker 适配优化重构。
