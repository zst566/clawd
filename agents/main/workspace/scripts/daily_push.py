#!/usr/bin/env python3
"""
每日23点自动推送任务
- 提交并推送 clawd 工作目录的修改
- 同步各项目的工作记录到远程仓库
"""
import subprocess
import sys
from datetime import datetime

WORKDIR = "/Users/asura.zhou/clawd"
COMMIT_MSG = f"daily: {datetime.now().strftime('%Y-%m-%d')} 自动更新"

# 需要同步的项目列表
PROJECTS = {
    "clawd": "/Users/asura.zhou/clawd",
    "文旅": "/Volumes/SanDisk2T/dv-codeBase/茂名·交投-文旅平台",
    "润德": "/Volumes/SanDisk2T/dv-codeBase/RunDeEdu",
    "鹿状元": "/Volumes/SanDisk2T/dv-codeBase/鹿状元",
    "商场促销": "/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall",
}

def run(cmd, cwd=None):
    """执行命令，返回是否成功"""
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ❌ 失败: {result.stderr.strip()}")
        return False
    return True

def push_project(name, path):
    """推送单个项目"""
    print(f"\n📦 处理项目: {name}")
    print(f"   路径: {path}")

    # 检查是否是git仓库
    if not run("git rev-parse --git-dir", cwd=path):
        print(f"   ⚠️ 跳过: 不是git仓库")
        return True

    # 检查是否有修改
    status = subprocess.run("git status --porcelain", shell=True, cwd=path, capture_output=True, text=True)
    if not status.stdout.strip():
        print(f"   ✅ 没有修改，跳过")
        return True

    # 添加所有修改
    if not run("git add .", cwd=path):
        return False

    # 提交
    if not run(f'git commit -m "{COMMIT_MSG}"', cwd=path):
        return False

    # 推送
    if not run("git push origin main", cwd=path):
        return False

    print(f"   ✅ 推送完成")
    return True

def main():
    print(f"\n{'='*50}")
    print(f"🚀 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} 自动推送开始")
    print(f"{'='*50}")

    success_count = 0
    fail_count = 0

    for name, path in PROJECTS.items():
        if push_project(name, path):
            success_count += 1
        else:
            fail_count += 1

    print(f"\n{'='*50}")
    print(f"📊 完成: {success_count} 个成功, {fail_count} 个失败")
    print(f"{'='*50}\n")

if __name__ == "__main__":
    main()
