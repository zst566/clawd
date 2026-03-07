#!/bin/bash

# 票根模块 API 测试脚本
# 测试环境: http://192.168.31.188/api/mobile (Nginx代理)

BASE_URL="http://192.168.31.188/api/mobile"
echo "=========================================="
echo "票根模块 API 功能测试"
echo "测试服务器: $BASE_URL"
echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# 测试结果记录
declare -a RESULTS
declare -a DETAILS

TOTAL=0
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expect_http=$5
    local expect_code=$6
    
    TOTAL=$((TOTAL + 1))
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "[$TOTAL] 测试项: $name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "请求: $method $BASE_URL$endpoint"
    
    if [ -n "$data" ] && [ "$data" != "" ]; then
        echo "数据: ${data:0:100}..."
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
    
    http_code=$(echo "$response" | tail -1 | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed '$d')
    
    echo ""
    echo "HTTP状态: $http_code"
    
    # 检查结果
    local status="FAIL"
    local detail=""
    
    if [ "$http_code" = "$expect_http" ]; then
        # 检查JSON响应中的code字段
        if echo "$body" | grep -q '"code"'; then
            resp_code=$(echo "$body" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
            if [ "$resp_code" = "$expect_code" ]; then
                status="PASS"
                echo "API Code: $resp_code ✅"
                PASSED=$((PASSED + 1))
            elif [ "$http_code" = "401" ] && [ "$expect_http" = "401" ]; then
                status="PASS"
                echo "权限拦截正常 ✅"
                PASSED=$((PASSED + 1))
            else
                echo "API Code: $resp_code ❌ (期望: $expect_code)"
                FAILED=$((FAILED + 1))
                detail="返回码: $resp_code, 期望: $expect_code"
            fi
        else
            if [ "$http_code" = "200" ] && [ "$expect_http" = "200" ]; then
                status="PASS"
                echo "响应正常 ✅"
                PASSED=$((PASSED + 1))
            elif [ "$http_code" = "401" ] && [ "$expect_http" = "401" ]; then
                status="PASS"
                echo "权限拦截正常 ✅"
                PASSED=$((PASSED + 1))
            elif [ "$http_code" = "404" ] && [ "$expect_http" = "404" ]; then
                status="PASS"
                echo "404处理正常 ✅"
                PASSED=$((PASSED + 1))
            elif [ "$http_code" = "400" ] && [ "$expect_http" = "400" ]; then
                status="PASS"
                echo "参数验证正常 ✅"
                PASSED=$((PASSED + 1))
            else
                echo "响应异常 ❌"
                FAILED=$((FAILED + 1))
                detail="HTTP: $http_code"
            fi
        fi
    else
        echo "HTTP状态码不匹配 ❌ (期望: $expect_http)"
        FAILED=$((FAILED + 1))
        detail="HTTP: $http_code, 期望: $expect_http"
    fi
    
    echo "响应: ${body:0:300}"
    echo ""
    
    RESULTS[$TOTAL]="[$TOTAL] $name: $status"
    DETAILS[$TOTAL]="$detail"
}

# ==================== 公开接口测试 ====================
echo "═══════════════════════════════════════════════════════"
echo "【第一部分：公开接口测试 (无需登录)】"
echo "═══════════════════════════════════════════════════════"
echo ""

# 1. 票根类型列表
test_api "票根类型列表" "GET" "/ticket/types" "" "200" "200"

# 2. 商户分类列表
test_api "商户分类列表" "GET" "/ticket/categories" "" "200" "200"

# 3. Banner
test_api "Banner列表" "GET" "/ticket/banners" "" "200" "200"

# 4. 热点资讯
test_api "热点资讯" "GET" "/ticket/news" "" "200" "200"

# 5. 商户列表
test_api "商户列表" "GET" "/ticket/merchants?page=1&pageSize=10" "" "200" "200"

# 6. 商户详情
test_api "商户详情(有效ID)" "GET" "/ticket/merchant/1" "" "200" "200"

# ==================== 权限控制测试 ====================
echo "═══════════════════════════════════════════════════════"
echo "【第二部分：权限控制测试 (需要登录的接口)】"
echo "═══════════════════════════════════════════════════════"
echo ""

# 7. 我的票根 (无Token - 应返回401)
test_api "我的票根(无Token)" "GET" "/ticket/my-tickets" "" "401" ""

# 8. 票根识别 (无Token - 应返回401)
test_api "票根识别(无Token)" "POST" "/ticket/recognize" '{"imageBase64":"test","type":"train"}' "401" ""

# 9. 生成核销码 (无Token - 应返回401)
test_api "生成核销码(无Token)" "POST" "/ticket/verify-code" '{"ticketId":1,"merchantId":1,"originalAmount":100}' "401" ""

# ==================== 边界情况测试 ====================
echo "═══════════════════════════════════════════════════════"
echo "【第三部分：边界情况测试】"
echo "═══════════════════════════════════════════════════════"
echo ""

# 商户详情 - 不存在的ID (应返回404)
test_api "商户详情(不存在ID)" "GET" "/ticket/merchant/999999" "" "404" ""

# 热点资讯 - 分页参数
test_api "热点资讯(分页)" "GET" "/ticket/news?page=1&pageSize=5" "" "200" "200"

# 商户列表 - 关键词搜索
test_api "商户列表(关键词搜索)" "GET" "/ticket/merchants?keyword=美食" "" "200" "200"

# 商户列表 - 分类筛选
test_api "商户列表(分类筛选)" "GET" "/ticket/merchants?category=all" "" "200" "200"

# 验证核销码 - 无效码 (应返回400)
test_api "验证核销码(无效码)" "POST" "/ticket/verify" '{"code":"000000"}' "400" ""

# 验证核销码 - 缺少参数
test_api "验证核销码(缺少参数)" "POST" "/ticket/verify" '{}' "400" ""

echo ""
echo "═══════════════════════════════════════════════════════"
echo "【测试汇总报告】"
echo "═══════════════════════════════════════════════════════"
echo "总测试数: $TOTAL"
echo "✅ 通过: $PASSED"
echo "❌ 失败: $FAILED"
if [ $TOTAL -gt 0 ]; then
    PASS_RATE=$(echo "scale=1; $PASSED * 100 / $TOTAL" | bc -l 2>/dev/null || echo "N/A")
    echo "通过率: $PASS_RATE%"
fi
echo "═══════════════════════════════════════════════════════"
echo ""
echo "【详细结果】"
for i in $(seq 1 $TOTAL); do
    echo "  ${RESULTS[$i]}"
done
echo ""
