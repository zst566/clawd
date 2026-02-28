# 数据层面性能优化建议报告

**生成时间**: 2026-02-28 20:46
**任务**: 阶段9 - 数据层面的性能分析

---

## 一、SQL 查询性能分析

### 1.1 当前问题查询

| SQL 方法 | 问题 | 严重程度 |
|----------|------|----------|
| calculateYearStatistics | DATE_FORMAT 函数导致索引失效 | 🔴 高 |
| calculateOrderCounts | 多次 COUNT(DISTINCT) 重复扫描 | 🟡 中 |
| getYearlyMonthlyData | N+1 查询模式 | 🟡 中 |

### 1.2 具体分析

**问题 1: DATE_FORMAT 索引失效**
```sql
-- ❌ 当前写法
WHERE DATE_FORMAT(date, '%Y-%m') <= ?
AND YEAR(date) = ?

-- ✅ 优化写法
WHERE date >= ? AND date < ?
```

**问题 2: 重复聚合**
当前 calculateYearStatistics 执行 4 次独立 SUM 查询，每次全表扫描。
建议：合并为单次查询。

---

## 二、索引建议

### 2.1 主表索引 (sale_income_main)

```sql
-- 必需索引
ALTER TABLE sale_income_main ADD INDEX idx_date_deleted (date, deleted);
ALTER TABLE sale_income_main ADD INDEX idx_order_id_deleted (order_id, deleted);
ALTER TABLE sale_income_main ADD INDEX idx_source_deleted (source, deleted);

-- 组合索引（可选）
ALTER TABLE sale_income_main ADD INDEX idx_ym_del (date, deleted, order_id);
```

### 2.2 缓存表索引

```sql
-- dashboard_statistics_cache
ALTER TABLE dashboard_statistics_cache ADD INDEX idx_db_month (database_key, latest_stat_month);

-- dashboard_monthly_cache
ALTER TABLE dashboard_monthly_cache ADD INDEX idx_db_year (database_key, stat_year);
```

---

## 三、批量数据处理优化

### 3.1 当前批量计算问题

**calculateYearlyMonthlyCache 逐月循环**
```javascript
// ❌ 当前：逐月循环
for (let i = 0; i < months.length; i++) {
  const statistics = await this.calculateMonthlyStatistics(mainTableName, month);
  // ...
}

// ✅ 优化：批量查询
const allData = await pool.execute(`
  SELECT 
    DATE_FORMAT(date, '%Y-%m') as month,
    SUM(current_period_actual_received) as receipt,
    SUM(refund_price) as refund,
    SUM(current_period_confirmed_revenue_amount) as revenue
  FROM \`${mainTableName}\`
  WHERE YEAR(date) = ? AND deleted = 0
  GROUP BY DATE_FORMAT(date, '%Y-%m')
`, [year]);
```

### 3.2 事务优化

```javascript
// 批量插入使用事务
const connection = await pool.getConnection();
await connection.beginTransaction();
try {
  for (const month of months) {
    await connection.execute(...);
  }
  await connection.commit();
} catch (e) {
  await connection.rollback();
}
```

---

## 四、性能优化优先级

| 优化项 | 预期提升 | 实施难度 | 优先级 |
|--------|----------|----------|--------|
| 添加日期索引 | 50-80% | 低 | 🔴 P0 |
| 合并 SUM 查询 | 30-50% | 中 | 🟡 P1 |
| 批量查询改造 | 20-40% | 中 | 🟡 P2 |
| 缓存版本控制 | 减少穿透 | 低 | 🟢 P3 |

---

## 五、具体实施建议

### 5.1 立即实施 (P0)

1. **添加索引脚本**
```sql
-- 在生产环境执行
ALTER TABLE sale_income_main ADD INDEX idx_date_del (date, deleted);
```

2. **SQL 改写**
```javascript
// getLatestStatMonth 改写
const [rows] = await pool.execute(`
  SELECT MAX(date) as latest_date
  FROM \`${mainTableName}\`
  WHERE deleted = 0
`);
```

### 5.2 短期优化 (P1-P2)

1. 合并年度统计的 4 个 SUM 为 1 个
2. 批量计算改为单次查询 + 内存聚合

### 5.3 长期优化 (P3)

1. Redis 缓存层
2. 数据版本控制
3. 预计算 materialized view

---

## 六、验证方法

```sql
-- 检查索引是否生效
EXPLAIN SELECT * FROM sale_income_main 
WHERE date >= '2025-01-01' AND date < '2026-01-01' AND deleted = 0;

-- 检查慢查询
SHOW VARIABLES LIKE 'slow_query_log';
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

---

## 总结

| 类别 | 优化建议 | 预期效果 |
|------|----------|----------|
| 索引 | 添加 idx_date_del | 查询提升 50-80% |
| SQL | 合并 SUM | 减少 75% 全表扫描 |
| 批量 | 改为单次查询 | 减少 N 次网络往返 |
| 缓存 | Redis 层 | 减少数据库压力 |

**建议立即执行索引添加和 SQL 改写。**

---

**报告人**: @zhou_data_bot
