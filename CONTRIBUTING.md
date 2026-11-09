# Contributing / 贡献指南

Thanks for taking a look at chatudp. It's a small art project, so contributions are welcome but
should stay in the spirit of the repo: **zero dependencies, one process, everything in memory.**

感谢你来看 chatudp。这是个小艺术项目，欢迎贡献，但请保持仓库的气质：**零依赖、单进程、一切在内存里。**

## Before you open a PR / 提交 PR 前

1. Run the smoke tests / 先跑冒烟测试：

   ```bash
   PORT=8080 API_TIMEOUT_MS=1500 node server.js &
   BASE=http://127.0.0.1:8080 node test/smoke.js
   ```

   All checks should pass. `API_TIMEOUT_MS` is shortened only to keep the timeout test fast.
   所有检查都应通过。`API_TIMEOUT_MS` 调小只是为了让超时用例跑得快。

2. If you changed UI behavior, check the three pages in a browser:
   `/`, `/chat` (open two tabs and chat with yourself), `/api` and `/api#docs`.
   如果改了界面行为，请在浏览器里检查三个页面：`/`、`/chat`（开两个标签页自己和自己聊）、`/api` 和 `/api#docs`。

## Guidelines / 约定

- **Keep it Zero. / 保持零依赖。** Keep `server.js` as a single file and keep `dependencies` empty.
  If your PR adds a `node_module`, we will drop it into the void.
  / 保持 `server.js` 单文件，并保持 `dependencies` 为空。如果你的 PR 引入了一个 `node_modules`，我们会把它丢进虚空。
- **No build step, no bundler, no framework. / 没有构建步骤、没有打包器、没有框架。** Plain HTML/CSS/JS in
  `public/`. We are carbon-based, not webpack-based.
  / `public/` 里就是原生 HTML/CSS/JS。我们是碳基生物，不是 webpack 构建的。
- **Embrace the Chaos. / 拥抱混沌。** Chat behavior is deliberately chaotic; if you touch relay rules, explain
  the intended behavior in the PR description and update `test/smoke.js`. If you break it in a funnier
  way, PR it anyway.
  / 聊天行为故意是混乱的；如果改动接龙规则，请在 PR 描述里说明预期行为，并更新 `test/smoke.js`。如果你以一种更好笑的方式搞坏了它，也请直接提交。
- **Bilingual or Bust. / 要么双语，要么免谈。** UI text lives in `public/assets/i18n.js` — add both `en` and
  `zh` strings.
  / 界面文案在 `public/assets/i18n.js`，新增文案请同时补 `en` 和 `zh`。
- **The Escape Hatch. / 逃生出口。** The list is `public/assets/escape-sites.js`; new entries should be official
  vendor sites. Don't add your own blog.
  / 清单在 `public/assets/escape-sites.js`；新条目应是厂商官方站点。别夹带私货加你自己的博客。
- **Privacy is Absolute. / 绝对隐私。** Don't add analytics, tracking, or external network calls from the
  frontend. We don't want to know who you are, and neither should Google.
  / 不要在前端加统计、追踪或外部网络请求。我们不想知道你是谁，Google 也不该知道。

## Reporting bugs / 报告问题

Include: what you did, what you expected, what happened, and your OS + Node version.
For relay issues, mention how many tabs/people were online and whether the 15s timeout was involved.

请包含：你做了什么、期望什么、实际发生了什么，以及操作系统与 Node 版本。
如果是接龙问题，请说明当时开了几个标签页/几个在线用户，以及是否涉及 15 秒超时。

> "If you found a bug that makes the Mola Mola crash, fix it. If you found a bug that makes it funnier,
> submit it as a feature."
>
> "如果你发现了一个会让翻车鱼崩溃的 Bug，请修复它。如果你发现了一个让项目变得更好笑的 Bug，请把它当作新特性提交。"
