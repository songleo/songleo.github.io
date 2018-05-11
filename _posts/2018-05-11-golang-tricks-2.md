---
layout: post
title: go技巧分享（二）
date: 2018-05-11 00:05:00
---

这是一个系列文章，主要分享go的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 并发访问map

```go
package main

import "sync"

type Map struct {
    sync.RWMutex
    Data map[int]int
}

func main() {
    m := Map{}
    m.Data = make(map[int]int)

    for i := 0; i < 100000; i++ {
        go m.Write(i, i)
        go m.Read(i)
    }
}

func (m *Map) Read(key int) int {
    m.RLock()
    value := m.Data[key]
    m.RUnlock()
    return value
}

func (m *Map) Write(key int, value int) {
    m.Lock()
    m.Data[key] = value
    m.Unlock()
}
```

错误示例：

```go
func (m *Map) Read(key int) int {
    // m.RLock()
    value := m.Data[key]
    // m.RUnlock()
    return value
}

func (m *Map) Write(key int, value int) {
    // m.Lock()
    m.Data[key] = value
    // m.Unlock()
}

/*
fatal error: concurrent map read and map write
或者
fatal error: concurrent map writes
*/
```

多协程并发访问map时，有可能会导致程序退出，错误信息为：fatal error: concurrent map read and map write 或者 fatal error: concurrent map writes，所以如果希望在多协程中并发访问map，必须提供某种同步机制，一般情况下通过读写锁sync.RWMutex实现对map的并发访问控制，将map和sync.RWMutex封装一下，可以实现对map的安全并发访问。示例中，如果注释掉加锁和解锁的代码，运行时就会出现并发访问map错误。

### 2 结构体转换成json字符串时忽略字段

```go
package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    Name string
    Age  int
    Addr string `json:"-"`
    // addr string
}

func main() {
    jsonStr, _ := json.Marshal(User{"user1", 12, "addr"})
    fmt.Printf("%s\n", jsonStr)
}

/*
{"Name":"user1","Age":12}
*/
```

将结构体转换成json字符串时，如果想隐藏某些字段，可以通过在该字段后面添加`json:"-"`实现，添加该字段后，转换成json字符串时会忽略该字段。当然，你也可以通过将该字段首字母改成小写实现，只是这样的话该字段对其他模块也隐藏了，两种方法各有利弊，权衡使用。


### 3 判断2个结构体相等

```go
package main

import (
    "fmt"
    "reflect"
)

type User struct {
    Name string
    Age  int
    Addr string
}

func NewUser(name string, age int) User {
    u := User{}
    u.Name = name
    u.Age = age
    return u
}

func main() {
    u1 := NewUser("user1", 12)
    u2 := NewUser("user1", 12)
    fmt.Println(reflect.DeepEqual(u1, u2))
    fmt.Println(reflect.DeepEqual([]int{1, 2}, []int{1, 2}))
    fmt.Println(reflect.DeepEqual([2]int{1, 2}, [2]int{1, 2}))
    fmt.Println(reflect.DeepEqual(map[int]int{1: 1, 2: 2}, map[int]int{1: 1, 2: 2}))
}

/*
true
true
true
true
*/
```

在使用go语言过程中，有时需要比较2个结构体是否“相等”，即结构体字段和字段值都相同。如果自己实现比较函数，当结构体字段多时比较麻烦。通过使用[reflect.DeepEqual](https://golang.org/pkg/reflect/#DeepEqual)可以实现判断2个结构体是否相等，但会有一定的性能影响。另外，reflect.DeepEqual不但可以比较结构体，像切片、数组和字典等都可以比较。

