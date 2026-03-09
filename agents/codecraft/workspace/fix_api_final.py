#!/usr/bin/env python3
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    lines = f.readlines()

# 删除第107-108行（0-indexed: 106-107）
# 并在第106行添加 if (!error.response) {
lines = lines[:106] + ['      if (!error.response) {\n'] + lines[106:]

# 现在第109-110行是原来的107-108行，删除它们
lines = lines[:109] + lines[111:]

with open('src/services/api.ts', 'w') as f:
    f.writelines(lines)

print("Fixed api.ts")
