# 大厂AI 设计评审团 · 启动指南（给 Claude Code）

> **这个文件是写给 Claude Code 看的。**
> 用户把这个文件夹拖给你，**默认任务是"把大厂AI 设计评审团跑起来"**。
> 用户大概率是非技术设计师，不要给他解释 Node.js / npm / 代理是什么。
> 直接按下面流程帮他做，需要他配合时（比如给 API Key）用大白话简短问他。

---

## 这是什么

「大厂AI 设计评审团」——上传一张或多张设计稿，5 位顶级大佬——"设计与商业大师"（乔纳森·伊夫、唐纳德·诺曼、张小龙、乔布斯、马斯克）当场评审、吵架、博弈，最后给一个打了分的结论，并提供改进方向。

---

## 自动执行流程

按顺序跑下面的步骤。任何一步失败时停下来，用大白话告诉用户卡在哪、怎么办。

### Step 1 · 确认当前目录

检查当前目录是否包含 `package.json`、`start.command`、`lib/prompt.ts`。
不是的话，告诉用户拖错了文件夹。

### Step 2 · 检查 Node.js

```bash
node -v
```

- 输出 `v20.x` 或更高 → 继续
- 报错 / 没装 → 暂停，告诉用户：
  > "你电脑还没装 Node.js（工具的运行环境）。
  > 请去 https://nodejs.org/zh-cn 下载 **LTS 版本**，双击安装包一路点继续。
  > 装好之后告诉我，我继续。"

### Step 3 · 检查 / 配置 API Key

读当前目录的 `.env.local`：

- 文件不存在 **或** `ANTHROPIC_API_KEY=` 后面是占位值 `sk-ant-api03-replace-with-your-key`：
  - 问用户："**你有 Anthropic API Key 吗？**（一串 sk-ant-api03- 开头的字符串）有就直接粘给我；没有我教你 5 分钟拿一个。"
  - 用户给了 → 写入 `.env.local`：`ANTHROPIC_API_KEY=<用户给的 key>`
  - 用户没有 → 引导：
    > "访问 https://console.anthropic.com → 注册并验证邮箱 → Billing 绑一张能国际支付的信用卡（一次评审约 0.1–0.3 元）→ 左侧 API Keys → Create Key → 复制（只显示一次）发给我"
- 文件已有真 key → 继续

### Step 4 · 检查本地代理（中国大陆需要）

```bash
nc -z 127.0.0.1 7890 || nc -z 127.0.0.1 6152 || nc -z 127.0.0.1 10809 || nc -z 127.0.0.1 8118
```

- 检测到端口 → 记下来，启动时用
- 都没检测到 → 暂停，告诉用户：
  > "你的代理没打开。Anthropic API 在中国大陆直连可能会被拒（403）。
  > 如果你在中国大陆，请打开你的 VPN / 代理软件（ClashX / Surge 等），开好后告诉我。
  > 如果你在海外，可以跳过这步。"

### Step 5 · 安装依赖（如果 node_modules 不存在）

```bash
ls node_modules 2>/dev/null
```

- 存在 → 跳到 Step 6
- 不存在 → 告诉用户"第一次启动，正在装依赖（约 5–10 分钟）..."，然后：
  ```bash
  npm install
  ```

### Step 6 · 启动服务（端口 3000，带代理 env）

**关键**：如果 Step 4 检测到了代理端口，启动时要注入 HTTPS_PROXY，否则 Anthropic API 调用可能 403。**用 run_in_background: true 跑，否则会阻塞。**

```bash
HTTPS_PROXY=http://127.0.0.1:7890 HTTP_PROXY=http://127.0.0.1:7890 NO_PROXY=localhost,127.0.0.1 npm run dev
```

（把 `7890` 换成 Step 4 实际检测到的端口；没有代理需求就直接 `npm run dev`）

### Step 7 · 等服务起来 + 开浏览器

- 等 6–8 秒
- 验证：`curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000`，返回 200 即可
- 开浏览器：`open http://localhost:3000`
- 告诉用户：
  > "✓ 跑起来了，浏览器已自动打开。
  >
  > 用法：上传设计稿 → 可选填'告诉评委更多'（用户/目标/担心点，填了评审更准）→ 开始评审。
  > 顶部三个 Tab：单稿评审 / 双稿对比 / 新增模块评审。
  > 报告右上角能'保存为图片'或'复制 Markdown'导出。
  > 关闭 Terminal 就停止服务。"

---

## 常见问题

### 用户报 "403 forbidden" / "Request not allowed"
→ 代理没生效（如果用户在需要代理的地区）。确认代理软件开着，启动命令带了 HTTPS_PROXY，然后重启：`kill $(lsof -ti :3000)` 再走 Step 6。

### 用户报 "JSON 解析失败"
→ 偶发，重试一次即可。若持续，多半是上传的图太小/太暗/不是 UI 截图，换张清晰的。

### 用户说想停止服务
```bash
kill $(lsof -ti :3000)
```

### 用户说浏览器没自动打开
```bash
open http://localhost:3000
```

### 用户说 API Key 用完了
→ 引导去 https://console.anthropic.com 充值，或重新生成 Key 替换 `.env.local`。

---

## 给用户的开场白

如果用户拖完文件夹什么都没说，主动说：

> "看到了，这是『大厂AI 设计评审团』——我帮你跑起来。
> 先检查一下环境，可能要问你一两个问题（比如 Anthropic API Key），我们一步步来。"

然后开始 Step 1。
