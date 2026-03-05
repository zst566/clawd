const express = require('express');
const { v4: uuidv4 } = require('uuid');

function createRouter(db, io) {
  const router = express.Router();

  // ===== 项目相关 API =====
  
  // 获取所有项目
  router.get('/projects', (req, res) => {
    try {
      const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
      res.json({ success: true, data: projects });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 创建项目
  router.post('/projects', (req, res) => {
    try {
      const { name, description, color } = req.body;
      const id = uuidv4();
      db.prepare('INSERT INTO projects (id, name, description, color) VALUES (?, ?, ?, ?)')
        .run(id, name, description, color || '#1890ff');
      
      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
      io.emit('project:created', project);
      res.json({ success: true, data: project });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ===== 任务相关 API =====

  // 获取项目的所有任务
  router.get('/projects/:projectId/tasks', (req, res) => {
    try {
      const { projectId } = req.params;
      const tasks = db.prepare(`
        SELECT t.*, a.name as assigned_name, a.avatar_emoji 
        FROM tasks t 
        LEFT JOIN agents a ON t.assigned_to = a.id 
        WHERE t.project_id = ? 
        ORDER BY t.created_at DESC
      `).all(projectId);
      res.json({ success: true, data: tasks });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 创建任务
  router.post('/projects/:projectId/tasks', (req, res) => {
    try {
      const { projectId } = req.params;
      const { title, description, priority, estimated_duration, tags, created_by } = req.body;
      const id = uuidv4();
      
      db.prepare(`
        INSERT INTO tasks (id, project_id, title, description, priority, estimated_duration, tags, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, projectId, title, description, priority || 3, estimated_duration, 
             JSON.stringify(tags || []), created_by || 'user');
      
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      
      db.prepare('INSERT INTO task_assignments (task_id, action, performed_by, note) VALUES (?, ?, ?, ?)')
        .run(id, 'created', created_by || 'user', '任务创建');
      
      io.emit('task:created', task);
      res.json({ success: true, data: task });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 更新任务状态
  router.put('/tasks/:taskId/status', (req, res) => {
    try {
      const { taskId } = req.params;
      const { status, performed_by, note } = req.body;
      
      const oldTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
      if (!oldTask) {
        return res.status(404).json({ success: false, error: '任务不存在' });
      }

      let updateSql = 'UPDATE tasks SET status = ?';
      let params = [status];

      if (status === 'running' && oldTask.status !== 'running') {
        updateSql += ', started_at = datetime("now")';
      }
      if ((status === 'completed' || status === 'failed') && oldTask.started_at) {
        updateSql += ', completed_at = datetime("now")';
        updateSql += ', actual_duration = (julianday("now") - julianday(started_at)) * 24 * 60';
      }

      updateSql += ' WHERE id = ?';
      params.push(taskId);
      
      db.prepare(updateSql).run(...params);
      
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
      
      db.prepare('INSERT INTO task_assignments (task_id, action, performed_by, note) VALUES (?, ?, ?, ?)')
        .run(taskId, `status_changed:${status}`, performed_by || 'system', note || `状态变更为: ${status}`);
      
      io.emit('task:status_changed', {
        task,
        oldStatus: oldTask.status,
        newStatus: status
      });
      
      res.json({ success: true, data: task });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 分配任务
  router.post('/tasks/:taskId/assign', (req, res) => {
    try {
      const { taskId } = req.params;
      const { agent_id, instance_id, performed_by } = req.body;
      
      db.prepare('UPDATE tasks SET assigned_to = ?, assigned_instance = ?, status = ? WHERE id = ?')
        .run(agent_id, instance_id, 'assigned', taskId);
      
      const task = db.prepare(`
        SELECT t.*, a.name as assigned_name, a.avatar_emoji 
        FROM tasks t 
        LEFT JOIN agents a ON t.assigned_to = a.id 
        WHERE t.id = ?
      `).get(taskId);
      
      db.prepare('INSERT INTO task_assignments (task_id, agent_id, instance_id, action, performed_by, note) VALUES (?, ?, ?, ?, ?, ?)')
        .run(taskId, agent_id, instance_id, 'assigned', performed_by || 'user', `分配给 ${task.assigned_name}`);
      
      if (instance_id) {
        db.prepare('UPDATE agent_instances SET status = ?, current_task_id = ? WHERE id = ?')
          .run('busy', taskId, instance_id);
      }
      
      io.emit('task:assigned', { task, agent_id, instance_id });
      res.json({ success: true, data: task });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 获取任务历史
  router.get('/tasks/:taskId/history', (req, res) => {
    try {
      const { taskId } = req.params;
      const history = db.prepare(`
        SELECT ta.*, a.name as agent_name 
        FROM task_assignments ta 
        LEFT JOIN agents a ON ta.agent_id = a.id 
        WHERE ta.task_id = ? 
        ORDER BY ta.timestamp DESC
      `).all(taskId);
      res.json({ success: true, data: history });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ===== 智能体相关 API =====

  // 获取所有智能体
  router.get('/agents', (req, res) => {
    try {
      const agents = db.prepare('SELECT * FROM agents ORDER BY created_at').all();
      res.json({ success: true, data: agents });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 智能体心跳
  router.post('/agents/:agentId/heartbeat', (req, res) => {
    try {
      const { agentId } = req.params;
      db.prepare('UPDATE agents SET last_seen = datetime("now"), status = ? WHERE id = ?')
        .run('idle', agentId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 创建智能体实例（分身）
  router.post('/agents/:agentId/spawn', (req, res) => {
    try {
      const { agentId } = req.params;
      const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
      
      if (!agent) {
        return res.status(404).json({ success: false, error: '智能体不存在' });
      }

      const instances = db.prepare('SELECT * FROM agent_instances WHERE agent_id = ?').all(agentId);
      if (instances.length >= agent.max_instances) {
        return res.status(400).json({ success: false, error: '已达到最大实例数限制' });
      }

      const instanceId = `${agentId}-${instances.length + 1}`;
      db.prepare('INSERT INTO agent_instances (id, agent_id, instance_number, started_at) VALUES (?, ?, ?, datetime("now"))')
        .run(instanceId, agentId, instances.length + 1);
      
      const instance = db.prepare('SELECT * FROM agent_instances WHERE id = ?').get(instanceId);
      
      io.emit('instance:spawned', { agent, instance });
      res.json({ success: true, data: instance });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 获取智能体实例
  router.get('/agents/:agentId/instances', (req, res) => {
    try {
      const { agentId } = req.params;
      const instances = db.prepare(`
        SELECT i.*, t.title as current_task_title 
        FROM agent_instances i 
        LEFT JOIN tasks t ON i.current_task_id = t.id 
        WHERE i.agent_id = ?
      `).all(agentId);
      res.json({ success: true, data: instances });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ===== 工作间状态 API =====

  // 获取休息区状态
  router.get('/workspace/lounge', (req, res) => {
    try {
      const agents = db.prepare(`
        SELECT a.*, COUNT(i.id) as instance_count
        FROM agents a
        LEFT JOIN agent_instances i ON a.id = i.agent_id
        WHERE a.status = 'idle'
        GROUP BY a.id
      `).all();
      res.json({ success: true, data: agents });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 获取工作间状态
  router.get('/workspace/workshop', (req, res) => {
    try {
      const workshopData = db.prepare(`
        SELECT 
          a.id as agent_id,
          a.name as agent_name,
          a.role,
          a.avatar_emoji,
          a.max_instances,
          i.id as instance_id,
          i.instance_number,
          i.status as instance_status,
          i.current_task_id,
          i.task_started_at,
          t.title as task_title,
          t.status as task_status
        FROM agents a
        LEFT JOIN agent_instances i ON a.id = i.agent_id
        LEFT JOIN tasks t ON i.current_task_id = t.id
        ORDER BY a.role, i.instance_number
      `).all();

      // 按智能体分组
      const grouped = workshopData.reduce((acc, row) => {
        if (!acc[row.agent_id]) {
          acc[row.agent_id] = {
            agent_id: row.agent_id,
            agent_name: row.agent_name,
            role: row.role,
            avatar_emoji: row.avatar_emoji,
            max_instances: row.max_instances,
            instances: []
          };
        }
        if (row.instance_id) {
          acc[row.agent_id].instances.push({
            id: row.instance_id,
            number: row.instance_number,
            status: row.instance_status,
            current_task: row.current_task_id ? {
              id: row.current_task_id,
              title: row.task_title,
              status: row.task_status
            } : null,
            task_started_at: row.task_started_at
          });
        }
        return acc;
      }, {});

      res.json({ success: true, data: Object.values(grouped) });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 获取统计信息
  router.get('/workspace/stats', (req, res) => {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'running' THEN 1 END) as running_count,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_count,
          COUNT(*) as total_count
        FROM tasks
      `).get();

      const agentStats = db.prepare(`
        SELECT 
          a.name,
          COUNT(i.id) as instance_count,
          COUNT(CASE WHEN i.status = 'busy' THEN 1 END) as busy_count
        FROM agents a
        LEFT JOIN agent_instances i ON a.id = i.agent_id
        GROUP BY a.id
      `).all();

      res.json({ 
        success: true, 
        data: {
          tasks: stats,
          agents: agentStats
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = createRouter;
