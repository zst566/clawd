#!/usr/bin/env python3
"""
商品价格差异分析 - 分批优化版
使用主键范围作为goods_id范围的近似值
"""

import pymysql
import csv
from datetime import datetime
import time
import sys

# 记录开始时间
start_time = time.time()

# 数据库连接
print("连接数据库...", flush=True)
conn = pymysql.connect(
    host='rm-wz98c09t2n18wopu89o.mysql.rds.aliyuncs.com',
    port=3399,
    user='zhousuiting',
    password='TTJ2!PSQwL7vz$9J',
    database='runde_center_revenue_recognition_db',
    connect_timeout=60,
    read_timeout=600,
    write_timeout=600
)
cursor = conn.cursor()

print("=" * 60, flush=True)
print("商品价格差异分析 - 分批优化版", flush=True)
print("=" * 60, flush=True)

# 第1步：获取商品ID范围
print("\n📊 第1步：获取goods_id范围...", flush=True)

# 直接使用主键范围作为估计（已验证：主键范围1~534762058）
print("  使用主键范围估计goods_id范围...", flush=True)
cursor.execute("SELECT MIN(revenue_recognition_child_id), MAX(revenue_recognition_child_id) FROM revenue_recognition_child")
min_id, max_id = cursor.fetchone()
print(f"✅ goods_id范围（估计）: {min_id} ~ {max_id}", flush=True)

# 第2步：分批处理
print(f"\n📊 第2步：分批处理（每批10,000个goods_id）...", flush=True)
batch_size = 10000
total_batches = (max_id - min_id) // batch_size + 1
print(f"✅ 总批次数量: {total_batches}", flush=True)

all_multi_price_goods = []
batch_count = 0

for batch_start in range(min_id, max_id + 1, batch_size):
    batch_end = batch_start + batch_size - 1
    batch_count += 1
    
    if batch_count % 10 == 0 or batch_count == 1:
        elapsed = time.time() - start_time
        print(f"  处理批次 {batch_count}/{total_batches}: {batch_start} ~ {batch_end} (已运行{elapsed/60:.1f}分钟)", flush=True)
    
    cursor.execute("""
        SELECT goods_id, goods_name, 
               COUNT(DISTINCT goods_price) as price_count,
               MIN(goods_price) as min_price,
               MAX(goods_price) as max_price,
               MAX(goods_price) - MIN(goods_price) as price_diff
        FROM revenue_recognition_child 
        WHERE deleted = 0 AND goods_id IS NOT NULL
          AND goods_id BETWEEN %s AND %s
        GROUP BY goods_id, goods_name
        HAVING COUNT(DISTINCT goods_price) > 1
    """, (batch_start, batch_end))
    
    batch_results = cursor.fetchall()
    if batch_results:
        print(f"    批次 {batch_count} 发现 {len(batch_results)} 个价格异常商品", flush=True)
    all_multi_price_goods.extend(batch_results)

print(f"✅ 所有批次处理完成，共发现 {len(all_multi_price_goods)} 个价格异常商品", flush=True)

# 按价格差异排序
all_multi_price_goods.sort(key=lambda x: x[5], reverse=True)

# 第3步：导出结果
print("\n📊 第3步：导出结果...", flush=True)
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
filepath = f'/Users/asura.zhou/clawd/agents/zhou_data_bot/workspace/商品价格差异_{timestamp}.csv'

with open(filepath, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.writer(f)
    writer.writerow(['商品ID', '商品名称', '价格数量', '最低价', '最高价', '价格差异'])
    for row in all_multi_price_goods:
        writer.writerow(row)

# 计算耗时
end_time = time.time()
duration = end_time - start_time

print(f"\n" + "=" * 60, flush=True)
print("📋 执行结果汇总", flush=True)
print("=" * 60, flush=True)
print(f"1. goods_id范围: {min_id} ~ {max_id}", flush=True)
print(f"2. 总批次数量: {total_batches}", flush=True)
print(f"3. 发现的价格异常商品总数: {len(all_multi_price_goods)}", flush=True)
print(f"4. 导出文件路径: {filepath}", flush=True)
print(f"5. 执行耗时: {duration:.1f} 秒 ({duration/60:.1f} 分钟)", flush=True)

print("\n🔍 价格差异Top 10:", flush=True)
for i, row in enumerate(all_multi_price_goods[:10], 1):
    name = row[1][:20] if row[1] else "未知"
    print(f"   {i}. ID:{row[0]} {name} 最低价:{row[3]} 最高价:{row[4]} 差异:{row[5]}", flush=True)

cursor.close()
conn.close()

print("\n✅ 分析完成！", flush=True)
