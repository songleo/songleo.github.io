---
layout: post
title: go技巧分享（三）
date: 2018-05-21 00:05:00
---

这是一个系列文章，主要分享go的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 打印更易读的结构体

```go
package main

import "fmt"

type User struct {
    Name string
    Age  int
    Addr string
}

func main() {
    u := User{"user1", 12, "addr"}
    fmt.Printf("%v\n", u)
    fmt.Printf("%+v\n", u)
    fmt.Printf("%#v\n", u)
}

/*
{user1 12 addr}
{Name:user1 Age:12 Addr:addr}
main.User{Name:"user1", Age:12, Addr:"addr"}
*/
```

由示例中可以看到，这里定义了一个叫User的结构体，结构体中有Name、Age和Addr三个字段，第一种打印方式通过%v，只能看到结构体的字段值，如果字段较多，可读性不是很好。第二种打印方式通过%+v，会打印出结构体的每个字段名和各个字段的值。第三种打印方式使用%#v方式，会打印出结构体的具体类型、字段名称和字段值，方便检查结构的详细信息。所以如果需要在日志中打印具体的结构体信息，可以使用%#v方式。

### 2 简易定时器实现

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    for range time.Tick(3 * time.Second) {
        fmt.Println(time.Now().Format(time.ANSIC))
    }
}
```

```
$ go run timer_demo.go
Mon May 20 14:43:47 2018
Mon May 20 14:43:50 2018
Mon May 20 14:43:53 2018
（省略）
```

通过使用time包中的Tick函数，可以实现一个简单的定时器，配合for循环可以周期性的执行某些操作。由示例中可以看到，执行示例程序，每隔3s会打印当前的系统时间。


### 3 正确的字符串连接方式

```go
package main

import (
    "bytes"
    "fmt"
    "time"
)

func main() {
    totalStrs := 100000
    strList := make([]string, 0, totalStrs)
    for i := 0; i < totalStrs; i++ {
        strList = append(strList, fmt.Sprintf("string %d", i))
    }

    joinStrByAdd(strList)
    joinStrByBuffer(strList)
}

func joinStrByAdd(strList []string) string {
    defer Elapsed(time.Now(), "joinStrByAdd")
    joinStr := ""
    for _, str := range strList {
        joinStr += str
    }
    return joinStr
}

func joinStrByBuffer(strList []string) string {
    defer Elapsed(time.Now(), "joinStrByBuffer")
    var joinStr bytes.Buffer
    for _, str := range strList {
        joinStr.WriteString(str)
    }
    return joinStr.String()
}

func Elapsed(start time.Time, funcName string) {
    fmt.Printf("call %s took %f seconds\n", funcName, time.Since(start).Seconds())
}

/*
call joinStrByAdd took 24.579838 seconds
call joinStrByBuffer took 0.002363 seconds
*/
```

通过bytes.Buffer的缓存机制，在连接大量字符串时，可以大大的提升性能。由示例中可以看到，这里模拟了10万个字符串连接操作，使用传统的加号方式和使用bytes.Buffer方式，性能相差上万倍。其实不止go语言提供了这种缓存机制，大多数语言都有类似方式实现字符串连接。
