---
layout: post
title: go语言简介
date: 2018-11-22 00:12:05
---

## 1 基础知识

#### go语言有以下特点：

- 编译型语言，编译速度快

- 静态类型语言，拥有动态类型语言特点

- 类c语法，简单易学

- 支持gc

- 语言层面支持并发

- 跨平台编译

## 2 著名的go项目：

- docker：开源的应用容器引擎

- kubernetes：一个开源的，用于管理云平台中多个主机上的容器化的应用

- etcd：用于可靠地存储集群的配置数据的一种持久性，轻量型的，分布式的键-值数据存储系统

- gogs：一款极易搭建的自助git服务

- beego：一个快速开发go应用的http框架

#### hellow world:

```golang
package main

import "fmt"

func main() {
    fmt.Println("Hello, world!")
}
```

## 3 简单的go demo:

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

    str = "new string"
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

## 4 变量

- 声明的变量必须使用（导入的包也必须使用）

- 多个变量赋值

- `:=`声明变量


```golang
package main

import (
    "fmt"
)

var N int = 100

// N := 100

// var N int
func main() {
    a, b := 1, 2
    fmt.Println(a, b)

    var num int
    num = 10
    fmt.Println(num)

    var test string = "test"
    fmt.Println(test)

    fmt.Println(N)
}
```

## 5 函数

- 支持多值返回，具名返回

- 使用`_`丢弃返回值

- 以大写字母开头包级别的函数供外部访问

```golang
func log(message string) {
}

func add(a int, b int) (ret int) {
    return ret
}

func power(name string) (int, bool) {
    return 1, true
}
```

## 6 结构体

- 不支持重载

- 通过组合实现继承

- 没有构造函数

- 可以匿名组合和具名组合

- 使用new创建一个结构体指针

- 大写字母开头的变量可以访问

```golang
package main

import (
    "fmt"
)

type Demo1 struct {
    id   int
    name string
}

type Demo struct {
    id   int
    name string
    d1   Demo1
    // Demo1
}

func (d *Demo) change(name string) {
    d.name = name
}

func (d Demo) unchange(name string) {
    d.name = name
}

func main() {
    d := Demo{}
    fmt.Println(d)
    d.name = "demo1"
    fmt.Println(d)
    d.change("name2")
    fmt.Println(d)
    d.unchange("name3")
    fmt.Println(d)

    dptr := new(Demo)
    // dptr := &Demo{}

    fmt.Println(dptr)
    dptr.name = "demo1"
    fmt.Println(dptr)
    dptr.change("name2")
    fmt.Println(dptr)
    dptr.unchange("name3")
    fmt.Println(dptr)

    d1 := Demo{1, "test", Demo1{}}
    fmt.Println(d1)
    println(d1.name)
    println(d1.d1.name)
}

```

## 7 字典、数组和切片

- 字典

```golang
package main

import "fmt"

func main() {
    // d := make(map[string]int)
    // d := map[string]int{"1": 1, "2": 2}
    d := map[string]int{}
    d["1"] = 1
    d["2"] = 2
    d["3"] = 3

    for k, v := range d {
        fmt.Println(k, v)
    }

    v, exists := d["3"]
    fmt.Println(v, exists)
}

```

- 数组

```golang
package main

import "fmt"

func main() {
    // s := [3]int{1, 2, 3}
    // s := [...]int{1, 2, 3}
    var s [3]int
    fmt.Println(len(s))
    fmt.Println(cap(s))

    s[0] = 0
    s[1] = 1
    s[2] = 2
    // s[3] = 4

    for idx, v := range s {
        fmt.Println(idx, v)
    }
}
```

- 切片

```golang
package main

import "fmt"

func main() {
    // s := []int{0, 1, 2}
    var s []int
    s = make([]int, 3, 4)
    // s := make([]int, 3, 5)
    fmt.Println(len(s))
    fmt.Println(cap(s))

    s[0] = 0
    s[1] = 1
    s[2] = 2

    s = append(s, 3)

    for idx, v := range s {
        fmt.Println(idx, v)
    }

    fmt.Println(s[1:3])
}

```

## 8 接口

- 接口只声明，不实现

- 实现多态

- duck-typing：如果一个对象走路像鸭子，游泳也像鸭子，叫声也像鸭子，那么该对象就可以被称作为鸭子

```golang
package main

import (
    "fmt"
)

type Square struct {
    a int
}

func (s *Square) Area() int {
    return s.a * s.a
}

func (s *Square) Perimeter() int {
    return s.a * 4
}

type Rectangle struct {
    a int
    b int
}

func (r *Rectangle) Area() int {
    return r.a * r.b
}

func (r *Rectangle) Perimeter() int {
    return (r.a + r.b) * 2
}

type Shaper interface {
    Area() int
    Perimeter() int
}

type AnyShape interface{}

func main() {

    square := new(Square)
    square.a = 2

    rectangle := new(Rectangle)
    rectangle.a = 2
    rectangle.b = 3

    fmt.Println("(1) call struct method:")
    fmt.Println("square area is: ", square.Area())
    fmt.Println("rectangle area is: ", rectangle.Area())

    fmt.Println("\n(2) via interface:")
    var shape Shaper
    shape = square
    fmt.Println("square area is: ", shape.Area())
    shape = rectangle
    fmt.Println("rectangle area is: ", shape.Area())

    fmt.Println("\n(3) via empty interface:")
    var anyShape AnyShape
    anyShape = square
    fmt.Println("square area is: ", anyShape.(*Square).Area())
    anyShape = rectangle
    fmt.Println("rectangle area is: ", anyShape.(*Rectangle).Area())

    fmt.Println("\n(4) type assertions via switch:")
    switch shape := anyShape.(type) {
    case *Rectangle:
        fmt.Printf("shape type is: %T\n", shape)
        fmt.Println("rectangle area is: ", shape.Area())
    default:
        fmt.Printf("unknown type %T\n", shape)
    }

    fmt.Println("\n(5) type assertions via comma, ok pattern:")
    anyShape = rectangle
    if shape, ok := anyShape.(*Rectangle); ok {
        fmt.Printf("shape type is: %T\n", shape)
        fmt.Println("rectangle area is: ", shape.Area())
    } else {
        fmt.Printf("unknown type %T\n", shape)
    }
}
```

## 9 包管理

- go get: go get github.com/mattn/go-sqlite3

- 大写字母开头的变量或者函数对外可见

- 标准库结构

- demo pkg

## 10 协程

一个简单的协程：

```golang
package main

import (
    "fmt"
    "sync"
    "time"
)

var (
    counter = 0
    lock    sync.Mutex
)

func main() {
    for i := 0; i < 3; i++ {
        go incr()
    }
    time.Sleep(time.Millisecond * 10)
}

func incr() {
    lock.Lock()
    defer lock.Unlock()
    counter++
    fmt.Println(counter)
}
```

使用通道进行协程间通信：

- 通道支持select

- 通道有类型

- 通道大小

- go确保任意时刻只有一个协程可以访问数据

```golang
package main

import (
    "fmt"
    "time"
)

func main() {
    c := make(chan int)

    for i := 0; i < 5; i++ {
        worker := &Worker{id: i}
        go worker.process(c)
    }

    for i := 0; i < 5; i++ {
        c <- i
        time.Sleep(time.Millisecond * 50)
    }
}

type Worker struct {
    id int
}

func (w *Worker) process(c chan int) {
    for i := 0; i < 5; i++ {
        data := <-c
        fmt.Printf("worker %d got %d\n", w.id, data)
    }
}
```

## next

- python多进程之multiprocessing

- python小技巧分享