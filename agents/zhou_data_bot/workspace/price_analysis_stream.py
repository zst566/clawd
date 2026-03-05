#!/usr/bin/env python3
"""
商品价格差异分析 - 全量流式分批优化版
方案：使用LIMIT分批查询
"""

import pymysql
import pandas as pd
from datetime import datetime
import time

# 数据库配置
DB_CONFIG = {
    'host': 'rm-wz98c09t2n18wopu89o.mysql.rds.aliyuncs.com',
    'port': 3399,
    'user': 'zhousuiting',
    'password': 'TTJ2!PSQwL7vz$9J',
    'database': 'runde_center_revenue_recognition_db',
    'connect_timeout': 30,
    'read_timeout': 300
}

WORK_DIR = '/Users/asura.zhou/clawd/agents/zhou_data_bot/workspace'

def main():
    start_time = time.time()
    
    print("=" * 60, flush=True)
    print("商品价格差异分析 - 全量流式版", flush=True)
    print("=" * 60, flush=True)
    
    # 连接数据库
    print("\n📡 正在连接数据库...", flush=True)
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    print("✅ 数据库连接成功", flush=True)
    
    # 第1步：创建临时结果表
    print("\n📋 第1步：创建临时结果表...", flush=True)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS temp_price_analysis (
            goods_id BIGINT,
            goods_name VARCHAR(255),
            price_count INT,
            min_price DECIMAL(10,2),
            max_price DECIMAL(10,2),
            price_diff DECIMAL(10,2),
            PRIMARY KEY (goods_id)
        )
    """)
    conn.commit()
    print("✅ 临时表创建完成", flush=True)
    
    # 第2步：先获取所有不重复的goods_id（分批获取）
    print("\n📊 第2步：获取商品ID列表...", flush=True)
    
    # 使用游标流式获取
    all_goods_ids = set()
    batch = 0
    cursor.execute("""
        SELECT DISTINCT goods_id 
        FROM revenue_recognition_child 
        WHERE deleted = 0 AND goods_id IS NOT NULL
        ORDER BY goods_id
    """)
    
    while True:
        rows = cursor.fetchmany(10000)
        if not rows:
            break
        for row in rows:
            all_goods_ids.add(row[0])
        batch += 1
        if batch % 10 == 0:
            print(f"  已获取 {len(all_goods_ids):,} 个商品ID...", flush=True)
    
    all_goods_ids = sorted(list(all_goods_ids))
    total_goods = len(all_goods_ids)
    print(f"✅ 获取完成，总商品数: {total_goods:,}", flush=True)
    
    # 第3步：分批处理
    print("\n🔄 第3步：流式分批处理...", flush=True)
    
    batch_size = 500
    found = 0
    
    for i in range(0, total_goods, batch_size):
        batch_ids = all_goods_ids[i:i+batch_size]
        ids_str = ','.join([str(x) for x in batch_ids])
        
        try:
            cursor.execute(f"""
                SELECT goods_id, goods_name,
                       COUNT(DISTINCT goods_price) as price_count,
                       MIN(goods_price) as min_price,
                       MAX(goods_price) as max_price,
                       MAX(goods_price) - MIN(goods_price) as price_diff
                FROM revenue_recognition_child
                WHERE deleted = 0 AND goods_id IN ({ids_str})
                GROUP BY goods_id, goods_name
                HAVING COUNT(DISTINCT goods_price) > 1
            """)
            
            results = cursor.fetchall()
            if results:
                for row in results:
                    cursor.execute("""
                        INSERT INTO temp_price_analysis 
                        (goods_id, goods_name, price_count, min_price, max_price, price_diff)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                        goods_name=VALUES(goods_name),
                        price_count=VALUES(price_count),
                        min_price=VALUES(min_price),
                        max_price=VALUES(max_price),
                        price_diff=VALUES(price_diff)
                    """, row)
                conn.commit()
                found += len(results)
            
        except Exception as e:
            print(f"⚠️ 批次 {i//batch_size} 出错: {e}", flush=True)
        
        # 每100批汇报进度
        if (i // batch_size) % 100 == 0:
            elapsed = time.time() - start_time
            progress = i / total_goods * 100
            print(f"📈 进度: {i:,}/{total_goods:,} ({progress:.1f}%), 发现异常: {found:,}, 耗时: {elapsed:.1f}秒", flush=True)
    
    print(f"\n✅ 全量分析完成！共发现 {found:,} 个价格异常商品", flush=True)
    
    # 第4步：导出Excel
    print("\n📁 第4步：导出Excel...", flush=True)
    cursor.execute("""
        SELECT * FROM temp_price_analysis 
        ORDER BY price_diff DESC
    """)
    results = cursor.fetchall()
    
    df = pd.DataFrame(results, columns=['商品ID', '商品名称', '价格数量', '最低价', '最高价', '价格差异'])
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filepath = f'{WORK_DIR}/商品价格差异分析_全量_{timestamp}.xlsx'
    df.to_excel(filepath, index=False, engine='openpyxl')
    print(f"✅ Excel导出: {filepath}", flush=True)
    
    # 清理临时表
    cursor.execute("DROP TABLE IF EXISTS temp_price_analysis")
    conn.commit()
    conn.close()
    
    total_time = time.time() - start_time
    
    # Top 10
    print("\n" + "=" * 60, flush=True)
    print("🔍 价格差异Top 10:", flush=True)
    print("=" * 60, flush=True)
    for i, row in enumerate(results[:10], 1):
        name = row[1][:30] if row[1] else 'N/A'
        print(f"{i:2d}. ID:{row[0]:<12} {name:<30} 最低:{row[3]:<10} 最高:{row[4]:<10} 差异:{row[5]}", flush=True)
    
    # 汇总
    print("\n" + "=" * 60, flush=True)
    print("📊 执行汇总", flush=True)
    print("=" * 60, flush=True)
    print(f"1. 总商品ID数量: {total_goods:,}", flush=True)
    print(f"2. 处理进度: 100%", flush=True)
    print(f"3. 发现的价格异常商品总数: {found:,}", flush=True)
    print(f"4. Excel文件完整路径: {filepath}", flush=True)
    print(f"5. 执行总耗时: {total_time:.1f}秒 ({total_time/60:.1f}分钟)", flush=True)
    print("=" * 60, flush=True)

if __name__ == '__main__':
    main()
