#!/usr/bin/env python3
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 修复空 catch 块
content = content.replace(
    '''              } catch (loginError) {
              }''',
    '''              } catch (loginError) {
                // 登录失败，继续执行后面的清除认证逻辑
              }'''
)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Fixed")
