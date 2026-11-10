# Changelog / 更新日志

All notable changes to this project are documented in this file.
本项目的重要变更都记录在这里。

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to
[Semantic Versioning](https://semver.org/).
格式遵循 [Keep a Changelog](https://keepachangelog.com/) 与[语义化版本](https://semver.org/)。

## [Unreleased] / 未发布

Nothing yet. / 暂无。

## [v0.0.2-alpha] — 2026-11-11 — Official MV / 官方 MV

### ✨ Added / 新增

- Official MV — "Packet dropped! 丢包啦！" music video (1080p, 02:13), original WAV, lyrics SRT and
  16:9 / 4:3 covers in `mv/`; also published on [Bilibili](https://www.bilibili.com/video/BV185WL6HEM6).
  / 官方 MV —— 《Packet dropped! 丢包啦！》音乐视频（1080p，02:13）、原始 WAV、歌词 SRT、16:9 / 4:3 封面，都在 `mv/`；同步发布到 [B 站](https://www.bilibili.com/video/BV185WL6HEM6)。
- `mv/README.md` — asset and licensing notes for the MV / MV 素材与授权说明。

### 🔧 Changed / 变更

- `package.json` version bumped to `0.0.2-alpha`; new tag `v0.0.2-alpha`.
  / `package.json` 版本升到 `0.0.2-alpha`；新增标签 `v0.0.2-alpha`。
- License kept fully open: code MIT, logo / docs / MV & audio CC0 1.0.
  / 保持全部开源：代码 MIT，LOGO / 文档 / MV 与音频 CC0 1.0。

## [v0.0.1-alpha] — 2026-11-10 — First public alpha / 首个公开测试版

> Status: first public alpha; tag `v0.0.1-alpha` points to the initial public commit.
> 状态：首个公开测试版；`v0.0.1-alpha` 标签指向最初的公开提交。

### ✨ Added / 新增

- Landing page — dark cyber-green theme, Mola fish logo, `Shallow & Seek Nothing`, MolaChaos copy,
  bilingual switch (English default).
  / 落地页 — 深色赛博绿主题、翻车鱼 LOGO、`Shallow & Seek Nothing`、MolaChaos 文案、中英切换（默认英文）。
- Chat room — DeepSeek-style sidebar (logo / language / Escape Hatch), terminal-style log with a
  5-line cap, white questions, green replies, gray system lines, red packet-loss warning.
  / 聊天室 — 左栏（LOGO / 语言 / 逃生出口）、终端风格记录流（最多 5 行）、白色提问、绿色回复、灰色系统行、红色丢包警告。
- Real UDP random relay with directed rules — replies go back to the sender once, the sender's next
  message avoids the conversation partner, a lonely packet is dropped (no self-echo).
  / 真实的 UDP 随机接龙 + 有向规则 — 回复只回到发送者一次，发送者下一条避开对话对象，单人时直接丢包（不回环）。
- 15-second packet loss — red warning in chat, HTTP 503 in the API.
  / 15 秒丢包 — 聊天页红色警告，API 返回 HTTP 503。
- OpenAI-compatible API — `POST /v1/chat/completions` (SSE streaming + non-stream JSON with
  `carbon_node`), `GET /v1/models`, `OPTIONS /v1/*` → 204, CORS `*`, `Authorization` ignored,
  case-insensitive `MolaChaos` model check.
  / OpenAI 兼容 API — `POST /v1/chat/completions`（SSE 流式 + 带 `carbon_node` 的非流式 JSON）、
  `GET /v1/models`、`OPTIONS /v1/*` → 204、CORS `*`、忽略 `Authorization`、`MolaChaos` 模型名忽略大小写。
- API page — ceremonial API Keys (modal, copy, mask after confirm, local creation/last-used dates,
  name + Use button) and a bilingual API reference with LM Studio integration guide.
  / API 页 — 仪式感 API Key（弹框、复制、确认后打码、本地创建/使用日期、命名 + 使用按钮）与中英双语接口文档（含 LM Studio 接入指南）。
- Escape Hatch — 19 official model vendor sites (10 domestic + 9 international).
  / 逃生出口 — 19 个模型厂商官网（10 个国内 + 9 个国际）。
- Docs & project files — README (bilingual, screenshots, IUCN reality check), `PACT.md` v1.0 with
  Article VII (Protect the Fish), `CONTRIBUTING.md`, `MOLA_MOLA.md`, CI workflow, screenshots.
  / 文档与项目文件 — README（中英双语、截图、IUCN 现实警告）、`PACT.md` v1.0（含第七条保护翻车鱼）、
  `CONTRIBUTING.md`、`MOLA_MOLA.md`、CI workflow、截图。
- Assets — original logo line art in `assets-src/logo.png`, tinting script, logo released under
  **CC0 1.0**.
  / 素材 — 原始线稿 `assets-src/logo.png`、上色脚本，LOGO 以 **CC0 1.0** 发布。

### 🔧 Changed / 变更

- All prose docs are now bilingual (Chinese + English). / 所有说明文档改为中英对照。
- API timeout semantics unified in code and docs: HTTP 503 `Carbon node is touching grass.`
  / API 超时语义在代码与文档中统一为 HTTP 503 `Carbon node is touching grass.`
- API docs use the official bilingual content; headings and table headers switch with the language.
  / 接口文档使用正式中英内容；标题与表头随语言切换。
- `package.json` version aligned to `0.0.1-alpha`; release tag renamed to `v0.0.1-alpha`.
  / `package.json` 版本对齐 `0.0.1-alpha`；发布标签改为 `v0.0.1-alpha`。
- Repository cleanup: removed unused logo variants, added screenshots, `.gitignore`, CI.
  / 仓库整理：移除未使用的 LOGO 变体，加入截图、`.gitignore`、CI。

### 🩹 Fixed / 修复

- Removed a hard-coded personal absolute path from `assets-src/make-logo.py` (now portable relative
  path). Historical commits still need sanitizing before the first public push.
  / 移除了 `assets-src/make-logo.py` 里硬编码的个人绝对路径（改为可移植相对路径）。首次公开推送前仍需清理历史提交。
- API docs headings and table headers now actually switch language instead of being static bilingual
  text.
  / 接口文档标题与表头现在真正随语言切换，而不再是静态双语文本。
- Masked API keys are never re-displayed in full; "last used" starts empty and updates locally.
  / 打码后的 API Key 不再显示完整值；“最新使用日期”初始为空并在本地更新。

### 🔁 Alpha snapshots / 修订快照

The alpha went through 8 development snapshots before the first public push. The tag was moved to each
new snapshot, so the version number stayed `0.0.1-alpha`. The development history is kept locally and is
**not** part of the public repository (the public repo starts with a single `V0.0.1α` commit).
测试版在首次公开推送前经历了 8 个开发快照。每次完成一版就把标签移到最新快照，所以版本号一直是
`0.0.1-alpha`。开发历史保留在本地，**不随公开仓库发布**（公开仓库只包含一条 `V0.0.1α` 初始提交）。

1. README open-source final draft / README 开源定稿
2. All docs bilingual / 文档全文双语
3. PACT v1.0 / 翻车鱼誓约 v1.0
4. CONTRIBUTING final / 贡献指南正式版
5. Personal path removed from `make-logo.py` / 移除脚本里的个人路径
6. Logo released under CC0 1.0 / LOGO 以 CC0 开源
7. IUCN reality check + `MOLA_MOLA.md` + PACT Article VII / IUCN 警告 + 科普档案 + 第七条
8. CHANGELOG + version notes / 更新日志与版本说明

### 📌 Version policy / 版本规则

- The app version (`0.0.2-alpha`) is independent from the model name
  (`MolaChaos-0.5K V0.1 1110`).
  / 应用版本（`0.0.2-alpha`）与模型名（`MolaChaos-0.5K V0.1 1110`）相互独立。
- Tags are immutable after a release is published. Future releases bump the patch
  (`0.0.3-alpha`, …) or, for the first feature-complete milestone, `0.1.0-alpha`.
  / 发布后标签不再移动。后续版本按 `0.0.3-alpha` 递增；达到首个功能完整里程碑时改为 `0.1.0-alpha`。
