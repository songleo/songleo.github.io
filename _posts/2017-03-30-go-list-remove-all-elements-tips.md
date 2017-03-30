---
layout: post
title: go语言坑之list删除所有元素
date: 2017-03-30 21:05:32
---

go提供了一个[list包](https://golang.org/pkg/container/list/)，类似python的list，可以存储任意类型的数据，并提供了相应的API，如下：

```
type Element
    func (e *Element) Next() *Element
    func (e *Element) Prev() *Element
type List
    func New() *List
    func (l *List) Back() *Element
    func (l *List) Front() *Element
    func (l *List) Init() *List
    func (l *List) InsertAfter(v interface{}, mark *Element) *Element
    func (l *List) InsertBefore(v interface{}, mark *Element) *Element
    func (l *List) Len() int
    func (l *List) MoveAfter(e, mark *Element)
    func (l *List) MoveBefore(e, mark *Element)
    func (l *List) MoveToBack(e *Element)
    func (l *List) MoveToFront(e *Element)
    func (l *List) PushBack(v interface{}) *Element
    func (l *List) PushBackList(other *List)
    func (l *List) PushFront(v interface{}) *Element
    func (l *List) PushFrontList(other *List)
    func (l *List) Remove(e *Element) interface{}
```

借助list包提供的API，list用起来确实挺方便，但是在使用过程中，如果不注意就会遇到一些难以发现的坑，导致程序结果不是预想的那样。这里要说的坑是通过for循环遍历list，并删除所有元素时会遇到的问题。例如，下面这个示例程序创建了一个list，并依次将0-3存入，然后通过for循环遍历list删除所有元素：

```
package main

import (
    "container/list"
    "fmt"
)

func main() {

    l := list.New()
    l.PushBack(0)
    l.PushBack(1)
    l.PushBack(2)
    l.PushBack(3)
    fmt.Println("original list:")
    prtList(l)

    fmt.Println("deleted list:")

    for e := l.Front(); e != nil; e = e.Next() {
        l.Remove(e)
    }

    prtList(l)
}

func prtList(l *list.List) {
    for e := l.Front(); e != nil; e = e.Next() {
        fmt.Printf("%v ", e.Value)
    }
    fmt.Printf("\n")
}

```

运行程序输出如下：

```
original list:
0 1 2 3 
deleted list:
1 2 3 
```

从输出可以知道，list中的元素并没有被完全删除，仅删除了第一个元素0，和最初设想不一样，按照go的使用习惯，遍历一个list并删除所有元素写法应该如下：

```
for e := l.Front(); e != nil; e = e.Next() {
    l.Remove(e)
}
```

但是根据上面示例代码的输出，这样删除list所有元素是无效的，那么问题出在哪呢？由for循环的机制可以知道，既然删除了第一个元素，没有删除第二个元素，肯定是第二次循环的条件无效，才导致循环退出，即执行完下面语句后：

```
l.Remove(e)
```

e应该为nil，所以循环退出。在for循环中的l.Remove(e)语句前添加打印语句验证，例如添加如下语句：

```
fmt.Println("delete a element from list")
```

运行程序输出如下：

```
original list:
0 1 2 3 
deleted list:
delete a element from list
1 2 3 
```

可以看到，确实只循环了一次，循环就结束了。即当执行完语句l.Remove(e)后，e等于e.Next()，因为e.Next()为nil，导致e为nil，循环退出。为什么e.Next()会是nil呢？通过查看[go list源码](https://golang.org/src/container/list/list.go?s=2989:3034#L111)，如下所示：

```
// remove removes e from its list, decrements l.len, and returns e.
func (l *List) remove(e *Element) *Element {
    e.prev.next = e.next
    e.next.prev = e.prev
    e.next = nil // avoid memory leaks
    e.prev = nil // avoid memory leaks
    e.list = nil
    l.len--
    return e
}

// Remove removes e from l if e is an element of list l.
// It returns the element value e.Value.
func (l *List) Remove(e *Element) interface{} {
    if e.list == l {
        // if e.list == l, l must have been initialized when e was inserted
        // in l or l == nil (e is a zero Element) and l.remove will crash
        l.remove(e)
    }
    return e.Value
}
```

由源码中可以看到，当执行l.Remove(e)时，会在内部调用l.remove(e)方法删除元素e，为了避免内存泄漏，会将e.next和e.prev赋值为nil，这就是问题根源。

修正程序如下：

```
package main

import (
    "container/list"
    "fmt"
)

func main() {

    l := list.New()
    l.PushBack(0)
    l.PushBack(1)
    l.PushBack(2)
    l.PushBack(3)
    fmt.Println("original list:")
    prtList(l)

    fmt.Println("deleted list:")
    var next *list.Element
    for e := l.Front(); e != nil; e = next {
        next = e.Next()
        l.Remove(e)
    }

    prtList(l)
}

func prtList(l *list.List) {
    for e := l.Front(); e != nil; e = e.Next() {
        fmt.Printf("%v ", e.Value)
    }
    fmt.Printf("\n")
}
```

运行程序输出如下：

```
original list:
0 1 2 3 
deleted list:

```

可以看见，list中的所有元素已经被正确删除。


##### 本次荐书：简单的逻辑学

![简单的逻辑学](https://img11.360buyimg.com/n7/g13/M00/02/0C/rBEhVFHH3pQIAAAAAAKTTiqtzRgAAAdwQPlQ0wAApNm358.jpg)

