---
layout: post
title: 从一个已知列表中查找某个特定字符串
date: 2016-05-01 21:20:32
---

最近在开发中遇到一个需求，需要查找某个给定的字符串是否属于有效字符串。例如以下字符串都是有效字符串：

    "key1" "key2" "key3" "key4" "key5" "key6"

若查找的字符串是key1，存在key1，所以key1是有效字符串，若查找的字符串是key0，不存在key0，所以key0是无效字符串。

我想了3种方式实现，分别如下：

## 方式一：使用map

将有效的字符串定义成map的key，但是值都为空，如下：

```go
var validKeyMap = map[string]string{
    "key1": "",
    "key2": "",
    "key3": "",
    "key4": "",
    "key5": "",
    "key6": "",
}
```

使用map的特性查找某个键是否存在，如下：

```go
key := "key1"
if _, isPresent := validKeyMap[key]; isPresent {
    fmt.Println("found via map")
} else {
    fmt.Println("not found via map")
}
```



## 方式二：遍历列表

将有效字符串定义成一个切片，如下：

```go
var validKeyList = []string{
    "key1",
    "key2",
    "key3",
    "key4",
    "key5",
    "key6",
}
```

通过遍历切片查找特定字符串，如下：

```go
var found bool
key := "key1"

for index := range validKeyList {
    if validKeyList[index] == key {
        found = true
        break
    }
}

if found {
    fmt.Println("found via list")
} else {
    fmt.Println("not found via list")
}
```

## 方式三：使用switch

使用switch语句的特性，遍历所有字符串查找，如下：

```go
key := "key1"

switch key {
case "key1":
    fmt.Println("found via switch")
case "key2":
    fmt.Println("found via switch")
case "key3":
    fmt.Println("found via switch")
case "key4":
    fmt.Println("found via switch")
case "key5":
    fmt.Println("found via switch")
case "key6":
    fmt.Println("found via switch")
default:
    fmt.Println("not found via switch")
}
```

## 总结

方式一由于定义了一个值都为空字符串的map，可读性不是太好，但是该方式查找效率最高，时间复杂度为常数O(1)，所以一般推荐使用。

方式二由于需要遍历所有字符串，时间复杂度是O(N)，N是切片的长度，随着长度增大，查找时间越长，但是相比方式三，代码少了很多，代码越少出错概率越小。

方式三借助switch语句特性，时间复杂度不定。若查找的字符串是key1，则时间复杂度O(1)，但是若查找的字符串是最后一个字符串时，时间复杂度和方式二一样，都是O(N)，N表示字符串个数，若追求可读性，对查找效率要求不是很高情况下，也可以使用。

### 附上完整代码

```go
package main

import (
    "fmt"
)

var validKeyList = []string{
    "key1",
    "key2",
    "key3",
    "key4",
    "key5",
    "key6",
}

var validKeyMap = map[string]string{
    "key1": "",
    "key2": "",
    "key3": "",
    "key4": "",
    "key5": "",
    "key6": "",
}

func main() {

    key := "key1"
    if _, isPresent := validKeyMap[key]; isPresent {
        fmt.Println("found via map")
    } else {
        fmt.Println("not found via map")
    }

    var found bool
    for index := range validKeyList {

        if validKeyList[index] == key {
            found = true
            break
        }

    }

    if found {
        fmt.Println("found via list")
    } else {
        fmt.Println("not found via list")
    }

    switch key {
    case "key1":
        fmt.Println("found via switch")
    case "key2":
        fmt.Println("found via switch")
    case "key3":
        fmt.Println("found via switch")
    case "key4":
        fmt.Println("found via switch")
    case "key5":
        fmt.Println("found via switch")
    case "key6":
        fmt.Println("found via switch")
    default:
        fmt.Println("not found via switch")
    }
}
```