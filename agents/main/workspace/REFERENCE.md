# REFERENCE.md - 技术参考文档

> 技术规范、配置详情、操作指南
> 快速查阅，不加载到主上下文

---

## 🕐 时间处理规范

### 核心原则
- **时区标准**: 统一使用北京时间 (Asia/Shanghai, UTC+8)
- **后端职责**: 生成和存储时间全部为北京时间
- **前端职责**: 直接使用后端返回的时间，**禁止进行任何时区转换**
- **数据库**: 时间字段使用 `DATETIME` 类型，时区设为 `+8:00`

### 后端代码示例
```javascript
const dayjs = require('dayjs')
const now = dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')
```

### 数据库配置
```sql
SET GLOBAL time_zone = '+8:00';
```

---

## 🤖 AI 模型配置

### Kimi Coding (默认)
| 配置项 | 值 |
|--------|-----|
| **提供商** | kimi-coding |
| **Base URL** | https://api.kimi.com/coding |
| **默认模型** | k2p5 (Kimi K2.5 Coding) |
| **配置位置** | `~/.openclaw/openclaw.json` |

### 其他可用模型
- `minimax/MiniMax-M2.1` - Minimax 模型
- `minimax/MiniMax-M2.5` - Minimax M2.5 (带推理)
- `moonshot/kimi-k2.5` - Kimi K2.5 (Moonshot 国内)

---

## 📊 大数据查询最佳实践

### 分批处理模板
```python
# 1. 获取ID范围
cursor.execute("SELECT MIN(id), MAX(id) FROM table")
min_id, max_id = cursor.fetchone()

# 2. 分批处理（每批1万条）
batch_size = 10000
for batch_start in range(min_id, max_id + 1, batch_size):
    batch_end = batch_start + batch_size - 1
    cursor.execute("""
        SELECT ... FROM table 
        WHERE id BETWEEN %s AND %s
    """, (batch_start, batch_end))
```

### 关键要点
| 要点 | 建议 |
|------|------|
| 数据库连接 | PyMySQL + 超时设置 |
| 批大小 | 1万条/批 |
| 超时 | read_timeout=300秒 |

---

## 🖥️ Docker 服务器

### 局域网 Docker 服务器
| 配置项 | 值 |
|--------|-----|
| **系统** | Ubuntu 24+ |
| **IP 地址** | `192.168.31.188` |
| **用户名** | `zhou` |
| **SSH** | 已配置免密登录 |

**快速连接:**
```bash
ssh zhou@192.168.31.188
```

**用途:**
- 运行项目 Docker 开发环境
- 部署测试容器
- 运行数据库容器（MySQL、Redis）

---

## 🛠️ 开发技能索引

| 技能名称 | 路径 | 用途 |
|---------|------|------|
| project-workflow | `skills/project-workflow/` | 标准化项目启动与开发流程 |

---

*创建时间: 2026-03-07*
