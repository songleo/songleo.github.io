---
layout: post
title: promql学习（一）
date: 2020-11-09 12:12:05
---

### 即时向量选择器

至少包含一个指标名称或者一个标签。

```
go_goroutines{env="dev",job="job1"}
```

- go_goroutines：指标名称
- env：标签
- job：标签

标签匹配支持以下操作符：

- =：精确地匹配标签给定的值

- !=：不等于给定的标签值

- =~：正则表达匹配给定的标签值

- !~：给定的标签值不符合正则表达式


### 范围向量选择器

简单的理解为有时间范围的即时向量选择器。

```
go_goroutines[1m]
```

支持的时间范围有：s/m/h/d/w/y


### 偏移修饰符offset

某个时间点的时间序列数据。

```
go_goroutines offset 2m
```