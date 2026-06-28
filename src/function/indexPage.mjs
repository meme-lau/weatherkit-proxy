export function renderIndex(host, protocol) {
    const baseUrl = `${protocol}://${host}`;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WeatherKit-Worker 代理配置中心</title>
    <link rel="icon" type="image/png" href="https://developer.apple.com/assets/elements/icons/weatherkit/weatherkit-128x128.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Noto+Sans+SC:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b1120;
            --card-bg: rgba(255, 255, 255, 0.08);
            --card-border: rgba(255, 255, 255, 0.12);
            --card-border-hover: rgba(255, 255, 255, 0.25);
            --text-main: #ffffff;
            --text-muted: rgba(255, 255, 255, 0.7);
            --text-info: #7dd3fc;
            --primary-gradient: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
            --primary-hover: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
            --success-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
            --alert-bg: rgba(255, 255, 255, 0.06);
            --alert-border: rgba(255, 255, 255, 0.1);
            --transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            --glow-color: rgba(56, 189, 248, 0.4);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        @keyframes gradientMove {
            0% { background-position: 0% 0%; }
            50% { background-position: 100% 100%; }
            100% { background-position: 0% 0%; }
        }

        body {
            font-family: 'Outfit', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #0b1120;
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            overflow-x: hidden;
        }

        body::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBARXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAUKADAAQAAAABAAAAUAAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/+IB2ElDQ19QUk9GSUxFAAEBAAAByAAAAAAEMAAAbW50clJHQiBYWVogB+AAAQABAAAAAAAAYWNzcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJZGVzYwAAAPAAAAAkclhZWgAAARQAAAAUZ1hZWgAAASgAAAAUYlhZWgAAATwAAAAUd3RwdAAAAVAAAAAUclRSQwAAAWQAAAAoZ1RSQwAAAWQAAAAoYlRSQwAAAWQAAAAoY3BydAAAAYwAAAA8bWx1YwAAAAAAAAABAAAADGVuVVMAAAAIAAAAHABzAFIARwBCWFlaIAAAAAAAAG+iAAA49QAAA5BYWVogAAAAAAAAYpkAALeFAAAY2lhZWiAAAAAAAAAkoAAAD4QAALbPWFlaIAAAAAAAAPbWAAEAAAAA0y1wYXJhAAAAAAAEAAAAAmZmAADypwAADVkAABPQAAAKWwAAAAAAAAAAbWx1YwAAAAAAAAABAAAADGVuVVMAAAAgAAAAHABHAG8AbwBnAGwAZQAgAEkAbgBjAC4AIAAyADAAMQA2/8AAEQgAUABQAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAgICAgICAwICAwUDAwMFBgUFBQUGCAYGBgYGCAoICAgICAgKCgoKCgoKCgwMDAwMDA4ODg4ODw8PDw8PDw8PD//bAEMBAgICBAQEBwQEBxALCQsQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEP/dAAQABf/aAAwDAQACEQMRAD8A/Lrwt4Q8LXPhvTbm40q3lllhVmZkyWPqa+vf2PfhJ8L/ABb8Yr/SfFHhXT9Vsk0KedYLmBZIxKLmBQ4U/wAQUkZ9Ca+ZPB5X/hFdK5H+oXvX21+xBNDF8cdRaWRUH/CO3HLMB/y9QetfzD4jZtjaeWY+VGrJNRlazaa9D/Q/jbhnKqfCVCtTw9NTapaqMb68t9bX16n0v8fv2cvgHoPwW8Yazovw90Wxv7SxMkM8NmiSRsHQZVhyDivYn/Zf/Zx3HHw00D/BjX29+01+zF8HP7TvP+El8UanFdWWj/ESW2uG1rVIgY4XW/WJDEl0I0G4jBCggdCMV81eK/h7+zJp2jW2raR8PtXv9WufE2pWclxJrevQRJFBd2yxuscd2FJCzkAHqQM9eT/QfDuRTrYKGIhWnZpaKbSWvRJ2PynN8z9nipUnCKs3q1r+Kuf//Z");
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            filter: blur(60px);
            transform: scale(1.15);
            z-index: -2;
        }

        body::after {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(11, 17, 32, 0.65);
            z-index: -1;
        }

        .container {
            width: 100%;
            max-width: 1200px;
            padding: 4rem 1.25rem;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        header {
            text-align: center;
            margin-bottom: 3rem;
            animation: fadeIn 0.8s ease-out;
        }

        .logo {
            width: 80px;
            height: 80px;
            margin-bottom: 1.25rem;
            filter: drop-shadow(0 0 25px rgba(14, 165, 233, 0.35));
            animation: pulse 4s infinite ease-in-out;
        }

        h1 {
            font-size: clamp(1.5rem, 5.8vw, 2.6rem);
            font-weight: 800;
            letter-spacing: -0.04em;
            margin-bottom: 0.75rem;
            line-height: 1.25;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .title-brand {
            background: linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 2px 10px rgba(56, 189, 248, 0.3));
        }

        .title-main {
            background: linear-gradient(135deg, #ffffff 40%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.15));
        }

        /* 居中单栏工作流 */
        .workspace {
            width: 100%;
            max-width: 580px; /* 精美紧凑的单栏宽度 */
            margin-bottom: 2rem;
            animation: fadeIn 1s ease-out 0.1s both;
            position: relative;
        }

        /* 步骤面板控制 */
        .step-panel {
            display: none;
            width: 100%;
        }

        .step-panel.active {
            display: block;
        }

        /* 动画效果 */
        .slide-in-right {
            animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        .slide-in-left {
            animation: slideInLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(24px); }
            to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-24px); }
            to { opacity: 1; transform: translateX(0); }
        }

        /* 磨砂玻璃卡片容器 */
        .glass-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 28px;
            padding: 2.5rem 2rem;
            backdrop-filter: blur(32px);
            -webkit-backdrop-filter: blur(32px);
            box-shadow: 
                0 16px 40px rgba(0, 0, 0, 0.2), 
                0 0 30px rgba(56, 189, 248, 0.03), 
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transition: var(--transition);
        }

        .glass-card:hover {
            border-color: var(--card-border-hover);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3), 0 0 40px var(--glow-color), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 1rem;
        }

        .panel-title {
            font-size: 1.25rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .panel-subtitle {
            font-size: 0.8rem;
            color: var(--text-muted);
            font-weight: 600;
        }

        /* 表单样式 */
        .form-group {
            margin-bottom: 1.25rem;
        }

        .form-label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            color: #cbd5e1;
            margin-bottom: 0.5rem;
        }

        .form-input {
            width: 100%;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px;
            padding: 0.85rem 1.15rem;
            font-family: inherit;
            color: var(--text-main);
            font-size: 0.95rem;
            outline: none;
            transition: var(--transition);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .form-input:focus {
            border-color: #7dd3fc;
            background: rgba(0, 0, 0, 0.35);
            box-shadow: 0 0 0 4px rgba(125, 211, 252, 0.15), inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .form-select {
            width: 100%;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px;
            padding: 0.85rem 1.15rem;
            font-family: inherit;
            color: var(--text-main);
            font-size: 0.95rem;
            outline: none;
            cursor: pointer;
            transition: var(--transition);
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' width='16' height='16' stroke='%2394a3b8' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            padding-right: 2.5rem;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .form-select:focus {
            border-color: #7dd3fc;
            background-color: rgba(0, 0, 0, 0.35);
            box-shadow: 0 0 0 4px rgba(125, 211, 252, 0.15), inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .form-select option {
            background-color: #0f172a;
            color: var(--text-main);
        }

        .form-desc {
            display: block;
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-top: 0.4rem;
            line-height: 1.4;
        }

        /* 隐私警告横幅 */
        .alert-banner {
            background: var(--alert-bg);
            border: 1px solid var(--alert-border);
            border-radius: 16px;
            padding: 1rem;
            font-size: 0.85rem;
            color: #cbd5e1;
            line-height: 1.5;
            margin-bottom: 1.5rem;
            display: flex;
            gap: 0.75rem;
            align-items: flex-start;
        }

        .alert-banner svg {
            color: #38bdf8;
            flex-shrink: 0;
            margin-top: 0.1rem;
        }

        /* 导航与操作按钮 */
        .btn-next {
            margin-top: 1.5rem;
            background: var(--primary-gradient);
            color: white;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2);
            font-weight: 700;
        }

        .btn-next:hover {
            background: var(--primary-hover);
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(99, 102, 241, 0.3);
        }

        .btn-back-nav {
            margin-bottom: 1.25rem;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #cbd5e1;
            font-size: 0.85rem;
            padding: 0.6rem 1rem;
            border-radius: 10px;
            cursor: pointer;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            width: auto;
        }

        .btn-back-nav:hover {
            background: rgba(255, 255, 255, 0.08);
            color: var(--text-main);
            border-color: rgba(255, 255, 255, 0.15);
        }

        .btn-backup {
            margin-top: 1rem;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            color: #cbd5e1;
            font-weight: 600;
            font-size: 0.85rem;
            padding: 0.75rem;
            width: 100%;
            cursor: pointer;
            transition: var(--transition);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .btn-backup:hover {
            background: rgba(255, 255, 255, 0.08);
            color: var(--text-main);
            border-color: rgba(255, 255, 255, 0.15);
        }

        details.advanced-settings {
            margin-top: 1.5rem;
            border-top: 1px dashed rgba(255, 255, 255, 0.08);
            padding-top: 1.25rem;
        }

        details.advanced-settings summary {
            font-size: 0.85rem;
            font-weight: 600;
            color: #38bdf8;
            cursor: pointer;
            outline: none;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        details.advanced-settings[open] summary {
            margin-bottom: 1.25rem;
        }

        /* 复选框样式 */
        .checkbox-group {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            margin-bottom: 1rem;
            cursor: pointer;
        }

        .checkbox-input {
            margin-top: 0.2rem;
            cursor: pointer;
        }

        .checkbox-label {
            font-size: 0.85rem;
            color: #cbd5e1;
            line-height: 1.4;
            cursor: pointer;
        }

        .checkbox-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 0.5rem 0.25rem;
            margin-top: 0.5rem;
            margin-bottom: 1.25rem;
            padding: 0.75rem;
            background: rgba(0, 0, 0, 0.25);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.8rem;
            color: #cbd5e1;
            cursor: pointer;
        }

        .checkbox-item input {
            cursor: pointer;
        }

        /* 列表网格（单栏垂直排列） */
        .cards-list {
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        .client-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 0.75rem;
            width: 100%;
            margin-bottom: 1.25rem;
        }

        .client-item {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 14px;
            padding: 0.8rem 0.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.4rem;
            cursor: pointer;
            transition: var(--transition);
        }

        .client-item:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px);
        }

        .client-item.active {
            background: rgba(255, 255, 255, 0.1);
            border-color: #38bdf8;
            box-shadow: 0 4px 15px rgba(56, 189, 248, 0.15);
        }

        .client-item-icon {
            font-size: 1.8rem;
            width: 2.5rem;
            height: 2.5rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }

        .client-item-name {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-main);
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            box-sizing: border-box;
        }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 20px;
            padding: 1.5rem;
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
            transform: translateY(-2px);
            border-color: var(--card-border-hover);
            box-shadow: 0 12px 32px rgba(14, 165, 233, 0.08);
            background: rgba(255, 255, 255, 0.04);
        }

        .card:hover::before {
            opacity: 1;
        }

        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 0.85rem;
        }

        .card-icon {
            font-size: 1.85rem;
            margin-right: 0.75rem;
            background: rgba(255, 255, 255, 0.04);
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .card-title-group {
            display: flex;
            flex-direction: column;
        }

        .card-title {
            font-size: 1.15rem;
            font-weight: 600;
            color: var(--text-main);
        }

        .card-filename {
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-top: 0.15rem;
            font-family: monospace;
        }

        .card-desc {
            font-size: 0.85rem;
            color: #94a3b8;
            line-height: 1.45;
            margin-bottom: 1.25rem;
            flex-grow: 1;
        }

        .card-actions {
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.7rem 1.25rem;
            border-radius: 10px;
            font-size: 0.85rem;
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
        }

        .btn-primary:hover {
            background: var(--primary-hover);
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.04);
            color: var(--text-main);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
        }

        .btn-outline {
            background: transparent;
            color: #94a3b8;
            border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .btn-outline:hover {
            color: var(--text-main);
            border-color: var(--card-border-hover);
            background: rgba(255, 255, 255, 0.02);
        }

        .icon-copy {
            margin-right: 0.4rem;
        }

        .btn-success {
            background: var(--success-gradient) !important;
            color: white !important;
            border-color: transparent !important;
        }

        footer {
            text-align: center;
            padding: 1.75rem 0;
            width: 100%;
            border-top: 1px solid rgba(255, 255, 255, 0.04);
            color: #475569;
            font-size: 0.8rem;
            animation: fadeIn 1s ease-out 0.3s both;
        }

        footer a {
            color: #64748b;
            text-decoration: none;
            transition: var(--transition);
            margin: 0 0.5rem;
        }

        footer a:hover {
            color: #38bdf8;
        }

        /* 气泡提示 */
        .toast {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid #38bdf8;
            padding: 0.75rem 1.5rem;
            border-radius: 9999px;
            color: var(--text-main);
            font-size: 0.85rem;
            font-weight: 600;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(10px);
            opacity: 0;
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.03); opacity: 0.97; }
        }

        @media (max-width: 768px) {
            body {
                min-height: 100dvh;
            }
            .container {
                padding: 1.5rem 1rem 2rem 1rem;
            }
            header {
                margin-bottom: 1.25rem;
            }
            .glass-card {
                padding: 1.5rem;
            }
            footer {
                padding: 1rem 0;
            }
        }

        @media (max-width: 480px) {
            .logo {
                width: 52px;
                height: 52px;
                margin-bottom: 0.5rem;
            }
            .glass-card {
                border-radius: 20px;
            }
            .panel-title {
                font-size: 1.12rem;
            }
            .card-title {
                font-size: 1.05rem;
            }
            .card-icon {
                font-size: 1.35rem !important;
                width: 40px;
                height: 40px;
            }
            .tabs-container {
                padding: 0.3rem;
                gap: 0.3rem;
                margin: 0 auto 1.25rem auto;
                border-radius: 12px;
            }
            .tab-btn {
                font-size: 0.8rem;
                padding: 0.65rem 0.5rem;
                border-radius: 9px;
                gap: 0.25rem;
            }
            footer {
                padding: 0.75rem 0;
                font-size: 0.72rem;
            }
            footer a {
                margin: 0 0.25rem;
            }
            .client-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 0.35rem;
                width: 100%;
                margin-bottom: 1.25rem;
            }
            .client-item {
                padding: 0.5rem 0.2rem;
                border-radius: 10px;
                gap: 0.2rem;
            }
            .client-item-icon {
                transform: scale(0.8);
                margin: -0.2rem 0;
            }
            .client-item-name {
                font-size: 0.62rem;
            }
        }

        /* 选项卡容器 */
        .tabs-container {
            display: flex;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 16px;
            padding: 0.4rem;
            margin: 0 auto 2rem auto;
            gap: 0.4rem;
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.2);
            max-width: 420px;
            width: 100%;
            box-sizing: border-box;
        }

        .tab-btn {
            flex: 1 1 0%;
            width: 0;
            padding: 0.85rem 1rem;
            border-radius: 12px;
            border: none;
            margin: 0;
            outline: none;
            background: transparent;
            color: var(--text-muted);
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.375rem;
            line-height: 1;
        }

        .tab-btn svg {
            flex-shrink: 0;
        }

        .tab-btn:hover {
            color: var(--text-main);
            background: rgba(255, 255, 255, 0.05);
        }

        .tab-btn.active {
            background: var(--primary-gradient);
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <img class="logo" src="https://developer.apple.com/assets/elements/icons/weatherkit/weatherkit-128x128.png" alt="WeatherKit Logo">
            <h1>
                <span class="title-brand">meme's WeatherKit-Worker</span>
                <span class="title-main">配置中心</span>
            </h1>
        </header>

        <div class="workspace">
            <!-- 选项卡导航 -->
            <div class="tabs-container">
                <button class="tab-btn active" id="tabQuickImportBtn">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-8h-9l1-8z"></path></svg>
                    快速导入
                </button>
                <button class="tab-btn" id="tabCustomConfigBtn">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.5 1z"></path></svg>
                    自定义配置
                </button>
            </div>

            <!-- 自定义配置面板 -->
            <section class="step-panel" id="stepConfig">
                <div class="glass-card">
                    <div class="panel-header">
                        <h2 class="panel-title">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.5 1z"></path></svg>
                            服务参数配置
                        </h2>
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
                            <label class="form-label" for="indexProvider">[今日空气指数] 数据源</label>
                            <select class="form-select" id="indexProvider">
                                <option value="ColorfulCloudsCN" selected>彩云天气（国标，12年2月版）</option>
                                <option value="Calculate">iRingo内置算法</option>
                                <option value="ColorfulCloudsUS">彩云天气（美标，18年9月版）</option>
                                <option value="QWeather">和风天气（国标，12年2月版）</option>
                            </select>
                            <span class="form-desc">使用选定的数据源填补和替换空气质量指数。</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="yesterdayProvider">[昨日空气指数] 数据源</label>
                            <select class="form-select" id="yesterdayProvider">
                                <option value="ColorfulCloudsCN" selected>彩云天气（国标，12年2月版）</option>
                                <option value="Calculate">iRingo内置算法</option>
                                <option value="ColorfulCloudsUS">彩云天气（美标，18年9月版）</option>
                                <option value="QWeather">和风天气（国标，12年2月版）</option>
                            </select>
                            <span class="form-desc">用来和今日空气质量指数对比的数据。</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="pollutantsProvider">[今日污染物] 数据源</label>
                            <select class="form-select" id="pollutantsProvider">
                                <option value="ColorfulClouds" selected>彩云天气</option>
                                <option value="QWeather">和风天气</option>
                            </select>
                            <span class="form-desc">使用选定的数据源填补污染物数据。</span>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="calculateAlgorithm">[iRingo内置算法] 算法</label>
                            <select class="form-select" id="calculateAlgorithm">
                                <option value="WAQI_InstantCast_CN" selected>国标InstantCast (HJ 633—2012)</option>
                                <option value="WAQI_InstantCast_CN_25_DRAFT">国标InstantCast (HJ 633 2025年草案)</option>
                                <option value="WAQI_InstantCast_US">美标InstantCast (EPA-454/B-24-002)</option>
                                <option value="EU_EAQI">欧盟EAQI (ETC HE Report 2024/17)</option>
                                <option value="UBA">德国LQI (FB001846)</option>
                                <option value="None">不转换</option>
                            </select>
                            <span class="form-desc">当今日/昨日空气指数数据源选择为“内置算法”时，用于污染物数据的本地计算公式。</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="yesterdayPollutantsProvider">[昨日污染物] 数据源</label>
                            <select class="form-select" id="yesterdayPollutantsProvider">
                                <option value="ColorfulCloudsCN" selected>彩云天气</option>
                                <option value="QWeather">和风天气</option>
                            </select>
                            <span class="form-desc">为内置算法提供污染物数据，计算出昨日的空气质量指数。</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="weatherReplace">[天气] 替换范围</label>
                            <input class="form-input" type="text" id="weatherReplace" placeholder="CN">
                            <span class="form-desc">使用逗号分隔的国家码。只有当请求天气位于此列表时，才会替换天气数据。留空默认为 CN。</span>
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
                            <span class="form-desc">替换指定标准的空气质量指数。</span>
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

                    <button class="btn btn-primary btn-next" id="saveConfigBtn">保存并应用配置</button>
                </div>
            </section>

            <!-- 快速导入面板 -->
            <section class="step-panel active" id="stepClients">

                <!-- 卡片列表容器 -->
                <main class="cards-list" id="cardsContainer">
                    <!-- 由 JavaScript 动态渲染卡片 -->
                </main>

                <!-- 一键备份 -->
                <button class="btn-backup" id="copyBackupBtn">
                    <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    <span>备份/分享此配置页链接</span>
                </button>
            </section>
        </div>

        <footer>
            <p>
                © 2026 WeatherKit-Worker | MemeStudio 出品
                •
                <a href="https://github.com/meme-lau/weatherkit-worker" target="_blank" rel="noopener noreferrer">GitHub 仓库</a>
                •
                基于 <a href="https://nsringo.github.io/guide/Weather/weather-kit" target="_blank" rel="noopener noreferrer">iRingo</a> 优化重构
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
        const rawItems = [
            {
                name: "Shadowrocket",
                icon: "🚀",
                iconSize: "1.2rem",
                filename: "config.srmodule",
                desc: "适用于 小火箭 的模块配置。基于模块重写，解锁全部天气面板，实现本地第三方数据融合。",
                scheme: "shadowrocket://install?module="
            },
            {
                name: "Surge",
                icon: "⚡",
                iconSize: "2.4rem",
                filename: "config.sgmodule",
                desc: "适用于 Surge 的模块配置。解锁完整天气功能、替换空气质量数据、添加下一小时降水预测。",
                scheme: "surge:///install-module?url="
            },
            {
                name: "Loon",
                icon: "🎈",
                iconSize: "1.85rem",
                filename: "config.plugin",
                desc: "适用于 Loon 的插件配置。集成 Apple WeatherKit 数据增强，支持下一小时降雨和空气质量优化。",
                scheme: "loon://import?plugin="
            },
            {
                name: "Stash",
                icon: "💎",
                iconSize: "1.8rem",
                filename: "config.stoverride",
                desc: "适用于 Stash 的覆写配置。拦截苹果天气 API 请求并并发预取 and 融合第三方数据源。",
                scheme: "stash://install-override?url="
            },
            {
                name: "Egern",
                icon: "⚙️",
                iconSize: "1.75rem",
                filename: "config.yaml",
                desc: "适用于 Egern 的 YAML 规则配置。采用标准规则拦截及动态重定向，可下载、复制或直接一键导入。",
                scheme: "egern:///modules/new?url="
            }
        ];

        // 各 DOM 元素
        const caiyunToken = document.getElementById("caiyunToken");
        const qweatherToken = document.getElementById("qweatherToken");
        const qweatherHost = document.getElementById("qweatherHost");
        const weatherProvider = document.getElementById("weatherProvider");
        const nextHourProvider = document.getElementById("nextHourProvider");
        const pollutantsProvider = document.getElementById("pollutantsProvider");
        const indexProvider = document.getElementById("indexProvider");
        const yesterdayProvider = document.getElementById("yesterdayProvider");
        const calculateAlgorithm = document.getElementById("calculateAlgorithm");
        const forceCNPrimaryPollutants = document.getElementById("forceCNPrimaryPollutants");
        const allowOverRange = document.getElementById("allowOverRange");
        const replaceWhenCurrentChange = document.getElementById("replaceWhenCurrentChange");
        const cardsContainer = document.getElementById("cardsContainer");
        const copyBackupBtn = document.getElementById("copyBackupBtn");

        // 新增的 DOM 元素
        const weatherReplace = document.getElementById("weatherReplace");
        const yesterdayPollutantsProvider = document.getElementById("yesterdayPollutantsProvider");
        const pollutantsUnitsMode = document.getElementById("pollutantsUnitsMode");
        const indexReplace = document.getElementById("indexReplace");
        const unitsReplace = document.getElementById("unitsReplace");
        const replaceDaily = document.getElementById("replaceDaily");
        const replaceHourly = document.getElementById("replaceHourly");
        const edgeCache = document.getElementById("edgeCache");
        
        // 选项卡与控制
        const stepConfig = document.getElementById("stepConfig");
        const presetCaiyunBtn = document.getElementById("presetCaiyunBtn");
        const presetQWeatherBtn = document.getElementById("presetQWeatherBtn");
        const presetAdvancedBtn = document.getElementById("presetAdvancedBtn");
        const caiyunConfigGroup = document.getElementById("caiyunConfigGroup");
        const qweatherConfigGroup = document.getElementById("qweatherConfigGroup");
        const advancedConfigGroup = document.getElementById("advancedConfigGroup");
        const stepClients = document.getElementById("stepClients");
        const tabQuickImportBtn = document.getElementById("tabQuickImportBtn");
        const tabCustomConfigBtn = document.getElementById("tabCustomConfigBtn");
        const saveConfigBtn = document.getElementById("saveConfigBtn");

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
                indexProvider: "ColorfulCloudsCN",
                yesterdayProvider: "ColorfulCloudsCN",
                pollutantsProvider: "ColorfulClouds",
                calculateAlgorithm: "WAQI_InstantCast_CN",
                yesterdayPollutantsProvider: "ColorfulCloudsCN",
                weatherReplace: "",
                indexReplace: "HJ6332012",
                unitsReplace: "None",
                pollutantsUnitsMode: "Scale",
                forceCNPrimaryPollutants: false,
                allowOverRange: false,
                replaceWhenCurrentChange: false,
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
                presetData.Advanced.indexProvider = indexProvider.value;
                presetData.Advanced.yesterdayProvider = yesterdayProvider.value;
                presetData.Advanced.pollutantsProvider = pollutantsProvider.value;
                presetData.Advanced.calculateAlgorithm = calculateAlgorithm.value;
                presetData.Advanced.yesterdayPollutantsProvider = yesterdayPollutantsProvider.value;
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
                indexProvider.value = presetData.Advanced.indexProvider;
                yesterdayProvider.value = presetData.Advanced.yesterdayProvider;
                pollutantsProvider.value = presetData.Advanced.pollutantsProvider;
                calculateAlgorithm.value = presetData.Advanced.calculateAlgorithm;
                yesterdayPollutantsProvider.value = presetData.Advanced.yesterdayPollutantsProvider;
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

        // 计算当前表单参数 of Base64 编码
        function getBase64Config() {
            let config = {};
            if (currentPreset === "Caiyun") {
                config = {
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
                    EdgeCache: presetData.Advanced.edgeCache,
                    Weather: { 
                        Provider: presetData.Advanced.weatherProvider,
                        Replace: presetData.Advanced.weatherReplace ? presetData.Advanced.weatherReplace.split(",").map(s => s.trim()).filter(Boolean) : undefined,
                        ReplaceDaily: presetData.Advanced.replaceDaily,
                        ReplaceHourly: presetData.Advanced.replaceHourly
                    },
                    NextHour: { Provider: presetData.Advanced.nextHourProvider },
                    AirQuality: {
                        Current: {
                            Pollutants: { 
                                Provider: presetData.Advanced.pollutantsProvider,
                                Units: {
                                    Replace: presetData.Advanced.unitsReplace && presetData.Advanced.unitsReplace !== "None" ? [presetData.Advanced.unitsReplace] : [],
                                    Mode: presetData.Advanced.pollutantsUnitsMode
                                }
                            },
                            Index: { 
                                Provider: presetData.Advanced.indexProvider,
                                ForceCNPrimaryPollutants: presetData.Advanced.forceCNPrimaryPollutants,
                                Replace: presetData.Advanced.indexReplace ? [presetData.Advanced.indexReplace] : []
                            }
                        },
                        Comparison: {
                            ReplaceWhenCurrentChange: presetData.Advanced.replaceWhenCurrentChange,
                            Yesterday: {
                                PollutantsProvider: presetData.Advanced.yesterdayPollutantsProvider,
                                IndexProvider: presetData.Advanced.yesterdayProvider
                            }
                        },
                        Calculate: {
                            Algorithm: presetData.Advanced.calculateAlgorithm,
                            AllowOverRange: presetData.Advanced.allowOverRange
                        }
                    },
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
                const isDefaultIndexReplace = presetData.Advanced.indexReplace === "HJ6332012";
                const isDefaultUnitsReplace = !presetData.Advanced.unitsReplace || presetData.Advanced.unitsReplace === "None";
                hasCustomData = presetData.Advanced.caiyunToken || 
                                presetData.Advanced.qweatherToken || 
                                presetData.Advanced.weatherProvider !== "ColorfulClouds" || 
                                presetData.Advanced.nextHourProvider !== "ColorfulClouds" ||
                                presetData.Advanced.pollutantsProvider !== "ColorfulClouds" ||
                                presetData.Advanced.indexProvider !== "ColorfulCloudsCN" ||
                                presetData.Advanced.yesterdayProvider !== "ColorfulCloudsCN" ||
                                !!presetData.Advanced.qweatherHost ||
                                presetData.Advanced.forceCNPrimaryPollutants === true ||
                                presetData.Advanced.replaceWhenCurrentChange === true ||
                                presetData.Advanced.allowOverRange === true ||
                                presetData.Advanced.replaceDaily === true ||
                                presetData.Advanced.replaceHourly === true ||
                                presetData.Advanced.edgeCache === true ||
                                presetData.Advanced.calculateAlgorithm !== "WAQI_InstantCast_CN" ||
                                (presetData.Advanced.weatherReplace !== "" && presetData.Advanced.weatherReplace !== "CN") ||
                                !isDefaultIndexReplace ||
                                !isDefaultUnitsReplace ||
                                presetData.Advanced.pollutantsUnitsMode !== "Scale" ||
                                presetData.Advanced.yesterdayPollutantsProvider !== "ColorfulCloudsCN";
            }
            
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
                return btoa(unescape(encodeURIComponent(jsonStr)));
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
            const configQuery = base64 ? "?config=" + base64 : "";

            const gridHtml = rawItems.map((item, index) => {
                const isActive = index === selectedClientIndex ? "active" : "";
                return '<div class="client-item ' + isActive + '" onclick="selectClient(' + index + ')">' +
                    '<span class="client-item-icon" style="font-size: ' + (item.iconSize || '1.8rem') + ';">' + item.icon + '</span>' +
                    '<span class="client-item-name">' + item.name + '</span>' +
                '</div>';
            }).join("");

            const item = rawItems[selectedClientIndex];
            const downloadUrl = baseUrl + '/conf/' + item.filename + configQuery;
            const importUrl = item.scheme ? item.scheme + encodeURIComponent(downloadUrl) : "";
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
                '<p class="card-desc">' + item.desc + '</p>' +
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
            if (!base64) {
                showToast("当前未做任何修改，无需备份。");
                return;
            }
            const backupUrl = window.location.origin + window.location.pathname + "?config=" + base64;
            navigator.clipboard.writeText(backupUrl).then(() => {
                showToast("配置备份页链接已复制到剪贴板！");
            }).catch(() => {
                showToast("复制失败，请手动复制 URL");
            });
        });

        // Tab 切换逻辑
        function switchTab(target) {
            if (target === "quick") {
                tabQuickImportBtn.classList.add("active");
                tabCustomConfigBtn.classList.remove("active");
                stepClients.classList.add("active");
                stepClients.className = "step-panel active slide-in-left";
                stepConfig.classList.remove("active");
            } else {
                tabQuickImportBtn.classList.remove("active");
                tabCustomConfigBtn.classList.add("active");
                stepConfig.classList.add("active");
                stepConfig.className = "step-panel active slide-in-right";
                stepClients.classList.remove("active");
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        tabQuickImportBtn.addEventListener("click", () => switchTab("quick"));
        tabCustomConfigBtn.addEventListener("click", () => switchTab("custom"));

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
                    switchTab("quick");
                }, 600);
            }
        });

        // 监听所有输入框和下拉框的变化，并及时同步到 presetData
        const inputs = [
            caiyunToken, qweatherToken, qweatherHost, weatherProvider, nextHourProvider, 
            pollutantsProvider, indexProvider, yesterdayProvider, calculateAlgorithm, 
            forceCNPrimaryPollutants, allowOverRange, replaceWhenCurrentChange,
            weatherReplace, yesterdayPollutantsProvider, pollutantsUnitsMode,
            indexReplace, unitsReplace, replaceDaily, replaceHourly, edgeCache
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
            presetData.Advanced.pollutantsProvider = decoded.AirQuality?.Current?.Pollutants?.Provider || "ColorfulClouds";
            presetData.Advanced.indexProvider = decoded.AirQuality?.Current?.Index?.Provider || "ColorfulCloudsCN";
            presetData.Advanced.yesterdayProvider = decoded.AirQuality?.Comparison?.Yesterday?.IndexProvider || "ColorfulCloudsCN";

            presetData.Advanced.weatherReplace = decoded.Weather?.Replace ? decoded.Weather.Replace.join(",") : "";
            presetData.Advanced.yesterdayPollutantsProvider = decoded.AirQuality?.Comparison?.Yesterday?.PollutantsProvider || "ColorfulCloudsCN";
            presetData.Advanced.pollutantsUnitsMode = decoded.AirQuality?.Current?.Pollutants?.Units?.Mode || "Scale";

            presetData.Advanced.forceCNPrimaryPollutants = decoded.AirQuality?.Current?.Index?.ForceCNPrimaryPollutants === true;
            presetData.Advanced.replaceWhenCurrentChange = decoded.AirQuality?.Comparison?.ReplaceWhenCurrentChange === true;
            presetData.Advanced.allowOverRange = decoded.AirQuality?.Calculate?.AllowOverRange === true;
            presetData.Advanced.calculateAlgorithm = decoded.AirQuality?.Calculate?.Algorithm || "WAQI_InstantCast_CN";
            presetData.Advanced.replaceDaily = decoded.Weather?.ReplaceDaily === true;
            presetData.Advanced.replaceHourly = decoded.Weather?.ReplaceHourly === true;
            presetData.Advanced.edgeCache = decoded.EdgeCache === true;

            const indexReplaceArr = decoded.AirQuality?.Current?.Index?.Replace ?? ["HJ6332012"];
            presetData.Advanced.indexReplace = indexReplaceArr[0] || "HJ6332012";

            const unitsReplaceArr = decoded.AirQuality?.Current?.Pollutants?.Units?.Replace ?? [];
            presetData.Advanced.unitsReplace = unitsReplaceArr[0] || "None";

            // 判断应该属于哪个 Preset
            const isQWeather = decoded.Weather?.Provider === "QWeather" && 
                               decoded.NextHour?.Provider === "QWeather" && 
                               decoded.AirQuality?.Current?.Index?.Provider === "QWeather" && 
                               decoded.AirQuality?.Comparison?.Yesterday?.IndexProvider === "QWeather" && 
                               decoded.AirQuality?.Current?.Pollutants?.Provider === "QWeather" && 
                               decoded.AirQuality?.Comparison?.Yesterday?.PollutantsProvider === "QWeather";
            
            const isCaiyun = (decoded.Weather?.Provider === "ColorfulClouds" || !decoded.Weather?.Provider) && 
                             (decoded.NextHour?.Provider === "ColorfulClouds" || !decoded.NextHour?.Provider) && 
                             (decoded.AirQuality?.Current?.Index?.Provider === "ColorfulCloudsCN" || !decoded.AirQuality?.Current?.Index?.Provider) && 
                             (decoded.AirQuality?.Comparison?.Yesterday?.IndexProvider === "ColorfulCloudsCN" || !decoded.AirQuality?.Comparison?.Yesterday?.IndexProvider) && 
                             (decoded.AirQuality?.Current?.Pollutants?.Provider === "ColorfulClouds" || !decoded.AirQuality?.Current?.Pollutants?.Provider) && 
                             (decoded.AirQuality?.Comparison?.Yesterday?.PollutantsProvider === "ColorfulCloudsCN" || !decoded.AirQuality?.Comparison?.Yesterday?.PollutantsProvider) &&
                             !qToken && !qHost;
            
            const isDefaultAdvanced = !presetData.Advanced.weatherReplace &&
                                      presetData.Advanced.indexReplace === "HJ6332012" &&
                                      presetData.Advanced.unitsReplace === "None" &&
                                      presetData.Advanced.pollutantsUnitsMode === "Scale" &&
                                      !presetData.Advanced.forceCNPrimaryPollutants &&
                                      !presetData.Advanced.replaceWhenCurrentChange &&
                                      !presetData.Advanced.allowOverRange &&
                                      !presetData.Advanced.replaceDaily &&
                                      !presetData.Advanced.replaceHourly &&
                                      !presetData.Advanced.edgeCache &&
                                      presetData.Advanced.calculateAlgorithm === "WAQI_InstantCast_CN";

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
                    const decoded = JSON.parse(decodeURIComponent(escape(atob(configStr))));
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
}
