const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DashboardDatabase {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  init() {
    // 项目表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        color TEXT DEFAULT '#1890ff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 任务表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority INTEGER DEFAULT 3,
        created_by TEXT,
        assigned_to TEXT,
        assigned_instance TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        estimated_duration INTEGER,
        actual_duration INTEGER,
        parent_task_id TEXT,
        tags TEXT,
        notes TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);

    // 智能体表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        alias TEXT,
        role TEXT,
        capabilities TEXT,
        max_instances INTEGER DEFAULT 1,
        status TEXT DEFAULT 'idle',
        telegram_handle TEXT,
        session_key TEXT,
        avatar_emoji TEXT DEFAULT '🤖',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME
      )
    `);

    // 工作实例表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_instances (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        instance_number INTEGER,
        status TEXT DEFAULT 'idle',
        current_task_id TEXT,
        started_at DATETIME,
        task_started_at DATETIME,
        total_work_time INTEGER DEFAULT 0,
        FOREIGN KEY (agent_id) REFERENCES agents(id),
        FOREIGN KEY (current_task_id) REFERENCES tasks(id)
      )
    `);

    // 任务分配历史表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        agent_id TEXT,
        instance_id TEXT,
        action TEXT,
        performed_by TEXT,
        note TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ 数据库表初始化完成');
  }

  seed() {
    // 检查是否已有项目
    const projectCount = this.db.prepare('SELECT COUNT(*) as count FROM projects').get();
    if (projectCount.count === 0) {
      // 创建默认项目
      const stmt = this.db.prepare('INSERT INTO projects (id, name, description, color) VALUES (?, ?, ?, ?)');
      stmt.run(uuidv4(), '默认项目', '系统默认项目', '#1890ff');
      console.log('✅ 默认项目创建完成');
    }

    // 检查是否已有智能体
    const agentCount = this.db.prepare('SELECT COUNT(*) as count FROM agents').get();
    if (agentCount.count === 0) {
      // 初始化默认智能体
      const agents = [
        {
          id: 'main',
          name: '小d',
          alias: '@小d',
          role: 'manager',
          capabilities: JSON.stringify(['project_management', 'coordination', 'planning']),
          max_instances: 1,
          avatar_emoji: '🎯'
        },
        {
          id: 'codecraft',
          name: '码匠',
          alias: '@zhou_codecraft_bot',
          role: 'developer',
          capabilities: JSON.stringify(['coding', 'frontend', 'backend', 'review']),
          max_instances: 5,
          telegram_handle: 'zhou_codecraft_bot',
          avatar_emoji: '👨‍💻'
        },
        {
          id: 'data_bot',
          name: '数据助理',
          alias: '@zhou_data_bot',
          role: 'analyst',
          capabilities: JSON.stringify(['data_analysis', 'statistics', 'reporting']),
          max_instances: 3,
          telegram_handle: 'zhou_data_bot',
          avatar_emoji: '📊'
        },
        {
          id: 'guardian',
          name: '安全审查',
          alias: '@guardian',
          role: 'security',
          capabilities: JSON.stringify(['security_scan', 'vulnerability_check', 'compliance']),
          max_instances: 2,
          telegram_handle: 'guardian',
          avatar_emoji: '🛡️'
        },
        {
          id: 'inspector',
          name: '质量审查',
          alias: '@inspector',
          role: 'reviewer',
          capabilities: JSON.stringify(['code_review', 'quality_check', 'best_practices']),
          max_instances: 3,
          telegram_handle: 'inspector',
          avatar_emoji: '🔍'
        }
      ];

      const stmt = this.db.prepare(`
        INSERT INTO agents (id, name, alias, role, capabilities, max_instances, telegram_handle, avatar_emoji)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const agent of agents) {
        stmt.run(agent.id, agent.name, agent.alias, agent.role, agent.capabilities, 
                 agent.max_instances, agent.telegram_handle || null, agent.avatar_emoji);
      }
      console.log('✅ 默认智能体创建完成');
    }
  }

  // 查询方法
  prepare(sql) {
    return this.db.prepare(sql);
  }

  exec(sql) {
    return this.db.exec(sql);
  }

  close() {
    this.db.close();
  }
}

module.exports = DashboardDatabase;
