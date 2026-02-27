#!/usr/bin/env bash
# 恢复 Clawdbot MiniMax（minimax-portal OAuth）可用配置：
# 1. 给 clawdbot 的 model.js 打补丁（让 minimax-portal 的 model 带上 api 字段）
# 2. 安装并启用 minimax-portal-auth 插件（若脚本同目录下有该文件夹）
# 3. 在 clawdbot.json 中启用插件
# 使用：把本脚本和 minimax-portal-auth 文件夹放在同一目录，执行 ./restore-clawdbot-minimax.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAWDBOT_HOME="${CLAWDBOT_HOME:-$HOME/.clawdbot}"
CLAWDBOT_JSON="$CLAWDBOT_HOME/clawdbot.json"

# 查找 clawdbot 的 model.js（全局安装）
NPM_ROOT_G="$(npm root -g 2>/dev/null || true)"
if [ -z "$NPM_ROOT_G" ]; then
  echo "无法获取 npm 全局目录，请确保已安装 clawdbot：npm list -g clawdbot"
  exit 1
fi
MODEL_JS="$NPM_ROOT_G/clawdbot/dist/agents/pi-embedded-runner/model.js"
if [ ! -f "$MODEL_JS" ]; then
  echo "未找到 clawdbot model.js: $MODEL_JS"
  exit 1
fi

echo "1. 检查并打补丁: $MODEL_JS"
node -e "
const fs = require('fs');
const path = process.argv[1];
let content = fs.readFileSync(path, 'utf8');
if (content.includes('providerApi = entry?.api')) {
  console.log('  已打过补丁，跳过');
  process.exit(0);
}
const old = '        return (entry?.models ?? []).map((model) => ({ ...model, provider: trimmed }));';
const newBlock = '        const providerApi = entry?.api;\n        const providerBaseUrl = entry?.baseUrl;\n        const providerApiKey = entry?.apiKey;\n        return (entry?.models ?? []).map((model) => ({\n            ...model,\n            provider: trimmed,\n            api: model.api ?? providerApi,\n            ...(providerBaseUrl != null && { baseUrl: model.baseUrl ?? providerBaseUrl }),\n            ...(providerApiKey != null && { apiKey: model.apiKey ?? providerApiKey }),\n        }));';
if (!content.includes(old)) {
  console.error('  未找到预期代码块，可能 clawdbot 版本已变更，请手动打补丁');
  process.exit(1);
}
content = content.replace(old, newBlock);
fs.writeFileSync(path, content);
console.log('  补丁已应用');
" "$MODEL_JS"

echo "2. 安装并启用 minimax-portal-auth 插件"
if [ -d "$SCRIPT_DIR/minimax-portal-auth" ]; then
  clawdbot plugins install "$SCRIPT_DIR/minimax-portal-auth" 2>/dev/null || true
  echo "  已从当前目录安装插件"
else
  echo "  未找到 $SCRIPT_DIR/minimax-portal-auth，跳过安装（若已安装过可忽略）"
fi

echo "3. 在 clawdbot.json 中启用 minimax-portal-auth"
if [ ! -f "$CLAWDBOT_JSON" ]; then
  echo "  未找到 $CLAWDBOT_JSON，请先运行 clawdbot setup"
  exit 1
fi
node -e "
const fs = require('fs');
const path = process.argv[1];
const cfg = JSON.parse(fs.readFileSync(path, 'utf8'));
if (!cfg.plugins) cfg.plugins = {};
if (!cfg.plugins.entries) cfg.plugins.entries = {};
cfg.plugins.entries['minimax-portal-auth'] = { enabled: true };
fs.writeFileSync(path, JSON.stringify(cfg, null, 2));
console.log('  已启用 minimax-portal-auth');
" "$CLAWDBOT_JSON"

echo ""
echo "恢复完成。请手动执行："
echo "  clawdbot models auth login --provider minimax-portal --method oauth-cn --set-default"
echo "  clawdbot gateway restart"
echo ""
echo "完成后在 Telegram 里给机器人发消息即可用 MiniMax 回复。"
