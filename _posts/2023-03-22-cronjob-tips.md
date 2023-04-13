---
layout: post
title: 常见crobjob时间例子
date: 2023-03-22 00:12:05
---

- 查看cronjob

```
crontab -l
```

- 编辑cronjob

```
crontab -e
```

- `* * * * *`：每分钟运行一次

- `0 * * * *`：每小时的整点运行一次

- `*/5 * * * *`：每隔5分钟运行一次

- `0 */3 * * *`：每隔3小时运行一次

- `0 0 * * *`：每天午夜运行一次

- `0 0 * * 0`：每周日午夜运行一次

- `0 0 1 * *`：每月的第一天午夜运行一次

- `0 0 * * 1`：每周一午夜运行一次

- `0 0 * * 3`：每周三午夜运行一次

- `0 0 * * 6`：每周六午夜运行一次

- `0 0 * * 7`：每周日午夜运行一次

- `0 12 * * *`：每天中午12点运行一次

- `0 12 * * 1-5`：每个工作日中午12点运行一次

- `0 0 1,15 * *`：每月的1号和15号午夜各运行一次

- `0 0 */2 * *`：每隔两天午夜运行一次