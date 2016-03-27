---
layout: post
title: go常见错误总结
date: 2016-03-26 23:11:32
---

最近为了学习go语言，花了点时间翻译《the way to go》这本书相关章节：

详见：https://github.com/Unknwon/the-way-to-go_ZH_CN

在翻译过程中学习了一些go常见的错误和陷阱，特此总结一下，以便自己在今后使用go时少犯错误。

# 1 误用短声明:=导致变量覆盖

例如，下列代码中remember变量在if语句之外永远都是false，因为if语句中误用了短声明:=。重新定义了一个remember，自动覆盖外面的remember。所以在if语句中操作的remember变量和外面定义的remember不是同一个变量，导致remember在if语句之外一直都是false。

```go
var remember bool = false
if something {
    remember := true
}
```

正确写法应该是：

```go
var remember bool = false
if something {
    remember = true 
}
```

# 2 误用字符串操作导致大量的内存开销

go语言中字符串也是不可变的，比如当连接2个字符串：a+=b，尤其在一个循环中进行类似操作时，因为源字符串不可变，会导致大量的内存拷贝，造成内存开销过大。所以一般使用一个字符数组代替字符串，将字符串内容写入一个缓存中，代码如下：

```go
var b bytes.Buffer
...
for condition {
    b.WriteString(str) // 将字符串str写入缓存buffer
}
    return b.String()
```

# 3 误用defer关闭文件

如果在一个for循环内部处理一系列文件，我们希望使用defer确保文件处理完毕后能自动被关闭。代码如下：

```go
for_, file:=range files {
    if f, err = os.Open(file); err != nil {
        return
    }
    defer f.Close()
    f.Process(data)
}
```

但是，defer在循环结束后没有被执行，所以文件一直没有被关闭。因为defer仅在函数返回时才能自动执行。所以正确的写法应该是：

```go
for_, file:=range files {
    if f, err = os.Open(file); err != nil {
        return
    }
    f.Process(data)
    f.Close()
 }
 ```

# 4 误用new和make

例如错误的使用new初始化一个map，错误使用make创建一个数组等。new和make的使用场景如下：

- 切片、映射和通道，使用make

- 数组、结构体和所有的值类型，使用new 

# 5 误用指向切片的指针

在go语言中，切片实际是一个指向数组的指针。所以当我们需要将切片作为一个参数传递给函数时，实际就是传递了一个指针变量，并且在函数内部可以改变该变量，而不是传递一个值拷贝，所以当切片作为参数传递是，不需要解引用切片，即：

- 正确的做法：

    `func findBiggest( listOfNumbers []int ) int {}`

- 错误的做法：

    `func findBiggest( listOfNumbers *[]int ) int {}`

# 6 误用指针指向一个接口类型

例如以下代码，nexter是一个接口类型，并且定义了一个next()方法读取下一字节。函数nextFew将nexter接口作为参数并读取接下来的num个字节，并返回一个切片。但是nextFew2使用一个指向nexter接口类型的指针作为参数传递给函数，编译程序时，系统会给出一个编译错误：n.next undefined (type *nexter has no field or method next) 。所以切记不要使用一个指针指向接口类型。

```go
package main
import (
    “fmt”
)
type nexter interface {
    next() byte
}
funcnextFew1(nnexter, numint) []byte {
    varb []bytefori:=0; i < num; i++ {
        b[i] = n.next()
    }
    return b
}
funcnextFew2(n *nexter, numint) []byte {
    varb []bytefori:=0; i < num; i++ {
        b[i] = n.next() // 编译错误:n.next未定义（*nexter类型没有next成员或next方法）
    }
    return b
}
funcmain() {
    fmt.Println(“Hello World!”)
}
```

# 7 误用指针传递值类型参数

当为一个自定义类型定义方法时，如果不想让该方法改变接受者的数据，那么接受者是一个值类型，传递的是一个值拷贝，这里看似造成了内存开销，但其实值类型的内存是在栈上分配的，分配速度快且开销不大。但是如果传递一个指针类型，go编译器在很多情况下会认为需要创建一个对象，并将对象存入堆中，导致额外的内存分配。所以，如果想要方法改变接收者的数据，就在接收者的指针类型上定义该方法。否则，就在普通的值类型上定义方法。

# 8 误用协程和通道

如果在一个循环内部使用了协程处理某些事务。当使用break、return或者panic跳出一个循环时，很有可能会导致内存溢出，因为此时协程正在处理某事务而被阻塞。因此在实际代码中，除非此处代码并发执行显得非常重要，才使用协程和通道，否则仅需写一个简单的过程式循环即可。

#参考

《the way to go》英文版
