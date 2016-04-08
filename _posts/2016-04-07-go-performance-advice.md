---
layout: post
title: go语言性能建议
date: 2016-04-07 21:40:32
---

最近为了学习go语言，花了点时间翻译《the way to go》这本书相关章节：

详见：https://github.com/Unknwon/the-way-to-go_ZH_CN

在翻译过程中学习了一些go语言性能建议，特此总结分享，以后在使用go过程中尽量采用，以提升性能。

## 1 字符串

连接字符串效率最高是使用`bytes.Buffer`，如下:

```go
var buffer bytes.Buffer

for {
    if s, ok := getNextString(); ok { 
        buffer.WriteString(s)
    } else {
        break
    }
}

fmt.Print(buffer.String(), "\n")
```

这种实现方式比使用`+=`要更节省内存和CPU，尤其是要串联的字符串数目特别多的时候。

## 2 通道

使用带缓存的通道可以很轻易成倍提高吞吐量，某些场景其性能可以提高至10倍甚至更多。通过调整通道的容量，甚至可以尝试着更进一步的优化其性能。即尽可能在需要分配大量内存时使用缓存。例如：

```go
buf := 100
ch1 := make(chan string, buf)
```

## 3 使用指针类型作为方法的接受者

当定义一个方法时，使用指针类型作为方法的接受者，传递的是一个指针，如果接受者是一个值类型，传递的是一个值拷贝，会造成内存开销（此处和原书16.7小节有点矛盾，16.7小节建议尽量以值类型作为方法的接受者，详情参考原书16.7小节）。例如：

```go
type TwoInts struct {
    a int
    b int
}

func (tn *TwoInts) AddThem() int {
    return tn.a + tn.b
}
```

## 4 函数内部使用`:=`声明变量

在函数内部尽可能的使用`:=`去初始化声明一个变量，这是使用变量的首选形式，但是它只能被用在函数体内，而不可以用于全局变量的声明与赋值。使用操作符`:=` 可以高效地创建一个新的变量，称之为初始化声明。

## 5 切片

如果只想获取切片中某项值，不需要值的索引，尽可能的使用for range去遍历切片，这比必须查询切片中的每个元素要快一些。例如：

```go
for ix, value := range arr {
    …
}
```

## 6 映射

初始化映射时指定其容量，即尽可能在需要内存时使用缓存。节省内存分配的开销，提高效率。例如：`map2 := make(map[string]float, 100)`

## 7 参考

《the way to go》

