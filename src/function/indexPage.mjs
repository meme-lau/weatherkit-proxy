export function renderIndex(host, protocol) {
    const baseUrl = `${protocol}://${host}`;

    const items = [
        {
            name: "Surge",
            icon: "⚡",
            filename: "config.sgmodule",
            desc: "适用于 Surge 的模块配置。解锁完整天气功能、替换空气质量数据、添加下一小时降水预测。",
            importUrl: `surge:///install-module?url=${encodeURIComponent(baseUrl + "/conf/config.sgmodule")}`,
        },
        {
            name: "Loon",
            icon: "🎈",
            filename: "config.plugin",
            desc: "适用于 Loon 的插件配置。集成 Apple WeatherKit 数据增强，支持下一小时降雨和空气质量优化。",
            importUrl: `loon:///import?plugin=${encodeURIComponent(baseUrl + "/conf/config.plugin")}`,
        },
        {
            name: "Shadowrocket",
            icon: "🚀",
            filename: "config.srmodule",
            desc: "适用于小火箭的模块配置。基于模块重写，解锁全部天气面板，实现本地第三方数据融合。",
            importUrl: `shadowrocket:///add/module?url=${encodeURIComponent(baseUrl + "/conf/config.srmodule")}`,
        },
        {
            name: "Stash",
            icon: "💎",
            filename: "config.stoverride",
            desc: "适用于 Stash 的覆写配置。拦截苹果天气 API 请求并并发预取和融合第三方数据源。",
            importUrl: `stash:///install-override?url=${encodeURIComponent(baseUrl + "/conf/config.stoverride")}`,
        },
        {
            name: "Egern",
            icon: "⚙️",
            filename: "config.yaml",
            desc: "适用于 Egern 的 YAML 规则配置。采用标准规则拦截及动态重定向，可下载或复制链接导入。",
            importUrl: null, // Egern 没有成熟的一键导入协议，仅支持下载和复制
        }
    ];

    const cardsHtml = items.map(item => {
        const downloadUrl = `${baseUrl}/conf/${item.filename}`;
        const importBtn = item.importUrl 
            ? `<a href="${item.importUrl}" class="btn btn-primary">一键导入</a>` 
            : `<button class="btn btn-disabled" disabled>手动导入</button>`;

        return `
        <div class="card">
            <div class="card-header">
                <span class="card-icon">${item.icon}</span>
                <div class="card-title-group">
                    <h3 class="card-title">${item.name}</h3>
                    <span class="card-filename">${item.filename}</span>
                </div>
            </div>
            <p class="card-desc">${item.desc}</p>
            <div class="card-actions">
                ${importBtn}
                <button onclick="copyLink('${downloadUrl}', this)" class="btn btn-secondary">
                    <svg class="icon-copy" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    <span>复制链接</span>
                </button>
                <a href="${downloadUrl}" class="btn btn-outline" download="${item.filename}">下载配置</a>
            </div>
        </div>
        `;
    }).join("");

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WeatherKit-Worker 代理配置中心</title>
    <link rel="icon" type="image/png" href="https://developer.apple.com/assets/elements/icons/weatherkit/weatherkit-128x128.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0c10;
            --card-bg: rgba(255, 255, 255, 0.03);
            --card-border: rgba(255, 255, 255, 0.08);
            --card-border-hover: rgba(255, 255, 255, 0.2);
            --text-main: #f7fafc;
            --text-muted: #94a3b8;
            --primary-gradient: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            --primary-hover: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            --success-color: #10b981;
            --success-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 0% 100%, rgba(139, 92, 246, 0.05) 0%, transparent 40%);
            background-attachment: fixed;
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            overflow-x: hidden;
        }

        .container {
            width: 100%;
            max-width: 1200px;
            padding: 4rem 2rem;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        header {
            text-align: center;
            margin-bottom: 4rem;
            animation: fadeIn 0.8s ease-out;
        }

        .logo {
            width: 80px;
            height: 80px;
            margin-bottom: 1.5rem;
            filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.3));
            animation: pulse 3s infinite ease-in-out;
        }

        h1 {
            font-size: 2.5rem;
            font-weight: 800;
            letter-spacing: -0.025em;
            background: linear-gradient(135deg, #60a5fa 0%, #c084fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.75rem;
        }

        .subtitle {
            font-size: 1.1rem;
            color: var(--text-muted);
            max-width: 600px;
            margin: 0 auto 1.5rem auto;
            line-height: 1.6;
        }

        .badge-host {
            display: inline-flex;
            align-items: center;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-size: 0.9rem;
            font-weight: 600;
            color: #60a5fa;
            backdrop-filter: blur(8px);
        }

        .badge-host svg {
            margin-right: 0.5rem;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 2rem;
            width: 100%;
            margin-bottom: 4rem;
            animation: fadeIn 1s ease-out 0.2s both;
        }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 20px;
            padding: 2rem;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            transition: var(--transition);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
        }

        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: var(--primary-gradient);
            opacity: 0;
            transition: var(--transition);
        }

        .card:hover {
            transform: translateY(-5px);
            border-color: var(--card-border-hover);
            box-shadow: 0 12px 40px rgba(59, 130, 246, 0.08);
            background: rgba(255, 255, 255, 0.05);
        }

        .card:hover::before {
            opacity: 1;
        }

        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 1.25rem;
        }

        .card-icon {
            font-size: 2.2rem;
            margin-right: 1rem;
            background: rgba(255, 255, 255, 0.05);
            width: 56px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .card-title-group {
            display: flex;
            flex-direction: column;
        }

        .card-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--text-main);
        }

        .card-filename {
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-top: 0.2rem;
            font-family: monospace;
        }

        .card-desc {
            font-size: 0.95rem;
            color: var(--text-muted);
            line-height: 1.6;
            margin-bottom: 2rem;
            flex-grow: 1;
        }

        .card-actions {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.8rem 1.5rem;
            border-radius: 12px;
            font-size: 0.95rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: var(--transition);
            border: none;
            outline: none;
            width: 100%;
        }

        .btn-primary {
            background: var(--primary-gradient);
            color: white;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
        }

        .btn-primary:hover {
            background: var(--primary-hover);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-main);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-outline {
            background: transparent;
            color: var(--text-muted);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .btn-outline:hover {
            color: var(--text-main);
            border-color: var(--card-border-hover);
            background: rgba(255, 255, 255, 0.02);
        }

        .btn-disabled {
            background: rgba(255, 255, 255, 0.02);
            color: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.03);
            cursor: not-allowed;
        }

        .icon-copy {
            margin-right: 0.5rem;
            transition: var(--transition);
        }

        .btn-success {
            background: var(--success-gradient) !important;
            color: white !important;
            border-color: transparent !important;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
        }

        footer {
            text-align: center;
            padding: 2rem 0;
            width: 100%;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.3);
            font-size: 0.85rem;
            animation: fadeIn 1s ease-out 0.4s both;
        }

        footer a {
            color: rgba(255, 255, 255, 0.5);
            text-decoration: none;
            transition: var(--transition);
            margin: 0 0.5rem;
        }

        footer a:hover {
            color: #60a5fa;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.95; }
        }

        @media (max-width: 768px) {
            .container {
                padding: 2rem 1rem;
            }
            h1 {
                font-size: 2rem;
            }
            .grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <img class="logo" src="https://developer.apple.com/assets/elements/icons/weatherkit/weatherkit-128x128.png" alt="WeatherKit Logo">
            <h1>WeatherKit-Worker 配置中心</h1>
            <p class="subtitle">本项目是对 NSRingo/WeatherKit 的自托管优化重构版本。服务已成功部署并运行，请在下方选择您的客户端进行一键导入或下载配置。</p>
            <div class="badge-host">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                <span>${host}</span>
            </div>
        </header>

        <main class="grid">
            ${cardsHtml}
        </main>

        <footer>
            <p>
                © 2026 WeatherKit-Worker
                <a href="https://github.com/meme-lau/WeatherKit" target="_blank" rel="noopener noreferrer">GitHub 仓库</a>
                •
                基于 <a href="https://github.com/VirgilClyne" target="_blank" rel="noopener noreferrer">iRingo</a> 优化重构
            </p>
        </footer>
    </div>

    <script>
        function copyLink(url, button) {
            navigator.clipboard.writeText(url).then(function() {
                const originalContent = button.innerHTML;
                button.classList.add('btn-success');
                button.innerHTML = \`
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>已复制</span>
                \`;
                button.disabled = true;
                
                setTimeout(function() {
                    button.classList.remove('btn-success');
                    button.innerHTML = originalContent;
                    button.disabled = false;
                }, 1500);
            }).catch(function(err) {
                console.error('无法复制链接: ', err);
                alert('复制失败，请手动选择复制。');
            });
        }
    </script>
</body>
</html>
    `;
}
