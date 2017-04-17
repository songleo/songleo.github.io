---
layout: post
title: 数据结构学习之队列（queue）
date: 2017-04-14 22:35:32
---

最近由于工作原因，需要自己实现一个类似队列的数据结构，所以想写篇文章记录并总结下队列的相关内容，主要有以下4点：

- 1）队列的定义
- 2）队列的举例
- 3）队列的基本操作
- 4）队列的实现（go）

### 1）队列的定义

队列，又称为伫列（queue），是先进先出（FIFO, First-In-First-Out）的线性表。在具体应用中通常用链表或者数组来实现。队列只允许在后端（称为堆尾（rear））进行插入操作，即enqueue，在前端（称为队头（front））进行删除操作，即dequeue。队列的操作方式和栈类似，唯一的区别在于队列只允许新数据在后端进行添加。

### 2）队列的举例

队列在生活中随处可见，例如在车站排队买票，排在最前面的人优先购票，排在最后面的人最后购票，不让其他人插队，符合先进先出的原则。再比如打印机的打印任务也是一个队列，先发送到打印机的任务被优先打印，最后发送的打印任务最后打印。当然，上面举的2个例子不是很严谨，因为难免会有人在排队过程中由于某些原因退出排队，或者发送给打印机的打印任务被删除。

这里插个曲，我们去餐厅吃饭时，如果发现餐厅的餐具摆放是队列方式实现的，即清洗干净的餐具都从最底下加入，每次取干净的餐具都从最上面取，那么可以断定这家餐厅还是很讲卫生的。如果发现餐厅的餐具摆放是栈的方式实现的，那么你得小心了，很可能你这次取的“干净的餐具”已经放了几个星期了。

> 提示：栈是先进后出

### 3）队列的基本操作

队列的基本操作主要有以下4种：

- Enqueue()：往队列中添加一个元素
- Dequeue()：从队列中删除一个元素
- Peek()：返回队列中的第一个元素，但是不删除
- IsEmpty()：检测队列是否为空

### 4）队列的实现（go）

队列的实现一般常用链表或者数组实现，这里使用go的切片实现了一个队列，并提供了相应的API，go的切片类似一个动态数组，会自动扩展容量大小，使用起来很方便。

队列的实现代码如下：

```
package main

import "fmt"

type Queue struct {
    elements []interface{}
    capacity int
    size     int
}

func NewQueue(capacity int) *Queue {
    q := new(Queue)
    q.elements = make([]interface{}, 0, capacity)
    q.capacity = capacity
    q.size = 0
    return q
}

func (q *Queue) Enqueue(elements interface{}) {
    q.elements = append(q.elements, elements)
    q.size++
}

func (q *Queue) Dequeue() interface{} {
    if !q.IsEmpty() {
        front := q.elements[0]
        q.elements = q.elements[1:]
        q.size--
        return front
    }
    return nil
}

func (q *Queue) Peek() interface{} {
    if !q.IsEmpty() {
        return q.elements[0]
    }
    return nil
}

func (q *Queue) IsEmpty() bool {
    return q.size == 0
}

func main() {
    q := NewQueue(10)

    fmt.Println(q.IsEmpty())

    for i := 0; i < 10; i++ {
        q.Enqueue(i)
    }

    fmt.Println(q.elements)
    fmt.Println(q.IsEmpty())
    fmt.Println(q.Peek())

    for i := 0; i < 10; i++ {
        fmt.Println(q.Dequeue())
    }

    fmt.Println(q.elements)
    fmt.Println(q.IsEmpty())
    fmt.Println(q.Peek())
}
```

运行程序输出如下：

```
true
[0 1 2 3 4 5 6 7 8 9]
false
0
0
1
2
3
4
5
6
7
8
9
[]
true
<nil>
```

### 参考

维基百科：https://zh.wikipedia.org/wiki/%E9%98%9F%E5%88%97

##### 本次荐书：好好说话

![好好说话](https://img14.360buyimg.com/n1/s200x200_jfs/t3136/252/5996020304/837203/e83544bf/58981df7Nf0877849.jpg)


