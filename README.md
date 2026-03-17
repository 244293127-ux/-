# 青藤之恋 - 脱单演习室

基于 React (Vite) + Tailwind CSS 的移动端 AI 社交 Demo，对接扣子 (Coze) API。

## 运行

```bash
npm install
npm run dev
```

在浏览器打开控制台显示的本地地址（如 `http://localhost:5173`），建议用开发者工具切换为手机视图体验。

开发环境下，请求会通过 Vite 代理转发到 `api.coze.cn`，避免浏览器 CORS 限制。若修改过 `vite.config.js`，需重启 `npm run dev`。

## 配置扣子 API

### ✅ 上线（安全版，推荐）

本项目已内置 Vercel Serverless 代理：前端只请求同域 `/api/coze/...`，由服务端注入密钥，避免 PAT 泄露。

在 Vercel 项目后台设置环境变量：

- **`COZE_PAT`**：扣子平台 Personal Access Token（仅服务端可见）

然后重新部署即可。

### 本地开发

本地 `npm run dev` 依旧通过 `vite.config.js` 把 `/api/coze` 代理到 `api.coze.cn`，无需本地 `.env`。

## 功能说明

- **会话隔离**：每次刷新页面会生成新的随机用户 ID，历史对话不保留、不使用 localStorage
- **2 分钟倒计时**：结束后自动弹出《脱单潜力报告》并禁用输入
- **彩蛋**：当小艺回复中出现 `ฅ'ω'ฅ`、`胖橘` 或 `猫` 时，会触发爱心/星星飘落动画
- **再来一局**：在报告弹窗中点击「再来一局」会在前端重置会话并重新开始（避免线上 /chat 刷新 404）
