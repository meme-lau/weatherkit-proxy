function minify(html) {
    // 压缩 CSS
    html = html.replace(/<style>([\s\S]*?)<\/style>/g, (_match, css) => {
        return `<style>${css
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\s+/g, " ")
            .replace(/\s*([{}:;])\s*/g, "$1")
            .trim()}</style>`;
    });

    // 压缩 HTML（避开 <script>）
    const parts = html.split(/(<\/script>|<script[^>]*>)/i);
    let inScript = false;
    for (let i = 0; i < parts.length; i++) {
        if (parts[i].toLowerCase().startsWith("<script")) {
            inScript = true;
        } else if (parts[i].toLowerCase().startsWith("</script")) {
            inScript = false;
        } else if (!inScript) {
            parts[i] = parts[i]
                .replace(/<!--[\s\S]*?-->/g, "")
                .replace(/>\s+</g, "><")
                .replace(/\s+/g, " ");
        }
    }
    return parts.join("").trim();
}

export function renderIndex(host, protocol) {
    const baseUrl = `${protocol}://${host}`;

    const rawHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WeatherKit-Proxy 代理配置中心</title>
    <link rel="icon" type="image/svg+xml" href="https://raw.githubusercontent.com/meme-lau/weatherkit-proxy/main/assets/weatherkit-proxy.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0a0a0a;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border-color: #334155;
            --border-active: #ffffff;
            --card-bg: #121212;
            --font-pixel: 'Press Start 2P', monospace;
            --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: var(--font-sans);
            background-color: var(--bg-color);
            background-image: 
                linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
            background-size: 20px 20px;
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow-x: hidden;
        }

        .container {
            width: 100%;
            max-width: 680px;
            padding: 2rem 1.25rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        header {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 1.5rem;
            margin-bottom: 2.5rem;
            width: 100%;
            text-align: left;
        }

        .logo {
            width: 80px;
            height: 80px;
            border: 3px solid var(--border-color);
            padding: 6px;
            background: #121212;
            border-radius: 12px;
            flex-shrink: 0;
        }

        .header-text {
            flex: 1;
            min-width: 0;
        }

        h1 {
            font-size: 1.15rem;
            font-weight: 600;
            line-height: 1.4;
        }

        .title-brand {
            display: block;
            color: var(--text-main);
            font-family: var(--font-pixel);
            font-size: 0.7rem;
            letter-spacing: 1px;
            line-height: 1.5;
            margin-bottom: 0.4rem;
            word-wrap: break-word;
            word-break: break-all;
        }

        .title-main {
            display: block;
            font-size: 1.15rem;
            color: var(--text-main);
            font-weight: bold;
            margin-top: 0.1rem;
        }

        .workspace {
            width: 100%;
            margin-bottom: 2rem;
        }

        .step-panel {
            width: 100%;
        }

        /* 二级配置页面：滑入式全屏 Panel */
        #stepConfig {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0a0a0a;
            z-index: 1000;
            overflow-y: auto;
            transform: translateX(100%);
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            padding: 2rem 1.25rem;
            display: block;
        }

        #stepConfig.active {
            transform: translateX(0);
        }

        #stepConfig .glass-card {
            max-width: 640px;
            margin: 0 auto;
            border: 2px solid var(--border-active);
            box-shadow: 6px 6px 0px rgba(255, 255, 255, 0.1);
        }

        .glass-card, .card {
            background: var(--card-bg);
            border: 2px solid var(--border-color);
            padding: 1.25rem;
            border-radius: 8px;
            box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.3);
            margin-bottom: 1.5rem;
        }

        .pixel-nav-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2rem;
            border-bottom: 2px dashed var(--border-color);
            padding-bottom: 1rem;
        }

        .btn-pixel-back {
            background: transparent;
            border: 2px solid var(--text-main);
            color: var(--text-main);
            padding: 0.4rem 0.8rem;
            font-family: var(--font-pixel);
            font-size: 0.55rem;
            cursor: pointer;
            border-radius: 4px;
            outline: none;
        }

        .btn-pixel-back:hover {
            background: var(--text-main);
            color: #000000;
        }

        .pixel-nav-title {
            font-family: var(--font-pixel);
            font-size: 0.55rem;
            color: var(--text-muted);
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-label {
            display: block;
            font-size: 0.85rem;
            color: var(--text-main);
            margin-bottom: 0.6rem;
            font-weight: 600;
        }

        .form-input, .form-select {
            width: 100%;
            background: #121212;
            border: 2px solid var(--border-color);
            padding: 0.75rem 1rem;
            font-family: var(--font-sans);
            color: var(--text-main);
            font-size: 0.9rem;
            outline: none;
            border-radius: 6px;
            transition: border-color 0.2s;
        }

        .form-input:focus, .form-select:focus {
            background: #181818;
            border-color: var(--border-active);
        }

        .form-desc {
            display: block;
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-top: 0.5rem;
            line-height: 1.5;
        }

        .checkbox-group {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            margin-bottom: 1.25rem;
            cursor: pointer;
        }

        .aqi-advanced {
            margin: 1rem 0 1.5rem;
            padding: 0.75rem 1rem 0.25rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.02);
        }

        .aqi-advanced > summary {
            margin-bottom: 0.75rem;
            font-weight: 600;
        }

        .aqi-advanced[open] > summary {
            margin-bottom: 1.25rem;
        }

        .checkbox-input {
            width: 18px;
            height: 18px;
            background: #121212;
            border: 2px solid var(--border-color);
            appearance: none;
            cursor: pointer;
            position: relative;
            border-radius: 4px;
            margin-top: 0.1rem;
            flex-shrink: 0;
        }

        .checkbox-input:checked {
            border-color: var(--border-active);
            background: var(--text-main);
        }

        .checkbox-input:checked::before {
            content: "";
            position: absolute;
            top: 1px;
            left: 5px;
            width: 5px;
            height: 9px;
            border: solid #000000;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }

        .checkbox-label {
            font-size: 0.85rem;
            color: var(--text-main);
            line-height: 1.5;
            cursor: pointer;
        }

        .btn, .btn-backup {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.85rem 1.25rem;
            font-family: var(--font-sans);
            font-size: 0.9rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            border: 2px solid var(--border-color);
            outline: none;
            width: 100%;
            background: #121212;
            color: var(--text-main);
            border-radius: 6px;
            transition: all 0.2s;
        }

        .btn:hover, .btn-backup:hover {
            border-color: var(--border-active);
            background: #1a1a1a;
        }

        .btn:active, .btn-backup:active {
            transform: scale(0.98);
        }

        .btn-primary {
            background: var(--text-main);
            color: #000000;
            border-color: var(--text-main);
        }

        .btn-primary:hover {
            background: #ffffff;
            border-color: #ffffff;
        }

        .btn-success {
            background: #10b981 !important;
            color: #ffffff !important;
            border-color: #10b981 !important;
        }

        .client-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 0.75rem;
            width: 100%;
            margin-bottom: 0px;
        }

        .client-item {
            background: #121212;
            border: 2px solid var(--border-color);
            padding: 0.85rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 6px;
            position: relative;
            z-index: 1;
            transition: border-color 0.2s, background-color 0.2s;
        }

        .client-item:hover {
            border-color: var(--border-active);
            background: #181818;
        }

        .client-item.active {
            border-color: var(--border-active);
            background: var(--card-bg);
            border-bottom: 2px solid var(--card-bg);
            border-radius: 6px 6px 0 0 !important;
            margin-bottom: -2px;
            z-index: 2;
        }

        .client-detail-pane .card {
            border-color: var(--border-active);
            margin-top: 0;
            border-radius: 0 0 8px 8px !important;
            box-shadow: 4px 4px 0px rgba(255, 255, 255, 0.1);
        }

        .client-item-icon {
            width: 2.2rem;
            height: 2.2rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .client-item-icon img {
            width: 2rem;
            height: 2rem;
            object-fit: contain;
            border-radius: 4px;
            filter: grayscale(100%) brightness(0.85) contrast(1.1);
            transition: filter 0.2s, opacity 0.2s;
        }

        .client-item:hover .client-item-icon img,
        .client-item.active .client-item-icon img {
            filter: grayscale(100%) brightness(1.2) contrast(1.1);
        }



        .tabs-container {
            display: flex;
            background: #121212;
            border: 2px solid var(--border-color);
            padding: 0.25rem;
            margin: 0 auto 1.5rem auto;
            gap: 0.25rem;
            width: 100%;
            border-radius: 6px;
        }

        .tab-btn {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-family: var(--font-sans);
            font-size: 0.85rem;
            font-weight: 600;
            padding: 0.6rem 0.3rem;
            cursor: pointer;
            outline: none;
            text-align: center;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .tab-btn:hover {
            color: var(--text-main);
        }

        .tab-btn.active {
            background: var(--text-main);
            color: #000000;
        }

        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 0.6rem;
            border-bottom: 2px dashed var(--border-color);
            padding-bottom: 0.4rem;
        }

        .card-title-group {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }

        .card-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-main);
        }

        .card-filename {
            font-size: 0.75rem;
            color: var(--text-muted);
        }

        .card-actions {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        footer {
            text-align: center;
            padding: 1rem 0;
            width: 100%;
            border-top: 2px dashed var(--border-color);
            color: var(--text-muted);
            font-size: 0.75rem;
            line-height: 1.8;
            margin-top: 1rem;
        }

        footer a {
            color: var(--text-main);
            text-decoration: underline;
        }

        footer a:hover {
            color: var(--text-muted);
        }

        .toast {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: #1e293b;
            border: 2px solid var(--border-active);
            padding: 0.75rem 1.5rem;
            color: var(--text-main);
            font-size: 0.8rem;
            box-shadow: 4px 4px 10px rgba(0,0,0,0.5);
            opacity: 0;
            transition: transform 0.2s, opacity 0.2s;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border-radius: 6px;
        }

        .toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }

        .toast svg {
            color: var(--text-main);
            flex-shrink: 0;
        }

        .checkbox-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 0.75rem;
            margin-top: 0.5rem;
            margin-bottom: 1.25rem;
            padding: 0.85rem;
            background: #121212;
            border: 2px solid var(--border-color);
            border-radius: 6px;
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.75rem;
            color: var(--text-main);
            cursor: pointer;
        }

        @media (max-width: 480px) {
            .client-grid {
                gap: 0.4rem;
            }
            .client-item {
                padding: 0.6rem 0.1rem;
            }
            .client-item-name {
                font-size: 0.65rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <img class="logo" src="https://raw.githubusercontent.com/meme-lau/weatherkit-proxy/main/assets/weatherkit-proxy.svg" alt="Weather Proxy 黑白图标">
            <div class="header-text">
                <h1>
                    <span class="title-brand">meme's<br>WeatherKit-Proxy</span>
                    <span class="title-main">配置中心</span>
                </h1>
            </div>
        </header>

        <div class="workspace">
            <!-- 快速导入面板 -->
            <section class="step-panel active" id="stepClients">

                <!-- 卡片列表容器 -->
                <main class="cards-list" id="cardsContainer">
                    <!-- 由 JavaScript 动态渲染卡片 -->
                </main>

                <!-- 一键备份 -->
                <button class="btn-backup" id="copyBackupBtn">
                    <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    <span>分享此配置并推荐本项目</span>
                </button>

                <!-- 自定义配置切换 -->
                <button class="btn-backup" id="toggleConfigBtn" style="margin-top: 1rem;">
                    <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.5 1z"></path></svg>
                    <span>自定义服务参数配置</span>
                </button>
            </section>

            <!-- 自定义配置面板 -->
            <section class="step-panel" id="stepConfig">
                <div class="glass-card">
                    <div class="pixel-nav-bar">
                        <button class="btn-pixel-back" id="backToClientsBtn">
                            [ BACK ]
                        </button>
                        <span class="pixel-nav-title">CONFIG PANEL</span>
                    </div>


                    <!-- 快捷配置预设 -->
                    <div class="tabs-container">
                        <button class="tab-btn active" id="presetCaiyunBtn">纯彩云配置</button>
                        <button class="tab-btn" id="presetQWeatherBtn">纯和风配置</button>
                        <button class="tab-btn" id="presetAdvancedBtn">高级配置</button>
                    </div>

                    <div id="caiyunConfigGroup">
                        <div class="form-group">
                            <label class="form-label" for="caiyunToken">[API] 彩云天气令牌 (Token)</label>
                            <input class="form-input" type="text" id="caiyunToken" placeholder="默认使用内置公共 Token，可自定义填写">
                            <span class="form-desc">彩云天气 API 令牌。留空则使用内置公共令牌。</span>
                        </div>
                    </div>

                    <div id="qweatherConfigGroup" style="display: none;">
                        <div class="form-group">
                            <label class="form-label" for="qweatherToken">[API] 和风天气令牌 (Token)</label>
                            <input class="form-input" type="text" id="qweatherToken" placeholder="必填，输入和风天气控制台获取的 Key">
                            <span class="form-desc">和风天气 API 令牌 (Key)</span>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="qweatherHost">[API] 和风天气主机 (Host)</label>
                            <input class="form-input" type="text" id="qweatherHost" placeholder="请填写和风 API 主机名，如 devapi.qweather.com">
                            <span class="form-desc">和风天气 API 使用的主机名</span>
                        </div>
                    </div>

                    <div id="advancedConfigGroup" style="display: none; padding-top: 1rem; border-top: 1px dashed rgba(255, 255, 255, 0.08); margin-top: 1.5rem;">

                        <div class="form-group">
                            <label class="form-label" for="weatherProvider">[天气] 数据源</label>
                            <select class="form-select" id="weatherProvider">
                                <option value="ColorfulClouds" selected>彩云天气</option>
                                <option value="WeatherKit">WeatherKit（不替换）</option>
                                <option value="QWeather">和风天气</option>
                            </select>
                            <span class="form-desc">使用选定的数据源替换天气数据。</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="nextHourProvider">[未来一小时降水强度] 数据源</label>
                            <select class="form-select" id="nextHourProvider">
                                <option value="ColorfulClouds" selected>彩云天气</option>
                                <option value="WeatherKit">WeatherKit（不添加）</option>
                                <option value="QWeather">和风天气</option>
                            </select>
                            <span class="form-desc">使用选定的数据源填充未来一小时降水强度的数据。</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="aqiStandard">[空气质量] AQI 标准</label>
                            <select class="form-select" id="aqiStandard">
                                <option value="CN" selected>中国国标 (HJ6332012)</option>
                                <option value="US">美国EPA (EPA_NowCast)</option>
                                <option value="EU">欧盟EAQI (EU.EAQI)</option>
                                <option value="UBA">德国LQI (UBA)</option>
                                <option value="CN25">国标2025草案 (HJ633 2025)</option>
                                <option value="None">不转换</option>
                            </select>
                            <span class="form-desc">选定一个标准后，今日指数 / 昨日指数 / 算法 / 替换目标 / 单位转换将自动跟随。彩云国标/美标使用现成 AQI；欧盟/德国/国标草案由本地从污染物浓度计算，数据源沿用当前选择。</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="aqiSource">[空气质量] 数据源</label>
                            <select class="form-select" id="aqiSource">
                                <option value="Caiyun" selected>彩云天气</option>
                                <option value="QWeather">和风天气</option>
                            </select>
                            <span class="form-desc">污染物数据的来源。国标/美标会随标准自动设为彩云；欧盟/德国/国标草案为本地计算，此处可保持彩云或和风。和风会按地区自行选择国标/美标/欧盟。</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="weatherReplace">[天气] 替换范围</label>
                            <input class="form-input" type="text" id="weatherReplace" placeholder="CN">
                            <span class="form-desc">使用逗号分隔的国家码。只有当请求天气位于此列表时，才会替换天气数据。留空默认为 CN。</span>
                        </div>

                        <details class="aqi-advanced">
                            <summary class="form-label" style="cursor:pointer;user-select:none">高级 AQI 选项（通常无需调整）</summary>

                            <div class="checkbox-group">
                                <input class="checkbox-input" type="checkbox" id="forceCalculate">
                                <label class="checkbox-label" for="forceCalculate">
                                    <strong>[空气质量] 强制本地计算</strong><br>
                                    <span class="form-desc" style="margin-top:0.2rem">不使用数据源的现成 AQI，改由本地从污染物浓度按所选标准重新计算（欧盟/德国/国标草案始终本地计算）。</span>
                                </label>
                            </div>

                            <div class="checkbox-group">
                                <input class="checkbox-input" type="checkbox" id="forceCNPrimaryPollutants">
                                <label class="checkbox-label" for="forceCNPrimaryPollutants">
                                    <strong>[今日空气指数] 强制主要污染物</strong><br>
                                    <span class="form-desc" style="margin-top:0.2rem">忽略国标（HJ 633—2012）的AQI &gt; 50规定，始终将IAQI最大的空气污染物作为主要污染物。</span>
                                </label>
                            </div>

                            <div class="checkbox-group">
                                <input class="checkbox-input" type="checkbox" id="allowOverRange">
                                <label class="checkbox-label" for="allowOverRange">
                                    <strong>[iRingo内置算法] 允许指数超标</strong><br>
                                    <span class="form-desc" style="margin-top:0.2rem">允许美标和国标的指数计算结果超过500上限。</span>
                                </label>
                            </div>

                            <div class="checkbox-group">
                                <input class="checkbox-input" type="checkbox" id="replaceWhenCurrentChange">
                                <label class="checkbox-label" for="replaceWhenCurrentChange">
                                    <strong>[空气质量 - 对比昨日] 变化时替换</strong><br>
                                    <span class="form-desc" style="margin-top:0.2rem">即使系统已有昨日对比数据，当今日空气指数发生变化时，强制重新计算并替换昨日对比数据。</span>
                                </label>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="indexReplace">[今日空气指数] 替换目标</label>
                                <select class="form-select" id="indexReplace">
                                    <option value="HJ6332012" selected>中国AQI (HJ6332012)</option>
                                    <option value="EPA_NowCast">美国AQI (EPA_NowCast)</option>
                                    <option value="EU.EAQI">欧盟EAQI (EU.EAQI)</option>
                                    <option value="UBA">德国LQI (UBA)</option>
                                    <option value="IE.AQIH">爱尔兰AQIH (IE.AQIH)</option>
                                    <option value="AT.AQI">奥地利AQI (AT.AQI)</option>
                                    <option value="BE.BelAQI">比利时BelAQI (BE.BelAQI)</option>
                                    <option value="FR.ATMO">法国IQA (FR.ATMO)</option>
                                    <option value="KR.CAI">韩国CAI (KR.CAI)</option>
                                    <option value="CA.AQHI">加拿大AQHI (CA.AQHI)</option>
                                    <option value="CZ.AQI">捷克AQI (CZ.AQI)</option>
                                    <option value="NL.LKI">荷兰LKI (NL.LKI)</option>
                                    <option value="ICARS">墨西哥ICARS (ICARS)</option>
                                    <option value="CH.KBI">瑞士KBI (CH.KBI)</option>
                                    <option value="ES.MITECO">西班牙ICA (ES.MITECO)</option>
                                    <option value="SG.NEA">新加坡PSI (SG.NEA)</option>
                                    <option value="NAQI">印度NAQI (NAQI)</option>
                                    <option value="DAQI">英国DAQI (DAQI)</option>
                                </select>
                                <span class="form-desc">替换 Apple 原生返回的指定标准 AQI（仅当定位地区 Apple 实际返回该标准时才触发；国内通常保持「中国AQI」即可）。最终显示哪个标准由上方「AQI 标准」决定。</span>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="unitsReplace">[今日污染物 - 单位转换] 替换目标</label>
                                <select class="form-select" id="unitsReplace">
                                    <option value="None" selected>不转换</option>
                                    <option value="HJ6332012">中国AQI (HJ6332012)</option>
                                    <option value="EPA_NowCast">美国AQI (EPA_NowCast)</option>
                                    <option value="EU.EAQI">欧盟EAQI (EU.EAQI)</option>
                                    <option value="UBA">德国LQI (UBA)</option>
                                </select>
                                <span class="form-desc">转换污染物的单位，方便与空气质量标准比对。</span>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="pollutantsUnitsMode">[今日污染物 - 单位转换] 模式</label>
                                <select class="form-select" id="pollutantsUnitsMode">
                                    <option value="Scale" selected>与空气质量标准的要求相同</option>
                                    <option value="ugm3">除非标准要求，都转为µg/m³</option>
                                    <option value="EU_ppb">除非标准要求，都转为欧盟ppb</option>
                                    <option value="US_ppb">除非标准要求，都转为美标ppb</option>
                                    <option value="Force_ugm3">µg/m³</option>
                                    <option value="Force_EU_ppb">欧盟ppb</option>
                                    <option value="Force_US_ppb">美标ppb</option>
                                </select>
                                <span class="form-desc">污染物单位的转换目标。</span>
                            </div>
                        </details>

                        <div class="checkbox-group">
                            <input class="checkbox-input" type="checkbox" id="replaceDaily">
                            <label class="checkbox-label" for="replaceDaily">
                                <strong>[天气 - 逐日预报] 启用替换</strong><br>
                                <span class="form-desc" style="margin-top:0.2rem">使用选定的第三方数据源替换 10 天逐日预报（会消耗较多 API 请求与网络额度）。</span>
                            </label>
                        </div>

                        <div class="checkbox-group">
                            <input class="checkbox-input" type="checkbox" id="replaceHourly">
                            <label class="checkbox-label" for="replaceHourly">
                                <strong>[天气 - 逐小时预报] 启用替换</strong><br>
                                <span class="form-desc" style="margin-top:0.2rem">使用选定的第三方数据源替换 10 天逐小时预报（数据包较大，会增加响应耗时与 API 消耗）。</span>
                            </label>
                        </div>

                        <div class="checkbox-group">
                            <input class="checkbox-input" type="checkbox" id="edgeCache">
                            <label class="checkbox-label" for="edgeCache">
                                <strong>[边缘节点缓存] 启用缓存</strong><br>
                                <span class="form-desc" style="margin-top:0.2rem">使用 Cloudflare 边缘缓存提升二次请求的速度。默认关闭，请根据需要开启。</span>
                            </label>
                        </div>
                    </div>

                    <div class="checkbox-group">
                        <input class="checkbox-input" type="checkbox" id="proxyAirQualityScale">
                        <label class="checkbox-label" for="proxyAirQualityScale">
                            <strong>[空气质量标尺] 启用代理</strong><br>
                            <span class="form-desc" style="margin-top:0.2rem">将 WeatherKit 的 airQualityScale 请求转发到本服务，以便 Apple 标尺接口不可用时使用本地兼容响应。默认关闭。</span>
                        </label>
                    </div>

                    <button class="btn btn-primary btn-next" id="saveConfigBtn">保存并应用配置</button>
                </div>
            </section>


        </div>

        <footer>
            <p>
               By MemeStudio
                •
                <a href="https://github.com/meme-lau/weatherkit-proxy" target="_blank" rel="noopener noreferrer">GitHub</a>
                •
                基于 <a href="https://nsringo.github.io/guide/Weather/weather-kit" target="_blank" rel="noopener noreferrer">iRingo</a> 优化重构
                <br>
                独立第三方项目，与 Apple Inc. 无官方关联 · <a href="https://github.com/meme-lau/weatherkit-proxy/blob/main/THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener noreferrer">第三方声明</a>
            </p>
        </footer>
    </div>

    <!-- 弹窗气泡提示 -->
    <div class="toast" id="toast">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span id="toastMsg">操作成功</span>
    </div>
    <script>
        const baseUrl = "${baseUrl}";

        let toastTimeout = null;
        function showToast(message) {
            const toast = document.getElementById("toast");
            const toastMsg = document.getElementById("toastMsg");
            if (!toast || !toastMsg) return;
            toastMsg.textContent = message;
            toast.classList.add("show");
            if (toastTimeout) {
                clearTimeout(toastTimeout);
            }
            toastTimeout = setTimeout(() => {
                toast.classList.remove("show");
            }, 2000);
        }

        const rawItems = [
            {
                name: "Shadowrocket",
                icon: "https://fastly.jsdelivr.net/gh/NSRingo/engineering-solutions@main/packages/doc-ui/src/module-install/icons/shadowrocket.png",
                filename: "weatherkit-proxy.srmodule",
                airQualityScaleFilename: "weatherkit-proxy-aqs.srmodule",
                scheme: "shadowrocket://install?module="
            },
            {
                name: "Surge",
                icon: "https://fastly.jsdelivr.net/gh/NSRingo/engineering-solutions@main/packages/doc-ui/src/module-install/icons/surge.png",
                filename: "weatherkit-proxy.sgmodule",
                airQualityScaleFilename: "weatherkit-proxy-aqs.sgmodule",
                scheme: "surge:///install-module?url="
            },
            {
                name: "Loon",
                icon: "https://fastly.jsdelivr.net/gh/NSRingo/engineering-solutions@main/packages/doc-ui/src/module-install/icons/loon.png",
                filename: "weatherkit-proxy.plugin",
                airQualityScaleFilename: "weatherkit-proxy-aqs.plugin",
                scheme: "loon://import?plugin="
            },
            {
                name: "Stash",
                icon: "https://fastly.jsdelivr.net/gh/NSRingo/engineering-solutions@main/packages/doc-ui/src/module-install/icons/stash.png",
                filename: "weatherkit-proxy.stoverride",
                airQualityScaleFilename: "weatherkit-proxy-aqs.stoverride",
                scheme: "stash://install-override?url="
            },
            {
                name: "Egern",
                icon: "https://fastly.jsdelivr.net/gh/NSRingo/engineering-solutions@main/packages/doc-ui/src/module-install/icons/egern.png",
                filename: "weatherkit-proxy.yaml",
                airQualityScaleFilename: "weatherkit-proxy-aqs.yaml",
                scheme: "egern:///modules/new?url="
            },
            {
                name: "Quantumult X",
                icon: "https://fastly.jsdelivr.net/gh/NSRingo/engineering-solutions@main/packages/doc-ui/src/module-install/icons/qx.png",
                filename: "weatherkit-proxy.snippet",
                airQualityScaleFilename: "weatherkit-proxy-aqs.snippet",
                scheme: "quantumult-x:///add-resource?remote-resource=",
                // schemeWrap 指定把下载链接包装进 {"<键>":[downloadUrl]} 后整体 encodeURIComponent，
                // 对应 QX 的 add-resource?remote-resource= 接口（rewrite_remote 远程重写资源）。
                schemeWrap: "rewrite_remote"
            }
        ];

        // 各 DOM 元素
        const caiyunToken = document.getElementById("caiyunToken");
        const qweatherToken = document.getElementById("qweatherToken");
        const qweatherHost = document.getElementById("qweatherHost");
        const weatherProvider = document.getElementById("weatherProvider");
        const nextHourProvider = document.getElementById("nextHourProvider");
        const aqiStandard = document.getElementById("aqiStandard");
        const aqiSource = document.getElementById("aqiSource");
        const forceCalculate = document.getElementById("forceCalculate");
        const forceCNPrimaryPollutants = document.getElementById("forceCNPrimaryPollutants");
        const allowOverRange = document.getElementById("allowOverRange");
        const replaceWhenCurrentChange = document.getElementById("replaceWhenCurrentChange");
        const cardsContainer = document.getElementById("cardsContainer");
        const copyBackupBtn = document.getElementById("copyBackupBtn");

        // 新增的 DOM 元素
        const weatherReplace = document.getElementById("weatherReplace");
        const pollutantsUnitsMode = document.getElementById("pollutantsUnitsMode");
        const indexReplace = document.getElementById("indexReplace");
        const unitsReplace = document.getElementById("unitsReplace");
        const replaceDaily = document.getElementById("replaceDaily");
        const replaceHourly = document.getElementById("replaceHourly");
        const edgeCache = document.getElementById("edgeCache");
        const proxyAirQualityScale = document.getElementById("proxyAirQualityScale");
        
        // 选项卡与控制
        const stepConfig = document.getElementById("stepConfig");
        const stepClients = document.getElementById("stepClients");
        const backToClientsBtn = document.getElementById("backToClientsBtn");
        const presetCaiyunBtn = document.getElementById("presetCaiyunBtn");
        const presetQWeatherBtn = document.getElementById("presetQWeatherBtn");
        const presetAdvancedBtn = document.getElementById("presetAdvancedBtn");
        const caiyunConfigGroup = document.getElementById("caiyunConfigGroup");
        const qweatherConfigGroup = document.getElementById("qweatherConfigGroup");
        const advancedConfigGroup = document.getElementById("advancedConfigGroup");
        const saveConfigBtn = document.getElementById("saveConfigBtn");
        const toggleConfigBtn = document.getElementById("toggleConfigBtn");

        // 各预设的数据状态隔离，防止互相干扰
        let currentPreset = "Caiyun";
        const presetData = {
            Caiyun: {
                caiyunToken: ""
            },
            QWeather: {
                qweatherToken: "",
                qweatherHost: ""
            },
            Advanced: {
                caiyunToken: "",
                qweatherToken: "",
                qweatherHost: "",
                weatherProvider: "ColorfulClouds",
                nextHourProvider: "ColorfulClouds",
                aqiStandard: "CN",
                aqiSource: "Caiyun",
                forceCalculate: false,
                forceCNPrimaryPollutants: false,
                allowOverRange: false,
                replaceWhenCurrentChange: false,
                weatherReplace: "",
                indexReplace: "HJ6332012",
                unitsReplace: "None",
                pollutantsUnitsMode: "Scale",
                replaceDaily: false,
                replaceHourly: false,
                edgeCache: false
            }
        };

        // 从 DOM 同步到当前预设的数据对象
        function syncDOMToPresetData() {
            if (currentPreset === "Caiyun") {
                presetData.Caiyun.caiyunToken = caiyunToken.value.trim();
            } else if (currentPreset === "QWeather") {
                presetData.QWeather.qweatherToken = qweatherToken.value.trim();
                presetData.QWeather.qweatherHost = qweatherHost.value.trim();
            } else if (currentPreset === "Advanced") {
                presetData.Advanced.caiyunToken = caiyunToken.value.trim();
                presetData.Advanced.qweatherToken = qweatherToken.value.trim();
                presetData.Advanced.qweatherHost = qweatherHost.value.trim();
                presetData.Advanced.weatherProvider = weatherProvider.value;
                presetData.Advanced.nextHourProvider = nextHourProvider.value;
                presetData.Advanced.aqiStandard = aqiStandard.value;
                presetData.Advanced.aqiSource = aqiSource.value;
                presetData.Advanced.forceCalculate = forceCalculate.checked;
                presetData.Advanced.weatherReplace = weatherReplace.value.trim();
                presetData.Advanced.indexReplace = indexReplace.value;
                presetData.Advanced.unitsReplace = unitsReplace.value;
                presetData.Advanced.pollutantsUnitsMode = pollutantsUnitsMode.value;
                presetData.Advanced.forceCNPrimaryPollutants = forceCNPrimaryPollutants.checked;
                presetData.Advanced.allowOverRange = allowOverRange.checked;
                presetData.Advanced.replaceWhenCurrentChange = replaceWhenCurrentChange.checked;
                presetData.Advanced.replaceDaily = replaceDaily.checked;
                presetData.Advanced.replaceHourly = replaceHourly.checked;
                presetData.Advanced.edgeCache = edgeCache.checked;
            }
        }

        // 从当前预设的数据对象同步回 DOM
        function syncPresetDataToDOM() {
            presetCaiyunBtn.classList.remove("active");
            presetQWeatherBtn.classList.remove("active");
            presetAdvancedBtn.classList.remove("active");

            if (currentPreset === "Caiyun") {
                presetCaiyunBtn.classList.add("active");
                caiyunConfigGroup.style.display = "block";
                qweatherConfigGroup.style.display = "none";
                advancedConfigGroup.style.display = "none";

                caiyunToken.value = presetData.Caiyun.caiyunToken;
            } else if (currentPreset === "QWeather") {
                presetQWeatherBtn.classList.add("active");
                caiyunConfigGroup.style.display = "none";
                qweatherConfigGroup.style.display = "block";
                advancedConfigGroup.style.display = "none";

                qweatherToken.value = presetData.QWeather.qweatherToken;
                qweatherHost.value = presetData.QWeather.qweatherHost;
            } else if (currentPreset === "Advanced") {
                presetAdvancedBtn.classList.add("active");
                caiyunConfigGroup.style.display = "block";
                qweatherConfigGroup.style.display = "block";
                advancedConfigGroup.style.display = "block";

                caiyunToken.value = presetData.Advanced.caiyunToken;
                qweatherToken.value = presetData.Advanced.qweatherToken;
                qweatherHost.value = presetData.Advanced.qweatherHost;
                weatherProvider.value = presetData.Advanced.weatherProvider;
                nextHourProvider.value = presetData.Advanced.nextHourProvider;
                aqiStandard.value = presetData.Advanced.aqiStandard;
                aqiSource.value = presetData.Advanced.aqiSource;
                forceCalculate.checked = presetData.Advanced.forceCalculate;
                weatherReplace.value = presetData.Advanced.weatherReplace;
                indexReplace.value = presetData.Advanced.indexReplace;
                unitsReplace.value = presetData.Advanced.unitsReplace;
                pollutantsUnitsMode.value = presetData.Advanced.pollutantsUnitsMode;
                forceCNPrimaryPollutants.checked = presetData.Advanced.forceCNPrimaryPollutants;
                allowOverRange.checked = presetData.Advanced.allowOverRange;
                replaceWhenCurrentChange.checked = presetData.Advanced.replaceWhenCurrentChange;
                replaceDaily.checked = presetData.Advanced.replaceDaily;
                replaceHourly.checked = presetData.Advanced.replaceHourly;
                edgeCache.checked = presetData.Advanced.edgeCache;
            }
        }

        // 将 JSON 配置编码为 URL 安全的 base64（base64url）。
        // 标准 base64 含有 "/" 与 "+"，放入 URL 路径会被当作分隔符截断、
        // 放入 query 会被 URLSearchParams 把 "+" 解码成空格，因此改用 base64url。
        function encodeBase64Url(str) {
            return btoa(unescape(encodeURIComponent(str)))
                .replace(/\\+/g, "-")
                .replace(/\\//g, "_")
                .replace(/=+$/, "");
        }

        // 兼容标准 base64 与 base64url 的解码，并补齐可能缺失的 padding。
        // 旧的分享链接与已下发到设备上的配置可能仍是标准 base64，需一并兼容。
        function decodeBase64Url(str) {
            let s = str.replace(/-/g, "+").replace(/_/g, "/");
            while (s.length % 4) s += "=";
            return decodeURIComponent(escape(atob(s)));
        }

        // AQI 标准 → { 本地算法, 彩云现成AQI, 和风现成AQI, 推荐数据源, 推荐替换目标, 推荐单位转换, 是否锁定数据源 }
        // caiyunVendor / qweatherVendor 为 null 表示该数据源无此标准的现成 AQI，需本地计算。
        // lockSource：仅当所选数据源能直接提供该标准的「现成 AQI」时才自动切换数据源
        // （国标/美标 → 彩云）；欧盟/德国/国标草案是本地从污染物浓度计算，彩云与和风都能提供
        // 污染物，故不强制切数据源，保留用户上一次的选择。
        // recIndexReplace / recUnitsReplace：选定标准后「替换目标」「单位转换」自动跟随的取值，
        // 让「选一个标准，全套生效」覆盖到这两个高级项（仍可在折叠区内手动覆盖）。
        const AQI_STANDARDS = {
            CN:   { algorithm: "WAQI_InstantCast_CN",          caiyunVendor: "ColorfulCloudsCN", qweatherVendor: "QWeather", recSource: "Caiyun", recIndexReplace: "HJ6332012",   recUnitsReplace: "HJ6332012",   lockSource: true },
            US:   { algorithm: "WAQI_InstantCast_US",          caiyunVendor: "ColorfulCloudsUS", qweatherVendor: "QWeather", recSource: "Caiyun", recIndexReplace: "EPA_NowCast", recUnitsReplace: "EPA_NowCast", lockSource: true },
            EU:   { algorithm: "EU_EAQI",                      caiyunVendor: null,               qweatherVendor: "QWeather", recSource: "Caiyun", recIndexReplace: "EU.EAQI",     recUnitsReplace: "EU.EAQI",     lockSource: false },
            UBA:  { algorithm: "UBA",                          caiyunVendor: null,               qweatherVendor: null,       recSource: "Caiyun", recIndexReplace: "UBA",         recUnitsReplace: "UBA",         lockSource: false },
            CN25: { algorithm: "WAQI_InstantCast_CN_25_DRAFT", caiyunVendor: null,               qweatherVendor: null,       recSource: "Caiyun", recIndexReplace: "HJ6332012",   recUnitsReplace: "HJ6332012",   lockSource: false },
            None: { algorithm: "None",                        caiyunVendor: null,               qweatherVendor: null,       recSource: "Caiyun", recIndexReplace: "HJ6332012",   recUnitsReplace: "None",        lockSource: false }
        };

        // 算法名 → 标准（反向映射用）
        const ALGORITHM_TO_STANDARD = {
            WAQI_InstantCast_CN: "CN",
            WAQI_InstantCast_US: "US",
            EU_EAQI: "EU",
            UBA: "UBA",
            WAQI_InstantCast_CN_25_DRAFT: "CN25",
            None: "None"
        };

        // 前向：由 (aqiStandard, aqiSource, forceCalculate) 派生旧的 4 个 provider 设置 + algorithm。
        // 生成的 Settings.AirQuality.* 结构与改造前完全一致，下游处理逻辑无需改动。
        function buildAqiSettings(adv) {
            const std = AQI_STANDARDS[adv.aqiStandard] || AQI_STANDARDS.CN;
            const isQWeather = adv.aqiSource === "QWeather";
            const vendor = isQWeather ? std.qweatherVendor : std.caiyunVendor;
            const isNone = std.algorithm === "None";
            // 无现成 AQI 或强制本地计算 → 走内置算法；不转换 → 也走 Calculate(Algorithm=None) 以保持不触碰
            const useCalc = isNone ? true : (adv.forceCalculate || !vendor);
            const indexProvider = useCalc ? "Calculate" : vendor;
            return {
                algorithm: std.algorithm,
                indexProvider,
                // 今天与昨天走同一路径，保证对比口径一致
                yesterdayIndexProvider: indexProvider,
                // 不转换：不注入污染物、不触发替换，完整保留上游原始数据
                pollutantsProvider: isNone ? "WeatherKit" : (isQWeather ? "QWeather" : "ColorfulClouds"),
                yesterdayPollutantsProvider: isQWeather ? "QWeather" : "ColorfulCloudsCN",
                indexReplace: isNone ? [] : (adv.indexReplace ? [adv.indexReplace] : []),
                // 不转换：不做单位换算；其余标准沿用折叠区的「单位转换」值（由标准联动预填）
                unitsReplace: isNone ? "None" : (adv.unitsReplace || "None")
            };
        }

        // 反向：由既有 Settings.AirQuality 推断 (aqiStandard, aqiSource, forceCalculate)，用于回填表单。
        function parseAqiSettings(air) {
            const idxProvider = air?.Current?.Index?.Provider || "ColorfulCloudsCN";
            const algorithm = air?.Calculate?.Algorithm || "WAQI_InstantCast_CN";
            const pollutantsProvider = air?.Current?.Pollutants?.Provider || "ColorfulClouds";
            const source = pollutantsProvider === "QWeather" ? "QWeather" : "Caiyun";
            const forceCalculate = idxProvider === "Calculate";
            let standard;
            if (idxProvider === "Calculate") {
                standard = ALGORITHM_TO_STANDARD[algorithm] || "CN";
            } else if (idxProvider === "ColorfulCloudsCN") {
                standard = "CN";
            } else if (idxProvider === "ColorfulCloudsUS") {
                standard = "US";
            } else if (idxProvider === "QWeather") {
                // 和风的实际标准由其按地区运行时决定、非配置可控；按算法尽力还原，默认国标。
                standard = (ALGORITHM_TO_STANDARD[algorithm] && algorithm !== "WAQI_InstantCast_CN") ? ALGORITHM_TO_STANDARD[algorithm] : "CN";
            } else {
                standard = "CN";
            }
            return { standard, source, forceCalculate };
        }

        // 计算 URL 中的 base64 编码配置
        function getBase64Config() {
            let config = {};
            if (currentPreset === "Caiyun") {
                config = {
                    Proxy: { AirQualityScale: proxyAirQualityScale.checked },
                    EdgeCache: false,
                    Weather: { Provider: "ColorfulClouds" },
                    NextHour: { Provider: "ColorfulClouds" },
                    AirQuality: {
                        Current: {
                            Pollutants: { Provider: "ColorfulClouds" },
                            Index: { Provider: "ColorfulCloudsCN" }
                        },
                        Comparison: {
                            Yesterday: { IndexProvider: "ColorfulCloudsCN" }
                        }
                    },
                    API: {
                        ColorfulClouds: { Token: presetData.Caiyun.caiyunToken || null }
                    }
                };
            } else if (currentPreset === "QWeather") {
                config = {
                    Proxy: { AirQualityScale: proxyAirQualityScale.checked },
                    EdgeCache: false,
                    Weather: { Provider: "QWeather" },
                    NextHour: { Provider: "QWeather" },
                    AirQuality: {
                        Current: {
                            Pollutants: { Provider: "QWeather" },
                            Index: { Provider: "QWeather" }
                        },
                        Comparison: {
                            Yesterday: { IndexProvider: "QWeather" }
                        }
                    },
                    API: {
                        QWeather: { 
                            Token: presetData.QWeather.qweatherToken || null,
                            Host: presetData.QWeather.qweatherHost || null
                        }
                    }
                };
            } else {
                config = {
                    Proxy: { AirQualityScale: proxyAirQualityScale.checked },
                    EdgeCache: presetData.Advanced.edgeCache,
                    Weather: { 
                        Provider: presetData.Advanced.weatherProvider,
                        Replace: presetData.Advanced.weatherReplace ? presetData.Advanced.weatherReplace.split(",").map(s => s.trim()).filter(Boolean) : undefined,
                        ReplaceDaily: presetData.Advanced.replaceDaily,
                        ReplaceHourly: presetData.Advanced.replaceHourly
                    },
                    NextHour: { Provider: presetData.Advanced.nextHourProvider },
                    AirQuality: (() => {
                        const aqi = buildAqiSettings(presetData.Advanced);
                        return {
                            Current: {
                                Pollutants: {
                                    Provider: aqi.pollutantsProvider,
                                    Units: {
                                        Replace: aqi.unitsReplace && aqi.unitsReplace !== "None" ? [aqi.unitsReplace] : [],
                                        Mode: presetData.Advanced.pollutantsUnitsMode
                                    }
                                },
                                Index: {
                                    Provider: aqi.indexProvider,
                                    ForceCNPrimaryPollutants: presetData.Advanced.forceCNPrimaryPollutants,
                                    Replace: aqi.indexReplace
                                }
                            },
                            Comparison: {
                                ReplaceWhenCurrentChange: presetData.Advanced.replaceWhenCurrentChange,
                                Yesterday: {
                                    PollutantsProvider: aqi.yesterdayPollutantsProvider,
                                    IndexProvider: aqi.yesterdayIndexProvider
                                }
                            },
                            Calculate: {
                                Algorithm: aqi.algorithm,
                                AllowOverRange: presetData.Advanced.allowOverRange
                            }
                        };
                    })(),
                    API: {
                        ColorfulClouds: { Token: presetData.Advanced.caiyunToken || null },
                        QWeather: { 
                            Token: presetData.Advanced.qweatherToken || null,
                            Host: presetData.Advanced.qweatherHost || null
                        }
                    }
                };
            }
            
            // 是否有输入任何自定义数据？
            let hasCustomData = false;
            if (currentPreset === "Caiyun") {
                hasCustomData = !!presetData.Caiyun.caiyunToken;
            } else if (currentPreset === "QWeather") {
                hasCustomData = !!presetData.QWeather.qweatherToken || !!presetData.QWeather.qweatherHost;
            } else {
                const std = AQI_STANDARDS[presetData.Advanced.aqiStandard] || AQI_STANDARDS.CN;
                const isDefaultIndexReplace = presetData.Advanced.indexReplace === std.recIndexReplace;
                // 「不转换」与「该标准的推荐单位」都视为默认：前者是历史默认，后者是标准联动后的取值（对默认国标为 no-op）。
                const isDefaultUnitsReplace = !presetData.Advanced.unitsReplace || presetData.Advanced.unitsReplace === "None" || presetData.Advanced.unitsReplace === std.recUnitsReplace;
                hasCustomData = presetData.Advanced.caiyunToken ||
                                presetData.Advanced.qweatherToken ||
                                presetData.Advanced.weatherProvider !== "ColorfulClouds" ||
                                presetData.Advanced.nextHourProvider !== "ColorfulClouds" ||
                                presetData.Advanced.aqiStandard !== "CN" ||
                                presetData.Advanced.aqiSource !== "Caiyun" ||
                                presetData.Advanced.forceCalculate === true ||
                                !!presetData.Advanced.qweatherHost ||
                                presetData.Advanced.forceCNPrimaryPollutants === true ||
                                presetData.Advanced.replaceWhenCurrentChange === true ||
                                presetData.Advanced.allowOverRange === true ||
                                presetData.Advanced.replaceDaily === true ||
                                presetData.Advanced.replaceHourly === true ||
                                presetData.Advanced.edgeCache === true ||
                                (presetData.Advanced.weatherReplace !== "" && presetData.Advanced.weatherReplace !== "CN") ||
                                !isDefaultIndexReplace ||
                                !isDefaultUnitsReplace ||
                                presetData.Advanced.pollutantsUnitsMode !== "Scale";
            }
            hasCustomData = hasCustomData || proxyAirQualityScale.checked;
            
            // 保存/更新本地浏览器存储 (LocalStorage)
            const storageState = {
                currentPreset,
                presetData
            };

            try {
                if (hasCustomData) {
                    localStorage.setItem("weatherkit_config_state", JSON.stringify(storageState));
                    localStorage.setItem("weatherkit_config", JSON.stringify(config));
                } else {
                    localStorage.removeItem("weatherkit_config_state");
                    localStorage.removeItem("weatherkit_config");
                }
            } catch (e) {
                console.warn("LocalStorage access failed:", e);
            }
            
            if (!hasCustomData) {
                return ""; // 无任何自定义参数，返回空
            }
            
            try {
                const jsonStr = JSON.stringify(config);
                return encodeBase64Url(jsonStr);
            } catch (e) {
                console.error("Base64 encode error:", e);
                return "";
            }
        }

        let selectedClientIndex = 0;
        
        // 供 HTML onclick 调用的全局函数
        window.selectClient = function(index) {
            selectedClientIndex = index;
            renderCards();
        }

        // 动态生成并挂载卡片 HTML
        function renderCards() {
            const base64 = getBase64Config();

            const gridHtml = rawItems.map((item, index) => {
                const isActive = index === selectedClientIndex ? "active" : "";
                return '<div class="client-item ' + isActive + '" onclick="selectClient(' + index + ')">' +
                    '<span class="client-item-icon"><img src="' + item.icon + '" alt="' + item.name + '"></span>' +
                '</div>';
            }).join("");

            const item = rawItems[selectedClientIndex];
            const configFilename = proxyAirQualityScale.checked ? item.airQualityScaleFilename : item.filename;
            const downloadUrl = base64 
                ? baseUrl + '/conf/' + base64 + '/' + configFilename
                : baseUrl + '/conf/' + configFilename;
            const importUrl = item.scheme
                ? item.schemeWrap
                    ? item.scheme + encodeURIComponent(JSON.stringify({ [item.schemeWrap]: [downloadUrl] }))
                    : item.scheme + encodeURIComponent(downloadUrl)
                : "";
            const importBtn = importUrl 
                ? '<a href="' + importUrl + '" class="btn btn-primary">一键导入</a>' 
                : '<button class="btn btn-disabled" disabled>手动导入</button>';

            const detailHtml = '<div class="card">' +
                '<div class="card-header" style="margin-bottom: 0.5rem;">' +
                    '<div class="card-title-group">' +
                        '<h3 class="card-title">' + item.name + '</h3>' +
                        '<span class="card-filename">' + item.filename + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="card-actions">' +
                    importBtn +
                    '<button data-url="' + downloadUrl + '" onclick="copyLink(this)" class="btn btn-secondary">' +
                        '<svg class="icon-copy" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
                        '<span>复制链接</span>' +
                    '</button>' +
                    '<a href="' + downloadUrl + '" class="btn btn-outline" download="' + item.filename + '">下载配置</a>' +
                '</div>' +
            '</div>';

            cardsContainer.innerHTML = '<div class="client-grid">' +
                gridHtml +
            '</div>' +
            '<div class="client-detail-pane">' +
                detailHtml +
            '</div>';
        }

        // 复制下载链接
        function copyLink(button) {
            const url = button.getAttribute('data-url');
            navigator.clipboard.writeText(url).then(function() {
                const originalContent = button.innerHTML;
                button.classList.add('btn-success');
                button.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><polyline points="20 6 9 17 4 12"></polyline></svg><span>已复制</span>';
                button.disabled = true;
                
                setTimeout(function() {
                    button.classList.remove('btn-success');
                    button.innerHTML = originalContent;
                    button.disabled = false;
                }, 1500);
            }).catch(function(err) {
                console.error('无法复制链接: ', err);
                showToast('复制失败，请手动选择复制。');
            });
        }

        // 备份配置链接点击
        copyBackupBtn.addEventListener("click", () => {
            const base64 = getBase64Config();
            const shareUrl = base64 
                ? window.location.origin + window.location.pathname + "?config=" + base64
                : window.location.origin + window.location.pathname;
            
            const shareText = "WeatherKit-Proxy 是一个独立开源的 WeatherKit 响应代理与兼容处理项目，可按配置融合国内天气与空气质量数据源。\\n- ⚡ 无客户端本地 JS 重写逻辑，支持一键拉起配置导入。\\n- ⚙️ 支持 Cloudflare Workers / Vercel 独立部署。\\n- 🎨 内置可视化配置中心，支持彩云/和风天气数据源混合搭配。\\n👉 配置页（支持一键导入）：" + shareUrl + "\\n👉 自行部署与项目说明：https://github.com/meme-lau/weatherkit-proxy";

            navigator.clipboard.writeText(shareText).then(() => {
                showToast("推荐文案与配置链接已复制到剪贴板！");
            }).catch((err) => {
                console.error("复制失败: ", err);
                showToast("复制失败，请手动复制 URL");
            });
        });

        // 面板切换函数
        function showPanel(panelId) {
            if (panelId === "config") {
                stepClients.classList.remove("active");
                stepConfig.classList.add("active");
            } else {
                stepConfig.classList.remove("active");
                stepClients.classList.add("active");
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // 进入自定义配置面板
        toggleConfigBtn.addEventListener("click", () => {
            showPanel("config");
        });

        // 返回主导入页面
        backToClientsBtn.addEventListener("click", () => {
            showPanel("clients");
        });



        function switchPreset(preset) {
            if (currentPreset === preset) return;
            // 切换前，把当前表单值保存到当前的 presetData 缓存中
            syncDOMToPresetData();
            // 切换激活状态
            currentPreset = preset;
            // 将目标 preset 缓存的数据同步到 DOM 中，并显示隐藏对应选项组
            syncPresetDataToDOM();
            // 刷新配置卡片
            renderCards();
        }

        if (presetCaiyunBtn) presetCaiyunBtn.addEventListener("click", () => switchPreset("Caiyun"));
        if (presetQWeatherBtn) presetQWeatherBtn.addEventListener("click", () => switchPreset("QWeather"));
        if (presetAdvancedBtn) presetAdvancedBtn.addEventListener("click", () => switchPreset("Advanced"));

        // 保存并应用配置
        saveConfigBtn.addEventListener("click", () => {
            try {
                syncDOMToPresetData();
                renderCards(); // 重新计算并保存配置
                showToast("参数已更新并应用！");
            } catch (e) {
                console.error("Save config error:", e);
                showToast("配置保存失败：" + e.message);
            } finally {
                setTimeout(() => {
                    showPanel("clients");
                }, 600);
            }
        });

        // 「标准联动」：切换 AQI 标准时，替换目标、单位转换一并跟随该标准；
        // 数据源仅当该标准能用现成 AQI（lockSource）时才切换，本地算的标准保留用户当前数据源。
        if (aqiStandard) {
            const followStandard = () => {
                const std = AQI_STANDARDS[aqiStandard.value] || AQI_STANDARDS.CN;
                if (std.lockSource && aqiSource.value !== std.recSource) aqiSource.value = std.recSource;
                if (indexReplace.value !== std.recIndexReplace) indexReplace.value = std.recIndexReplace;
                if (unitsReplace.value !== std.recUnitsReplace) unitsReplace.value = std.recUnitsReplace;
            };
            aqiStandard.addEventListener("change", () => { followStandard(); syncDOMToPresetData(); renderCards(); });
        }

        // 监听所有输入框和下拉框的变化，并及时同步到 presetData
        const inputs = [
            caiyunToken, qweatherToken, qweatherHost, weatherProvider, nextHourProvider,
            aqiStandard, aqiSource, forceCalculate,
            forceCNPrimaryPollutants, allowOverRange, replaceWhenCurrentChange,
            weatherReplace, pollutantsUnitsMode,
            indexReplace, unitsReplace, replaceDaily, replaceHourly, edgeCache, proxyAirQualityScale
        ];
        inputs.forEach(input => {
            if (input) {
                const handler = () => {
                    syncDOMToPresetData();
                    renderCards();
                };
                input.addEventListener("change", handler);
                input.addEventListener("input", handler);
            }
        });

        // 将当前表单的值回填
        function applyConfig(decoded) {
            const cToken = decoded.API?.ColorfulClouds?.Token || "";
            const qToken = decoded.API?.QWeather?.Token || "";
            const qHost = decoded.API?.QWeather?.Host || "";

            // 初始化所有预设下的 API 令牌缓存，保持数据基本一致性，避免切换后变空
            presetData.Caiyun.caiyunToken = cToken;
            presetData.QWeather.qweatherToken = qToken;
            presetData.QWeather.qweatherHost = qHost;

            // 写入 Advanced 配置缓存
            presetData.Advanced.caiyunToken = cToken;
            presetData.Advanced.qweatherToken = qToken;
            presetData.Advanced.qweatherHost = qHost;
            presetData.Advanced.weatherProvider = decoded.Weather?.Provider || "ColorfulClouds";
            presetData.Advanced.nextHourProvider = decoded.NextHour?.Provider || "ColorfulClouds";
            const aqiParsed = parseAqiSettings(decoded.AirQuality);
            presetData.Advanced.aqiStandard = aqiParsed.standard;
            presetData.Advanced.aqiSource = aqiParsed.source;
            presetData.Advanced.forceCalculate = aqiParsed.forceCalculate;

            presetData.Advanced.weatherReplace = decoded.Weather?.Replace ? decoded.Weather.Replace.join(",") : "";
            presetData.Advanced.pollutantsUnitsMode = decoded.AirQuality?.Current?.Pollutants?.Units?.Mode || "Scale";

            presetData.Advanced.forceCNPrimaryPollutants = decoded.AirQuality?.Current?.Index?.ForceCNPrimaryPollutants === true;
            presetData.Advanced.replaceWhenCurrentChange = decoded.AirQuality?.Comparison?.ReplaceWhenCurrentChange === true;
            presetData.Advanced.allowOverRange = decoded.AirQuality?.Calculate?.AllowOverRange === true;
            presetData.Advanced.replaceDaily = decoded.Weather?.ReplaceDaily === true;
            presetData.Advanced.replaceHourly = decoded.Weather?.ReplaceHourly === true;
            presetData.Advanced.edgeCache = decoded.EdgeCache === true;
            proxyAirQualityScale.checked = decoded.Proxy?.AirQualityScale === true;

            const indexReplaceArr = decoded.AirQuality?.Current?.Index?.Replace ?? ["HJ6332012"];
            presetData.Advanced.indexReplace = indexReplaceArr[0] || "HJ6332012";

            const unitsReplaceArr = decoded.AirQuality?.Current?.Pollutants?.Units?.Replace ?? [];
            presetData.Advanced.unitsReplace = unitsReplaceArr[0] || "None";

            // 判断应该属于哪个 Preset
            // 注意：纯彩云/纯和风预设分支下发的配置不含 Yesterday.PollutantsProvider，故此处对其用
            // 「等于预设值 或 缺省」的容错判断（与 isCaiyun 一致），否则预设配置无法往返还原到对应标签。
            const isQWeather = decoded.Weather?.Provider === "QWeather" &&
                               decoded.NextHour?.Provider === "QWeather" &&
                               decoded.AirQuality?.Current?.Index?.Provider === "QWeather" &&
                               decoded.AirQuality?.Comparison?.Yesterday?.IndexProvider === "QWeather" &&
                               decoded.AirQuality?.Current?.Pollutants?.Provider === "QWeather" &&
                               (decoded.AirQuality?.Comparison?.Yesterday?.PollutantsProvider === "QWeather" || !decoded.AirQuality?.Comparison?.Yesterday?.PollutantsProvider);
            
            const isCaiyun = (decoded.Weather?.Provider === "ColorfulClouds" || !decoded.Weather?.Provider) && 
                             (decoded.NextHour?.Provider === "ColorfulClouds" || !decoded.NextHour?.Provider) && 
                             (decoded.AirQuality?.Current?.Index?.Provider === "ColorfulCloudsCN" || !decoded.AirQuality?.Current?.Index?.Provider) && 
                             (decoded.AirQuality?.Comparison?.Yesterday?.IndexProvider === "ColorfulCloudsCN" || !decoded.AirQuality?.Comparison?.Yesterday?.IndexProvider) && 
                             (decoded.AirQuality?.Current?.Pollutants?.Provider === "ColorfulClouds" || !decoded.AirQuality?.Current?.Pollutants?.Provider) && 
                             (decoded.AirQuality?.Comparison?.Yesterday?.PollutantsProvider === "ColorfulCloudsCN" || !decoded.AirQuality?.Comparison?.Yesterday?.PollutantsProvider) &&
                             !qToken && !qHost;
            
            // isDefaultAdvanced 只判断「高级项是否都在默认值」，不判断 aqiStandard/aqiSource/weather 数据源——
            // 后者由 isCaiyun/isQWeather 负责匹配。这样纯彩云/纯和风预设都能被正确识别。
            const isDefaultAdvanced = !presetData.Advanced.weatherReplace &&
                                      !presetData.Advanced.forceCalculate &&
                                      presetData.Advanced.indexReplace === "HJ6332012" &&
                                      (presetData.Advanced.unitsReplace === "None" || presetData.Advanced.unitsReplace === "HJ6332012") &&
                                      presetData.Advanced.pollutantsUnitsMode === "Scale" &&
                                      !presetData.Advanced.forceCNPrimaryPollutants &&
                                      !presetData.Advanced.replaceWhenCurrentChange &&
                                      !presetData.Advanced.allowOverRange &&
                                      !presetData.Advanced.replaceDaily &&
                                      !presetData.Advanced.replaceHourly &&
                                      !presetData.Advanced.edgeCache;

            if (isQWeather && isDefaultAdvanced) {
                currentPreset = "QWeather";
            } else if (isCaiyun && isDefaultAdvanced) {
                currentPreset = "Caiyun";
            } else {
                currentPreset = "Advanced";
            }

            syncPresetDataToDOM();
        }

        // 初始化回填 URL 传参
        function initFromUrl() {
            const params = new URLSearchParams(window.location.search);
            const configStr = params.get("config");
            
            if (configStr) {
                try {
                    const decoded = JSON.parse(decodeBase64Url(configStr));
                    applyConfig(decoded);
                    localStorage.setItem("weatherkit_config", JSON.stringify(decoded));
                    showToast("已载入链接中备份的天气配置");
                } catch (e) {
                    console.error("Failed to parse config from URL:", e);
                }
            } else {
                try {
                    const localData = localStorage.getItem("weatherkit_config");
                    if (localData) {
                        const decoded = JSON.parse(localData);
                        applyConfig(decoded);
                        showToast("已自动加载本地缓存的配置");
                    }
                } catch (e) {
                    console.error("Failed to parse config from localStorage:", e);
                }
            }
            renderCards();
        }

        // 执行初始化
        window.addEventListener("DOMContentLoaded", initFromUrl);
    </script>
</body>
</html>
    `;
    return minify(rawHtml);
}
