#!/usr/bin/env python3
"""
2022年僵尸订单分析脚本
分析2022年每月是否有僵尸订单
"""

import mysql.connector
from datetime import datetime

# 连接数据库
conn = mysql.connector.connect(
    host='rm-wz98c09t2n18wopu89o.mysql.rds.aliyuncs.com',
    port=3399,
    user='zhousuiting',
    password='TTJ2!PSQwL7vz$9J',
    database='runde_center_revenue_recognition_db'
)

cursor = conn.cursor()

print("=" * 80)
print("2022年 每月僵尸订单分析报告")
print("分析时间: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
print("=" * 80)
print()

# 2022年每月僵尸订单统计（有余额但最后交易日期在2022年之前的订单）
query1 = """
WITH last_records AS (
  SELECT 
    order_id,
    MAX(`date`) AS last_date,
    SUM(un_confirmed_amount) AS current_balance
  FROM `revenue_recognition`
  WHERE deleted = 0
  GROUP BY order_id
  HAVING SUM(un_confirmed_amount) > 0
    AND MAX(`date`) < '2022-01-01'
)
SELECT 
  MONTH(last_date) AS month,
  COUNT(*) AS zombie_order_count,
  SUM(current_balance) AS total_balance,
  ROUND(AVG(current_balance), 2) AS avg_balance
FROM last_records
WHERE YEAR(last_date) = 2022
GROUP BY MONTH(last_date)
ORDER BY month;
"""

print("【2022年每月 最后交易记录在2022年之前的僵尸订单】")
print("-" * 80)
print(f"{'月份':<8} {'僵尸订单数':<15} {'总余额(元)':<20} {'平均余额(元)':<15}")
print("-" * 80)

cursor.execute(query1)
total_orders = 0
total_balance = 0

for month, count, balance, avg_balance in cursor:
    print(f"{month}月{'':<5} {count:<15} {balance:,.2f}{'':<10} {avg_balance:,.2f}")
    total_orders += count
    total_balance += balance

print("-" * 80)
print(f"{'合计':<8} {total_orders:<15} {total_balance:,.2f}")
print()

# 2022年每月的所有订单（有余额的订单）
query2 = """
WITH last_records AS (
  SELECT 
    order_id,
    MAX(`date`) AS last_date,
    SUM(un_confirmed_amount) AS current_balance
  FROM `revenue_recognition`
  WHERE deleted = 0
  GROUP BY order_id
  HAVING SUM(un_confirmed_amount) > 0
)
SELECT 
  MONTH(last_date) AS month,
  COUNT(*) AS order_count,
  SUM(current_balance) AS total_balance,
  ROUND(AVG(current_balance), 2) AS avg_balance
FROM last_records
WHERE YEAR(last_date) = 2022
GROUP BY MONTH(last_date)
ORDER BY month;
"""

print("【2022年每月 所有有余额的订单（最后交易在当月）】")
print("-" * 80)
print(f"{'月份':<8} {'订单数':<15} {'总余额(元)':<20} {'平均余额(元)':<15}")
print("-" * 80)

cursor.execute(query2)
total_orders = 0
total_balance = 0

for month, count, balance, avg_balance in cursor:
    print(f"{month}月{'':<5} {count:<15} {balance:,.2f}{'':<10} {avg_balance:,.2f}")
    total_orders += count
    total_balance += balance

print("-" * 80)
print(f"{'合计':<8} {total_orders:<15} {total_balance:,.2f}")
print()

# 2022年每月僵尸订单占比分析
print("【2022年每月 僵尸订单占比分析】")
print("-" * 80)
print(f"{'月份':<6} {'当月总订单':<12} {'僵尸订单':<12} {'僵尸比例':<12} {'僵尸余额占比':<15}")
print("-" * 80)

cursor.execute(query1)
zombie_by_month = {row[0]: {'count': row[1], 'balance': row[2]} for row in cursor}

cursor.execute(query2)
total_by_month = {row[0]: {'count': row[1], 'balance': row[2]} for row in cursor}

for month in sorted(total_by_month.keys()):
    total = total_by_month[month]
    zombie = zombie_by_month.get(month, {'count': 0, 'balance': 0})
    
    if total['count'] > 0:
        count_ratio = (zombie['count'] / total['count']) * 100
    else:
        count_ratio = 0
        
    if total['balance'] > 0:
        balance_ratio = (zombie['balance'] / total['balance']) * 100
    else:
        balance_ratio = 0
    
    print(f"{month}月{'':<3} {total['count']:<12} {zombie['count']:<12} {count_ratio:>6.1f}%{'':<5} {balance_ratio:>8.1f}%")

print("-" * 80)
print()
print("【结论】")
print("-" * 80)
cursor.execute(query1)
zombie_count = sum(row[1] for row in cursor)
cursor.execute(query2)
total_count = sum(row[1] for row in cursor)

if total_count > 0:
    ratio = (zombie_count / total_count) * 100
    print(f"2022年共有 {total_count} 个有余额订单")
    print(f"其中僵尸订单（最后交易在2022年之前）有 {zombie_count} 个")
    print(f"僵尸订单占比: {ratio:.2f}%")
    if ratio > 0:
        print(f"\n⚠️  存在僵尸订单！需要在每月末进行订单平衡校验时排查这些订单。")
else:
    print("2022年没有有余额的订单数据")

print()
print("说明：僵尸订单 = 有余额但最后交易日期在2022年之前的订单")
print("      当月总订单 = 最后交易日期在2022年当月的有余额订单")

cursor.close()
conn.close()
