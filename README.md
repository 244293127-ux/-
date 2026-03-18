# 小艺 (Xiao Yi) - 专属 AI 社交分身与破冰演习室 (MVP Demo)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Coze](https://img.shields.io/badge/AI-Coze-blue?style=for-the-badge)
![Deployment](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge)

> **💡 项目初衷：** 针对高学历单身青年在社交匹配后“破冰难、易死聊”的痛点，打造一个低成本的“真实交友演练场”。让用户在正式开启对话前，先在 AI 替身这里“排雷”并磨练社交技巧。

## 🌟 核心产品逻辑

本项目不仅仅是一个聊天机器人，而是一个深度模拟真实社交心理的 **策略模型**：

* **对抗 AI 讨好偏见 (Anti-Helpfulness Bias)：** 通过 Prompt 深度调优，阻断了大模型常见的“客服式反问”与“长篇大论”，极致还原真实用户的聊天节奏与情绪。
* **社交防御机制 (Social Defense System)：** 首创“两振出局（Two Strikes）”逻辑。精准识别“爹味说教”、“查户口”等越界言论，触发二次冒犯即强制终止对话，模拟真实社交中的“拉黑”行为。
* **低成本千人千面：** 采用动态提示词注入技术，根据用户勾选的特质（MBTI、择偶雷区等）实时生成专属 AI 副本，无需维护昂贵的多 Agent 架构。

## 🛠️ 技术实现

* **前端开发：** 使用 **React + Vite** 框架，结合 **Tailwind CSS** 实现移动端高度适配。
* **AI 引擎：** 基于 **Coze** 平台进行大模型编排，通过 API 实现前后端交互。
* **拟人化渲染：** 独创“特殊符切分 (`||`) + 异步延迟渲染”逻辑，完美复刻真实女生“长短句结合、双气泡连发”的打字感。
* **快速交付：** 采用 **Cursor (Vibe Coding)** 模式，在一周内完成从 0 到 1 的全栈敏捷开发与 Vercel 自动化部署。

## 📦 快速上手

如果你想在本地运行本项目：

1. **克隆项目**
   ```bash
   git clone [https://github.com/你的用户名/你的仓库名.git](https://github.com/你的用户名/你的仓库名.git)
   cd 你的仓库名
