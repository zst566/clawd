# 恢复 Clawdbot MiniMax 配置

在新环境或重装 clawdbot 后，执行本目录下的脚本即可恢复「MiniMax OAuth + 能正常回复」的配置。

## 前提

- 已安装 Node.js 和 clawdbot：`npm i -g clawdbot`
- 已运行过 `clawdbot setup`（存在 `~/.clawdbot/clawdbot.json`）

## 使用

```bash
cd /path/to/clawd   # 本工作区目录
./restore-clawdbot-minimax.sh
```

脚本会：

1. 给 clawdbot 的 `model.js` 打补丁（让 minimax-portal 的 model 带上 `api` 字段，避免 `Unhandled API in mapOptionsForApi: undefined`）
2. 从当前目录安装 `minimax-portal-auth` 插件（需与脚本同目录）
3. 在 `~/.clawdbot/clawdbot.json` 中启用该插件

## 之后需手动执行

```bash
clawdbot models auth login --provider minimax-portal --method oauth-cn --set-default
clawdbot gateway restart
```

完成 OAuth 登录并重启 Gateway 后，在 Telegram 里给机器人发消息即可用 MiniMax 回复。

## 目录结构（需随仓库推送）

```
clawd/
├── restore-clawdbot-minimax.sh   # 恢复脚本
├── restore-clawdbot-minimax.md   # 本说明
└── minimax-portal-auth/          # 插件（与脚本同目录便于安装）
    ├── clawdbot.plugin.json
    ├── package.json
    ├── index.ts
    └── oauth.ts
```

## 说明

- 补丁打在 `node_modules` 里的 clawdbot 上，**升级或重装 clawdbot 后会丢失**，需要重新执行本脚本。
- OAuth 凭证存在 `~/.clawdbot/`，不会随本仓库推送；换机器后需重新执行一次 `clawdbot models auth login`。
