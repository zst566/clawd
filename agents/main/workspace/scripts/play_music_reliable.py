#!/usr/bin/env python3
"""
定时播放音乐 - 可靠版
使用 launchd 或后台运行方式，确保锁屏后也能执行
"""

import os
import subprocess
import argparse
from datetime import datetime, timedelta
import time
import signal

class MusicScheduler:
    def __init__(self):
        self.running = True
        
    def signal_handler(self, signum, frame):
        print("\n🛑 收到停止信号，退出...")
        self.running = False
        
    def play_music(self, file_path):
        """播放音乐"""
        file_path = os.path.expanduser(file_path)
        if not os.path.exists(file_path):
            print(f"❌ 文件不存在: {file_path}")
            return False
            
        # 方法1: afplay
        try:
            subprocess.Popen(['afplay', file_path], 
                           stdout=subprocess.DEVNULL, 
                           stderr=subprocess.DEVNULL)
            print(f"🎵 播放中: {os.path.basename(file_path)}")
            return True
        except:
            pass
            
        # 方法2: open with Music app
        try:
            subprocess.Popen(['open', '-a', 'Music', file_path],
                           stdout=subprocess.DEVNULL, 
                           stderr=subprocess.DEVNULL)
            print(f"🎵 Music app 播放: {os.path.basename(file_path)}")
            return True
        except:
            pass
            
        # 方法3: qlmanage 快速查看
        try:
            subprocess.Popen(['qlmanage', '-p', file_path],
                           stdout=subprocess.DEVNULL, 
                           stderr=subprocess.DEVNULL)
            print(f"🎵 预览播放: {os.path.basename(file_path)}")
            return True
        except:
            pass
            
        print("❌ 无法播放")
        return False
        
    def run_at_time(self, target_time, file_path, countdown=True):
        """指定时间播放"""
        now = datetime.now()
        target = datetime.strptime(target_time, '%H:%M')
        target = target.replace(year=now.year, month=now.month, day=now.day)
        
        if target < now:
            target += timedelta(days=1)
            
        wait_seconds = (target - now).total_seconds()
        
        print(f"⏰ 将在 {target.strftime('%H:%M')} 播放")
        print(f"⏳ 等待 {int(wait_seconds)} 秒...")
        
        # 倒计时显示
        while wait_seconds > 0 and self.running:
            mins = int(wait_seconds // 60)
            secs = int(wait_seconds % 60)
            print(f"\r   倒计时: {mins:02d}:{secs:02d}  ", end="", flush=True)
            time.sleep(1)
            wait_seconds -= 1
            
        print()
        
        if self.running:
            self.play_music(file_path)
            
    def run_after_minutes(self, minutes, file_path):
        """多少分钟后播放"""
        target = datetime.now() + timedelta(minutes=minutes)
        target_str = target.strftime('%H:%M')
        print(f"⏰ 将在 {target.strftime('%H:%M')} 播放 ({minutes} 分钟后)")
        self.run_at_time(target_str, file_path, countdown=False)

def create_launchd_plist(file_path, minutes):
    """创建 launchd plist 文件（可选，更可靠）"""
    plist_path = os.path.expanduser('~/Library/LaunchAgents/com.user.musicplay.plist')
    file_path = os.path.expanduser(file_path)
    
    plist = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.user.musicplay</string>
    <key>ProgramArguments</key>
    <array>
        <string>afplay</string>
        <string>{file_path}</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Minute</key>
        <integer>{minutes}</integer>
    </dict>
</dict>
</plist>'''
    
    with open(plist_path, 'w') as f:
        f.write(plist)
        
    return plist_path

def main():
    parser = argparse.ArgumentParser(description='定时播放音乐（可靠版）')
    parser.add_argument('--time', '-t', help='播放时间，格式 HH:MM (如 14:30)')
    parser.add_argument('--minutes', '-m', type=int, help='多少分钟后播放 (如 5)')
    parser.add_argument('--file', '-f', required=True, help='音乐文件路径')
    parser.add_argument('--daemon', '-d', action='store_true', help='使用 launchd 后台运行 (更可靠)')
    
    args = parser.parse_args()
    
    scheduler = MusicScheduler()
    signal.signal(signal.SIGINT, scheduler.signal_handler)
    signal.signal(signal.SIGTERM, scheduler.signal_handler)
    
    if args.daemon and args.minutes:
        # 使用 launchd
        plist_path = create_launchd_plist(args.file, args.minutes)
        os.system(f'launchctl load {plist_path}')
        print(f"✅ 已设置 launchd 定时任务，{args.minutes} 分钟后播放")
    elif args.minutes:
        scheduler.run_after_minutes(args.minutes, args.file)
    elif args.time:
        scheduler.run_at_time(args.time, args.file)
    else:
        # 立即播放
        scheduler.play_music(args.file)

if __name__ == '__main__':
    main()
