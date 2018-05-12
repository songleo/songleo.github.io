---
layout: post
title: 广度优先搜索算法（go）
date: 2018-05-12 00:05:00
---

广度优先搜索算法（Breadth First Search，缩写为BFS），又译作宽度优先搜索，或横向优先搜索，是一种图形搜索算法。简单的说，BFS是从根节点开始，沿着树的宽度遍历树的节点。如果所有节点均被访问，则算法中止。

广度优先搜索让你能够找出两样东西之间的最短距离，不过最短距离的含义有很多！使用广度优先搜索可以：

- 编写国际跳棋AI，计算最少走多少步就可获胜；

- 编写拼写检查器，计算最少编辑多少个地方就可将错拼的单词改成正确的单词，如将READED改为READER需要编辑一个地方；

- 根据你的人际关系网络找到关系最近的医生。

本文通过go语言实现广度优先搜索算法，通过该算法从下图中寻找出一个芒果销售商（名字以字母`m`结尾）。

![](./image/bfs_graph.jpg)

算法实现如下：

```go
package main

import "fmt"

func main() {
    graph := createGraph()
    breadthFirstSearch(graph, "you")
}

func personIsSeller(name string) bool {
    return name[len(name)-1] == 'm'
}

func createGraph() map[string][]string {
    graph := make(map[string][]string)
    graph["you"] = []string{"alice", "bob", "claire"}
    graph["bob"] = []string{"anuj", "peggy"}
    graph["alice"] = []string{"peggy"}
    graph["claire"] = []string{"thom", "jonny"}
    graph["anuj"] = []string{}
    graph["peggy"] = []string{}
    graph["thom"] = []string{}
    graph["jonny"] = []string{}
    return graph
}

func breadthFirstSearch(graph map[string][]string, name string) bool {

    searchList := graph[name]
    if len(searchList) == 0 {
        return false
    }

    searched := make(map[string]bool)
    for {
        person := searchList[0]
        searchList = searchList[1:]
        _, found := searched[person]
        if !found {
            if personIsSeller(person) {
                fmt.Println(person + " is a mango seller!")
                return true
            } else {
                searchList = append(searchList, graph[person]...)
                searched[person] = true
            }
        }

        if len(searchList) == 0 {
            break
        }
    }

    return false
}
```

## 参考：

- 《算法图解》
- https://zh.wikipedia.org/wiki/%E5%B9%BF%E5%BA%A6%E4%BC%98%E5%85%88%E6%90%9C%E7%B4%A2