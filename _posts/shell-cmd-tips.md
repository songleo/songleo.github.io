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

if command -v cmd >/dev/null 2>&1; then
  echo 'exists cmd'
else 
  echo 'no exists cmd'
fi
```

- 判断变量是否存在

```
if [[ -z "${var}" ]]; then
  echo "var is not set"
fi

or 

if [[ -n "${var}" ]]; then
  echo "var is set"
fi
```

- 遇到不存在的变量终止执行

```
set -u
or
set -o nounset
```

- 脚本执行发生错误就终止执行

```
set -e

set -o pipefail # 适用于管道命令
```

- 调式shell脚本

```
set -x
```


> :) 未完待续......
