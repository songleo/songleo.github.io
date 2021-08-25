---
layout: post
title: shell命令tips
date: 2020-01-08 00:12:05
---

- 命令查找

```
# install fzf
brew install fzf
$(brew --prefix)/opt/fzf/install
```

- 判断cmd是否存在

```
#! /bin/bash
if command -v cmd >/dev/null 2>&1; then
  echo 'exists cmd'
else 
  echo 'no exists cmd'
fi
```

> :) 未完待续......
