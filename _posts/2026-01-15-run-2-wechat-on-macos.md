---
layout: post
title: macos双开微信
date: 2026-01-15 00:12:05
---

运行命令即可。

```
sudo cp -R /Applications/WeChat.app /Applications/WeChat1.app

sudo /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.tencent.xinWeChat1" /Applications/WeChat1.app/Contents/Info.plist

sudo codesign --force --deep --sign - /Applications/WeChat1.app
```
