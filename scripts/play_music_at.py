#!/usr/bin/env python3
"""
定时播放音乐脚本
用法:
  python3 play_music_at.py --time "14:30" --file "~/Music/song.mp3"
  python3 play_music_at.py --minutes 5 --file "~/Music/song.mp3"
"""

import argparse
import subprocess
import time
from datetime import datetime, timedelta
import os

def get_music_files(path):
    """获取目录下的音乐文件"""
    extensions = ['.mp3', '.m4a', '.wav', '.flac', '.aac']
    files = []
    if os.path.exists(path):
        for root, dirs, files_list in os.walk(path):
            for f in files_list:
                if any(f.lower().endswith(ext) for ext in extensions):
                    files.append(os.path.join(root, f))
    return files

def play_music(file_path):
    """播放音乐"""
    cmd = ['afplay', os.path.expanduser(file_path)]
    subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"🎵 正在播放: {file_path}")

def main():
    parser = argparse.ArgumentParser(description='定时播放音乐')
    parser.add_argument('--time', '-t', help='播放时间，格式 HH:MM (如 14:30)')
    parser.add_argument('--minutes', '-m', type=int, help='多少分钟后播放 (如 5)')
    parser.add_argument('--file', '-f', default='~/Music/*.mp3', help='音乐文件路径或目录')
    parser.add_argument('--random', '-r', action='store_true', help='随机选择音乐')

    args = parser.parse_args()

    # 计算播放时间
    if args.minutes:
        play_time = datetime.now() + timedelta(minutes=args.minutes)
        print(f"⏰ 将在 {args.minutes} 分钟后播放 ({play_time.strftime('%H:%M:%S')})")
    elif args.time:
        now = datetime.now()
        play_time = datetime.strptime(args.time, '%H:%M')
        play_time = play_time.replace(year=now.year, month=now.month, day=now.day)
        if play_time < now:
            play_time += timedelta(days=1)
        print(f"⏰ 将在 {args.time} 播放")
    else:
        # 默认立即播放
        play_time = datetime.now()
        print("⏰ 立即播放")

    # 准备音乐文件列表
    if os.path.isdir(os.path.expanduser(args.file)):
        music_dir = os.path.expanduser(args.file)
        files = get_music_files(music_dir)
        if args.random and files:
            selected = files[0] if len(files) == 1 else files[0]
        else:
            selected = files[0] if files else None
    elif '*' in args.file or '?' in args.file:
        import glob
        files = glob.glob(os.path.expanduser(args.file))
        selected = files[0] if files else None
    else:
        selected = os.path.expanduser(args.file)

    if not selected or not os.path.exists(selected):
        print(f"❌ 未找到音乐文件: {args.file}")
        return

    # 等待到播放时间
    now = datetime.now()
    wait_seconds = (play_time - now).total_seconds()

    if wait_seconds > 0:
        print(f"💤 等待 {int(wait_seconds)} 秒...")
        time.sleep(wait_seconds)

    # 播放音乐
    play_music(selected)

if __name__ == '__main__':
    main()
