# Xiaomao 的博客 · Astro 迁移预览

这是从 Hexo / Butterfly 迁移到 Astro 的本地试用版本。当前分支为 `codex/astro-migration`，线上网站仍由旧版本提供。

## 本地运行

需要 Node.js 24。

```sh
npm ci
npm run dev
```

在终端显示的本地地址查看。生产版本检查：

```sh
npm run check
npm run build
npm run verify
npm run preview
```

## 写文章

文章在 `src/content/posts/`，每篇为 Markdown 文件。目录不会决定最终网址，frontmatter 的 `permalink` 决定网址。例子：

```yaml
---
title: "文章标题"
date: "2026-10-16T08:00:00.000Z"
updated: "2026-10-16T08:00:00.000Z"
permalink: "/2026/10/16/new-post/"
category: "algorithm"
description: "文章摘要"
source: "original"
---
```

支持普通 Markdown、表格、代码高亮、`$...$` 行内公式和 `$$...$$` 公式块。日期显示为 Asia/Shanghai。静态附件放入 `public/`，通过 `/文件路径` 引用。

## 迁移记录

- 16 篇已发布文章全部迁移，保留旧文章 URL、归档 URL、文章 URL 与首页第二页地址。
- 14 篇来自 `yxmmmm/obsidian-vault` 的 Markdown 原稿；复制后独立保存在本项目中，运行和构建不依赖笔记仓库。
- 《洛谷P1957普及-》《2026MCM C题》未找到准确原稿，在 Markdown 文件中保存了已发布 HTML 正文。后者的 PDF 也已保留。
- 原稿可能比已发布内容新，建议上线前阅读确认。没有将未发布笔记和日记加入网站。
- `migration-report.json` 逐篇记录来源与附件情况。
- `scripts/migrate.mjs` 是一次性导入脚本，需要相邻目录 `../article-source` 和当前保留的旧网页。重新运行会覆盖对应的已迁移文章；日常写作不要运行它。
- 根目录旧 HTML/CSS/JS 暂时保留用于对照。Astro 仅使用 `src/` 与 `public/` 构建，旧网页不会混入 `dist/`。
- 搜索当前匹配文章标题、摘要与分类；图片继续使用原来的外部图床。字体使用系统字体，不依赖外部字体服务。

## GitHub Pages

`public/CNAME` 保留 `xiaomaoyang.top`。工作流默认只构建和验证，并上传构建产物，避免试用阶段替换线上网站。

决定上线后：将迁移分支合并到 main，在 GitHub 仓库 Settings → Pages 中选择 GitHub Actions，再手动运行 `Build Astro preview` 工作流并启用 deploy。确认上线后，可以将工作流调整为 main 提交后自动部署。

原始文章来自用户自己的博客和笔记仓库。框架参考：[内容集合](https://docs.astro.build/en/guides/content-collections/)、[GitHub Pages 部署](https://docs.astro.build/en/guides/deploy/github/)。

## 视觉方案 B

参考 Axi404 博客的浅蓝渐变、居中头像简介、左侧分节标题和圆角模块，以自己的组件与样式重新实现。保留 Xiaomao 的个人内容和原头像；头像已保存到 public/img/avatar.png。


文章列表、搜索与分类筛选位于独立的 `/blog/` 页面，首页保留个人介绍、教育经历和统计。

分类独立页面已移除。内容方向及分类标签链接到 `/blog/?category=分类名`，在文章页统一筛选。

首页按参考站布局调整为居中头像简介，以及 About、Education、Statistics 三个左右分栏模块；发布日历来自文章实际日期，不是 GitHub 活跃度。

代码块采用跟随页面明暗配色的编辑器样式，字体优先使用 Consolas，带语言标签、行号和复制按钮。公式使用本地 KaTeX，兼容 Obsidian 单行双美元公式块；Mermaid 通过本地打包的依赖按需渲染，支持切换深浅配色。
