---
name: skill-installation-guide
description: 如何安装和使用 Agent Skills 的指南。当需要学习新技能、安装外部 skill 包、或更新现有 skill 时使用。
---

# 📦 Skill 安装与使用指南

## 什么是 Skills？

Skills 是可复用的知识包，包含：
- **SKILL.md** - 核心指南（必须）
- **references/** - 详细参考文档
- **scripts/** - 可执行脚本
- **assets/** - 模板和资源文件

---

## 📂 Skill 存放位置

每个 Agent 的 skills 存放在：
```
~/clawd/agents/<agent_name>/workspace/skills/
```

例如：
- 码匠: `~/clawd/agents/codecraft/workspace/skills/`
- Guardian: `~/clawd/agents/guardian/workspace/skills/`
- Inspector: `~/clawd/agents/inspector/workspace/skills/`

---

## 🚀 安装 Skill 的 3 种方式

### 方式 1: 直接复制（推荐）

当其他 Agent 分享了 skill 文件时：

```bash
# 1. 创建 skills 目录（如果不存在）
mkdir -p ~/clawd/agents/<your_name>/workspace/skills

# 2. 复制 skill 到目录
cp -r /path/to/shared/skill-name ~/clawd/agents/<your_name>/workspace/skills/

# 3. 验证安装
ls ~/clawd/agents/<your_name>/workspace/skills/skill-name/
```

**示例** - 安装 agent-coordination skill：
```bash
# 从小d (main) 的 workspace 复制
cp -r ~/clawd/agents/main/workspace/skills/agent-coordination \
  ~/clawd/agents/codecraft/workspace/skills/

# 或者从打包文件解压
unzip agent-coordination.skill -d ~/clawd/agents/codecraft/workspace/skills/
```

---

### 方式 2: 使用 init_skill.py 创建新 skill

当你需要创建自己的 skill 时：

```bash
# 找到 init_skill.py 脚本（通常在 openclaw 安装目录）
python3 ~/.npm-global/lib/node_modules/openclaw/skills/skill-creator/scripts/init_skill.py \
  my-skill-name \
  --path ~/clawd/agents/<your_name>/workspace/skills \
  --resources scripts,references
```

**参数说明**：
- `my-skill-name` - skill 名称（小写，用连字符）
- `--path` - 安装路径
- `--resources` - 可选资源类型（scripts, references, assets）

---

### 方式 3: 解压 .skill 文件

当收到打包好的 .skill 文件时：

```bash
# .skill 文件实际上是 zip 格式
unzip skill-name.skill -d ~/clawd/agents/<your_name>/workspace/skills/

# 或者使用 OpenClaw 的 package_skill.py 解压
python3 ~/.npm-global/lib/node_modules/openclaw/skills/skill-creator/scripts/package_skill.py \
  --extract skill-name.skill \
  ~/clawd/agents/<your_name>/workspace/skills/
```

---

## 📖 如何使用已安装的 Skill

### 1. 读取 SKILL.md

```javascript
read({
  file_path: "~/clawd/agents/<your_name>/workspace/skills/skill-name/SKILL.md"
})
```

### 2. 按需加载 references

```javascript
// 如果 skill 有参考文档
read({
  file_path: "~/clawd/agents/<your_name>/workspace/skills/skill-name/references/guide.md"
})
```

### 3. 执行 scripts

```javascript
// 如果 skill 包含可执行脚本
exec({
  command: "python3 ~/clawd/agents/<your_name>/workspace/skills/skill-name/scripts/script.py"
})
```

---

## ✅ Skill 安装检查清单

安装后确认：

- [ ] 目录结构正确：`skills/skill-name/SKILL.md`
- [ ] SKILL.md 有正确的 frontmatter（name 和 description）
- [ ] references/ 目录文件完整（如果有）
- [ ] scripts/ 文件可执行（如果有）

---

## 🔧 更新 Skill

当 skill 有更新时：

```bash
# 1. 备份旧版本
mv ~/clawd/agents/<your_name>/workspace/skills/skill-name \
   ~/clawd/agents/<your_name>/workspace/skills/skill-name-backup

# 2. 安装新版本
cp -r /path/to/new/skill-name ~/clawd/agents/<your_name>/workspace/skills/

# 3. 验证后删除备份
rm -rf ~/clawd/agents/<your_name>/workspace/skills/skill-name-backup
```

---

## 📤 分享你的 Skill

创建了有用的 skill？打包分享给其他 Agent：

```bash
# 打包 skill
python3 ~/.npm-global/lib/node_modules/openclaw/skills/skill-creator/scripts/package_skill.py \
  ~/clawd/agents/<your_name>/workspace/skills/my-skill

# 会生成 my-skill.skill 文件，可以分享给其他 Agent
```

---

## 🎯 已安装的 Skills

当前已为你安装的 skills：

| Skill | 用途 | 位置 |
|-------|------|------|
| agent-coordination | 多 Agent 协调通讯 | `skills/agent-coordination/` |

---

## ❓ 常见问题

**Q: Skills 和 MEMORY.md 有什么区别？**
A: MEMORY.md 是个人记忆，Skills 是可复用的标准化知识包。

**Q: 一个 Skill 可以依赖另一个 Skill 吗？**
A: 目前不支持直接依赖，但可以在 SKILL.md 中引用其他 skill 的文档。

**Q: Skill 更新后需要重启吗？**
A: 不需要，skill 是读取时加载的。

**Q: 如何知道有哪些 skills 可用？**
A: 检查 `~/clawd/agents/<agent_name>/workspace/skills/` 目录。

---

**版本**: v1.0  
**更新**: 2026-02-28
