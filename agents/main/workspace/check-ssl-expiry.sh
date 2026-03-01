#!/bin/bash
# =============================================================================
# SSL证书有效期检查脚本
# 功能: 检查准生产环境证书有效期，小于30天时自动更新
# 用法: ./check-ssl-expiry.sh
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
SERVER_IP="8.138.192.106"
DOMAIN="lantel.net"
WARNING_DAYS=30
LOG_FILE="$HOME/.local/log/lzy-ssl-check-$(date +%Y%m%d).log"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPDATE_SCRIPT="$SCRIPT_DIR/update-ssl-cert.sh"

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# 获取证书到期日期
get_cert_expiry_date() {
    local server=$1
    local domain=$2
    
    # 通过 openssl 获取证书有效期
    local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$server":443 2>/dev/null | \
        openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [ -z "$expiry_date" ]; then
        return 1
    fi
    
    echo "$expiry_date"
}

# 计算剩余天数
calculate_days_remaining() {
    local expiry_date="$1"
    
    # 清理日期字符串（去除可能的换行符和多余空格）
    expiry_date=$(echo "$expiry_date" | tr -d '\n' | sed 's/  */ /g' | sed 's/^ *//;s/ *$//')
    
    # 将证书到期日期转换为 Unix 时间戳（兼容 macOS 和 Linux）
    local expiry_timestamp=""
    
    # 尝试 macOS 格式
    expiry_timestamp=$(date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s 2>/dev/null)
    
    # 如果失败，尝试 Linux 格式
    if [ -z "$expiry_timestamp" ]; then
        expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null)
    fi
    
    # 如果还是失败，尝试去掉 GMT
    if [ -z "$expiry_timestamp" ]; then
        local expiry_date_clean=$(echo "$expiry_date" | sed 's/ GMT$//')
        expiry_timestamp=$(date -j -f "%b %d %H:%M:%S %Y" "$expiry_date_clean" +%s 2>/dev/null)
    fi
    
    if [ -z "$expiry_timestamp" ] || ! echo "$expiry_timestamp" | grep -qE '^[0-9]+$'; then
        error "无法解析日期格式: '$expiry_date'"
        return 1
    fi
    
    # 获取当前时间戳
    local current_timestamp=$(date +%s)
    
    # 计算剩余天数
    local days_remaining=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    echo "$days_remaining"
}

# 执行证书更新
update_certificate() {
    log "开始执行证书更新..."
    
    if [ ! -f "$UPDATE_SCRIPT" ]; then
        error "找不到证书更新脚本: $UPDATE_SCRIPT"
        return 1
    fi
    
    # 执行更新脚本
    if bash "$UPDATE_SCRIPT"; then
        log "✅ 证书更新成功"
        return 0
    else
        error "❌ 证书更新失败"
        return 1
    fi
}

# 发送通知
send_notification() {
    local status=$1
    local message=$2
    
    # 这里可以扩展为发送邮件、钉钉、企业微信等
    # 目前仅记录到日志
    log "通知状态: $status - $message"
    
    # 示例：如果安装了 mail 命令，可以发送邮件
    # if command -v mail &> /dev/null; then
    #     echo "$message" | mail -s "SSL证书检查 - $status" admin@lantel.net
    # fi
}

# 主检查逻辑
# 确保日志目录存在
mkdir -p "$HOME/.local/log"

main() {
    log "========================================"
    log "开始检查 SSL 证书有效期"
    log "服务器: $SERVER_IP"
    log "域名: $DOMAIN"
    log "警告阈值: $WARNING_DAYS 天"
    log "========================================"
    
    # 获取证书到期日期
    log "正在获取证书信息..."
    local expiry_date=$(get_cert_expiry_date "$SERVER_IP" "$DOMAIN")
    
    if [ $? -ne 0 ] || [ -z "$expiry_date" ]; then
        error "无法获取证书信息，请检查服务器是否可访问"
        send_notification "ERROR" "无法获取证书信息"
        exit 1
    fi
    
    log "证书到期日期: $expiry_date"
    
    # 计算剩余天数
    local days_remaining=$(calculate_days_remaining "$expiry_date")
    
    if [ $? -ne 0 ]; then
        error "计算剩余天数失败"
        exit 1
    fi
    
    log "证书剩余有效期: $days_remaining 天"
    
    # 判断是否需要更新
    if [ "$days_remaining" -le "$WARNING_DAYS" ]; then
        warning "⚠️  证书有效期仅剩 $days_remaining 天，小于 $WARNING_DAYS 天阈值，需要更新！"
        
        send_notification "WARNING" "证书即将过期，剩余 $days_remaining 天，开始自动更新"
        
        # 执行更新
        if update_certificate; then
            send_notification "SUCCESS" "证书自动更新成功"
            exit 0
        else
            send_notification "FAILED" "证书自动更新失败，请手动处理"
            exit 1
        fi
    else
        log "✅ 证书有效期充足 ($days_remaining 天)，无需更新"
        exit 0
    fi
}

# 执行主函数
main "$@"
