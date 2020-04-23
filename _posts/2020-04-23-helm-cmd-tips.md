---
layout: post
title: helm命令tips
date: 2020-04-23 00:12:05
---

- 检查chart语法

```
helm lint stable/app-name
```

- 打包helm chart

```
helm package stable/app-name
```

- 查看渲染效果

```
helm template --debug ./app-name-1.0.0.tgz
```

> :) 未完待续......
