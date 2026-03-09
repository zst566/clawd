#!/bin/bash

# 票根模块 API 测试脚本
# 测试环境: http://192.168.31.188:3000/api/mobile

BASE_URL="http://192.168.31.188:3000/api/mobile"
echo "=========================================="
echo "票根模块 API 功能测试"
echo "测试服务器: $BASE_URL"
echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# 测试计数器
TOTAL=0
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expect_code=$5
    
    TOTAL=$((TOTAL + 1))
    echo "[$TOTAL] 测试: $name"
    echo "    方法: $method $BASE_URL$endpoint"
    
    if [ -n "$data" ]; then
        echo "    数据: $data"
    fi
    
    # 执行请求
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')
    
    echo "    HTTP状态: $http_code"
    
    # 检查是否成功
    if [ "$http_code" = "200" ] || [ "$http_code" = "$expect_code" ]; then
        # 检查返回的JSON是否包含code字段
        if echo "$body" | grep -q '"code"'; then
            resp_code=$(echo "$body" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
            if [ "$resp_code" = "200" ]; then
                echo "    ✅ 通过 (API Code: $resp_code)"
                PASSED=$((PASSED + 1))
            else
                echo "    ❌ 失败 (API Code: $resp_code)"
                echo "    响应: ${body:0:200}"
                FAILED=$((FAILED + 1))
            fi
        else
            echo "    ✅ 通过 (HTTP: $http_code)"
            PASSED=$((PASSED + 1))
        fi
    else
        echo "    ❌ 失败 (HTTP: $http_code)"
        echo "    响应: ${body:0:200}"
        FAILED=$((FAILED + 1))
    fi
    
    echo ""
}

# ==================== 公开接口测试 ====================
echo "【一、公开接口测试】"
echo "===================================="
echo ""

# 1. 票根类型列表
test_api "票根类型列表" "GET" "/ticket/types" "" "200"

# 2. 商户分类列表
test_api "商户分类列表" "GET" "/ticket/categories" "" "200"

# 3. Banner
test_api "Banner列表" "GET" "/ticket/banners" "" "200"

# 4. 热点资讯
test_api "热点资讯" "GET" "/ticket/news" "" "200"

# 5. 商户列表
test_api "商户列表" "GET" "/ticket/merchants?page=1&pageSize=10" "" "200"

# 6. 商户详情 (使用ID=1)
test_api "商户详情" "GET" "/ticket/merchant/1" "" "200"

# ==================== 需要登录的接口测试 ====================
echo "【二、需要登录的接口 - 无Token测试】"
echo "===================================="
echo ""

# 7. 我的票根 (无Token)
test_api "我的票根(无Token)" "GET" "/ticket/my-tickets" "" "401"

# 8. 票根识别 (无Token)
test_api "票根识别(无Token)" "POST" "/ticket/recognize" '{"imageBase64":"test","type":"train"}' "401"

# 9. 生成核销码 (无Token)
test_api "生成核销码(无Token)" "POST" "/ticket/verify-code" '{"ticketId":1,"merchantId":1,"originalAmount":100}' "401"

# 10. 验证核销码 (公开接口，不需要Token)
test_api "验证核销码" "POST" "/ticket/verify" '{"code":"123456"}' "400"

echo "【三、边界情况测试】"
echo "===================================="
echo ""

# 商户详情 - 不存在的ID
test_api "商户详情(不存在的ID)" "GET" "/ticket/merchant/999999" "" "404"

# 商户列表 - 无效的分类
test_api "商户列表(无效分类)" "GET" "/ticket/merchants?category=invalid" "" "200"

# 热点资讯 - 分页测试
test_api "热点资讯(分页)" "GET" "/ticket/news?page=1&pageSize=5" "" "200"

echo ""
echo "=========================================="
echo "测试汇总"
echo "=========================================="
echo "总测试数: $TOTAL"
echo "✅ 通过: $PASSED"
echo "❌ 失败: $FAILED"
echo "通过率: $(awk "BEGIN {printf \"%.1f%%\", ($PASSED/$TOTAL)*100}")"
echo "=========================================="
