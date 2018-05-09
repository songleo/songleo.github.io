---
layout: post
title: go语言坑之并发访问map
date: 2017-04-21 20:37:32
---

go提供了一种叫map的数据结构，可以翻译成映射，对应于其他语言的字典、哈希表。借助map，可以定义一个键和值，然后可以从map中获取、设置和删除这个值，尤其适合数据查找的场景。但是map的使用有一定的限制，如果是在单个协程中读写map，那么不会存在什么问题，如果是多个协程并发访问一个map，有可能会导致程序退出，并打印下面错误信息：

```
fatal error: concurrent map read and map write
```

上面的这个错误不是每次都会遇到的，如果并发访问的协程数不大，遇到的可能性就更小了。例如下面的程序：

```go
package main

func main() {
    Map := make(map[int]int)

    for i := 0; i < 10; i++ {
        go writeMap(Map, i, i)
        go readMap(Map, i)
    }

}

func readMap(Map map[int]int, key int) int {
    return Map[key]
}

func writeMap(Map map[int]int, key int, value int) {
    Map[key] = value
}
```

只循环了10次，产生了20个协程并发访问map，程序基本不会出错，但是如果将循环次数变大，比如10万，运行下面程序基本每次都会出错：

```go
package main

func main() {
    Map := make(map[int]int)

    for i := 0; i < 100000; i++ {
        go writeMap(Map, i, i)
        go readMap(Map, i)
    }

}

func readMap(Map map[int]int, key int) int {
    return Map[key]
}

func writeMap(Map map[int]int, key int, value int) {
    Map[key] = value
}

```


[go官方博客](https://blog.golang.org/go-maps-in-action)有如下说明：


> Maps are not safe for concurrent use: it's not defined what happens when you read and write to them simultaneously. If you need to read from and write to a map from concurrently executing goroutines, the accesses must be mediated by some kind of synchronization mechanism. One common way to protect maps is with sync.RWMutex.


[go FAQ](https://golang.org/doc/faq#atomic_maps)解释如下：

> After long discussion it was decided that the typical use of maps did not require safe access from multiple goroutines, and in those cases where it did, the map was probably part of some larger data structure or computation that was already synchronized. Therefore requiring that all map operations grab a mutex would slow down most programs and add safety to few. This was not an easy decision, however, since it means uncontrolled map access can crash the program.

大致意思就是说，并发访问map是不安全的，会出现未定义行为，导致程序退出。所以如果希望在多协程中并发访问map，必须提供某种同步机制，一般情况下通过读写锁sync.RWMutex实现对map的并发访问控制，将map和sync.RWMutex封装一下，可以实现对map的安全并发访问，示例代码如下：

```go
package main

import "sync"

type SafeMap struct {
    sync.RWMutex
    Map map[int]int
}

func main() {
    safeMap := newSafeMap()

    for i := 0; i < 100000; i++ {
        go safeMap.writeMap(i, i)
        go safeMap.readMap(i)
    }

}

func newSafeMap() *SafeMap {
    sm := new(SafeMap)
    sm.Map = make(map[int]int)
    return sm

}

func (sm *SafeMap) readMap(key int) int {
    sm.RLock()
    value := sm.Map[key]
    sm.RUnlock()
    return value
}

func (sm *SafeMap) writeMap(key int, value int) {
    sm.Lock()
    sm.Map[key] = value
    sm.Unlock()
}
```

但是通过读写锁控制map的并发访问时，会导致一定的性能问题，不过能保证程序的安全运行，牺牲点性能问题是可以的。

### 参考

go官方博客：https://blog.golang.org/go-maps-in-action

go FAQ：https://golang.org/doc/faq#atomic_maps

##### 本次荐书：[买个好房子](https://www.amazon.cn/%E4%B9%B0%E4%B8%AA%E5%A5%BD%E6%88%BF%E5%AD%90-%E7%9F%A5%E4%B9%8E%E5%BE%90%E6%96%8C%E4%BD%9C%E5%93%81-%E5%BE%90%E6%96%8C/dp/B01EH0JKFY/ref=sr_1_1?s=digital-text&ie=UTF8&qid=1492779158&sr=1-1)

![买个好房子](https://images-cn.ssl-images-amazon.com/images/I/410CZW0u8OL._AA160_.jpg)

