#!/usr/bin/env python3
"""
每日23点自动推送任务
- 提交并推送 clawd 工作目录的修改
- 包括润德教育项目记录和其他文件
"""
import subprocess
import sys
from datetime import datetime

WORKDIR = "/Users/asura.zhou/clawd"
COMMIT_MSG = f"daily: {datetime.now().strftime('%Y-%m-%d')} 自动更新"

def run(cmd, cwd=WORKDIR):
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    return True

def main():
    print(f"=== {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} 自动推送 ===")

    # 检查是否有修改
    if not run("git status --porcelain"):
        print("没有需要推送的修改")
        return

    # 添加所有修改（包括润德教育项目记录）
    if not run("git add ."):
        print("git add 失败")
        return

    # 提交
    if not run(f'git commit -m "{COMMIT_MSG}"'):
        print("git commit 失败")
        return

    # 推送
    if not run("git push origin main"):
        print("git push 失败")
        return

    print("✅ 推送完成")

if __name__ == "__main__":
    main()
