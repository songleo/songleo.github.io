---
layout: post
title: go从已知列表中查找字符串
date: 2016-05-01 21:20:32
---

最近在开发中遇到一个需求，需要查找某个给定的字符串是否属于有效字符串。例如以下字符串都是有效字符串：

    "key1" "key2" "key3" "key4" "key5" "key6"

若查找的字符串是key1，存在key1，所以key1是有效字符串，若查找的字符串是key0，不存在key0，所以key0是无效字符串。

我通过4种方式实现，分别如下：

## 方式一：使用map

将有效的字符串定义成map的key，value都是true，如下：

```go
var validKeyMap = map[string]bool{
    "key1": true,
    "key2": true,
    "key3": true,
    "key4": true,
    "key5": true,
    "key6": true,
}
```

使用map的特性查找某个键是的值，如下：

```go
key := "key1"
if validKeyMap[key] {
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

## 方式三：使用sort库

借助sort库，先将切片排序，然后通过调用SearchStrings查找目标字符串：

```go
sort.Strings(validKeyList)
index := sort.SearchStrings(validKeyList, key)
found = (index < len(validKeyList) && validKeyList[index] == key)

if found {
    fmt.Println("found via sort lib")
} else {
    fmt.Println("not found via sort lib")
}
```


## 方式四：使用switch

使用switch语句的特性，遍历所有字符串查找，如下：

```go
key := "key1"

switch key {

    case "key1":
        fallthrough

    case "key2":
        fallthrough

    case "key3":
        fallthrough

    case "key4":
        fallthrough

    case "key5":
        fallthrough

    case "key6":
        fmt.Println("found via switch")
    default:
        fmt.Println("not found via switch")
    }
```

## 总结

方式一由于定义一个map，内存相对其他方式有一定的开销，但是该方式查找效率最高，时间复杂度为常数O(1)，所以一般推荐使用；

方式二由于需要遍历所有字符串，时间复杂度是O(N)，N是切片的长度，随着长度增大，查找时间越长，但是相比方式四，代码少了很多，谨记代码越少出错概率越小，要想软件没有bug，唯一的方法就是不写代码；

方式三通过使用go标准库sort，将切片先排序后，使用二分法查找目标字符串，算法复杂读相对方式二和方式四较好，为O(logN)，N为切片长度，可读性较好，比方式二更优，但会改变原切片元素顺序，若对元素顺序敏感慎用；

方式四借助switch语句特性，时间复杂度不定。若查找的字符串是key1，则时间复杂度O(1)，但是若查找的字符串是最后一个字符串时，时间复杂度和方式二一样，都是O(N)，N表示字符串个数，但是该方式没有没有使用任何数据结构，如果对内存开销要求高，可以推荐使用。

### 附上完整代码

```go
package main

import (
    "fmt"
    "sort"
)

func main() {

    var validKeyList = []string{
        "key1",
        "key2",
        "key3",
        "key4",
        "key5",
        "key6",
    }

    var validKeyMap = map[string]bool{
        "key1": true,
        "key2": true,
        "key3": true,
        "key4": true,
        "key5": true,
        "key6": true,
    }

    key := "key1"
    if validKeyMap[key] {
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

    sort.Strings(validKeyList)
    index := sort.SearchStrings(validKeyList, key)
    found = (index < len(validKeyList) && validKeyList[index] == key)

    if found {
        fmt.Println("found via sort lib")
    } else {
        fmt.Println("not found via sort lib")
    }

    switch key {

    case "key1":
        fallthrough

    case "key2":
        fallthrough

    case "key3":
        fallthrough

    case "key4":
        fallthrough

    case "key5":
        fallthrough

    case "key6":
        fmt.Println("found via switch")
    default:
        fmt.Println("not found via switch")
    }
}
```

### 输出

    found via map
    found via list
    found via sort lib
    found via switch
