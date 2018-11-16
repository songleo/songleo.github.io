---
layout: post
title: go语言简介
date: 2018-11-16 00:12:05
---

## 1 基础知识

go语言有以下特点：

- 编译型语言，编译速度快

- 静态类型语言，拥有动态类型语言特点

- 类c语法，简单易学

- 支持gc

- 语言层面支持并发

- 跨平台编译

著名的go项目：

- docker：开源的应用容器引擎

- kubernetes：一个开源的，用于管理云平台中多个主机上的容器化的应用

- etcd：用于可靠地存储集群的配置数据的一种持久性，轻量型的，分布式的键-值数据存储系统

- gogs：一款极易搭建的自助git服务

- beego：一个快速开发go应用的http框架

hellow world:

```golang
package main

import "fmt"

func main() {
    fmt.Println("Hello, world!")
}
```

简单的go demo:

```golang
package main

import (
    "fmt"
    "time"
)

func demo(i int) {
    fmt.Printf("demo%d\n", (i))
}

func main() {
    num := 1
    fmt.Println(num)

    str := "string"
    fmt.Println(str)

    var foo int
    foo = 123
    var bar int = 456
    fmt.Println(foo, bar)

    if foo == 123 {
        fmt.Println("foo is 123")
    }

    for i := 0; i < 3; i++ {
        fmt.Println(i)
    }

    for i := 0; i < 5; i++ {
        go demo(i)
    }

    time.Sleep(2 * time.Second)
}
```

## 2 函数

- 支持多值返回，具名返回

- 使用`_`丢弃返回值

```
func log(message string) {
}

func add(a int, b int) (ret int) {
    return ret
}

func power(name string) (int, bool) {
    return 1, true
}
```

##  结构体

##  映射、数组和切片

##  代码组织和接口

##  并发
