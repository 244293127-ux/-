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

在 **`src/config.js`** 中填写：

- **PAT**：扣子平台个人访问令牌 (Personal Access Token)
- **BOT_ID**：你的 Bot ID

保存后刷新页面即可与「小艺」对话。

## 功能说明

- **会话隔离**：每次刷新页面会生成新的随机用户 ID，历史对话不保留、不使用 localStorage
- **2 分钟倒计时**：结束后自动弹出《脱单潜力报告》并禁用输入
- **彩蛋**：当小艺回复中出现 `ฅ'ω'ฅ`、`胖橘` 或 `猫` 时，会触发爱心/星星飘落动画
- **再来一局**：在报告弹窗中点击「再来一局」会刷新页面，重新开始
