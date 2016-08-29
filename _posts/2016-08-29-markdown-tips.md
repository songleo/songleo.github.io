---
layout: post
title: markdown学习
date: 2016-08-29 21:51:32
---

最早接触markdown是参与翻译一本开源电子书，在查看别人翻译完的内容时，会发现一些奇怪的字符。比如:

```

## 第一章

- 第一节

`os.Open()`

```

当时很好奇，为什么会使用这些字符，最后在github上查看翻译好的章节时，才知道这是一种标记语言的语法，通过在文档中的某部分加入特殊的字符，用来修饰文档中的文本，这就是markdown，一种轻量级标记语言。

经过一段时间接触以后，发现使用markdown的地方竟然有那么多地方：

- [github](https://github.com/songleo)
- [stackoverflow](http://stackoverflow.com/users/3839487/leo)
- [写博客](http://reborncodinglife.com/)
- 微信公众号编辑文章
- 技术论坛
- 日常记录编辑

在使用markdown一段时间以后，发现markdown的语法也不复杂，常用语法花十几分钟即可掌握，于是花时间总结了下markdown的基本语法，分享给大家。


### 1 加粗

如果希望加粗显示某些内容，可以使用以下语法：

```
**这是粗体**
```

效果如下：

**这是粗体**

### 2 斜体
如果希望斜体显示某些内容，可以使用以下语法：

```
*这是协体*
```

效果如下：

*这是斜体*

### 3 删除

如果希望删除某些内容，可以使用以下语法：

```
~~这是删除~~
```

效果如下：

~~这是删除~~


### 4 下划线

如果希望删除某些内容，可以使用以下语法：

```
++这是下划线++
```

效果如下：

++这是下划线++


### 5 标题

如果希望以标题形式显示某些内容，可以使用以下语法：

```

# 这是一级标题

## 这是二级标题

### 这是三级标题

#### 这是四级标题

```

效果如下：

# 这是一级标题

## 这是二级标题

### 这是三级标题

#### 这是四级标题


### 6 水平线
如果需要分割线，可以使用以下语法：

```

---


```
效果如下：

---

或者使用三个星号`***`也可以，效果如下：

***

### 7 引用

如果需要引用某些内容，可以使用以下语法：

```
> 这是引用
```
效果如下：
> 这是引用

### 8 列表

如果需要以列表形式显示内容，可以使用以下语法：

#### 8.1 无序列表

```
- 这是无序列表1
- 这是无序列表2
- 这是无序列表3
```

#### 8.2 有序列表

```
1. 这是有序列表1
2. 这是有序列表2
3. 这是有序列表3
```

效果分别如下：

- 这是无序列表1
- 这是无序列表2
- 这是无序列表3


1. 这是有序列表1
2. 这是有序列表2
3. 这是有序列表3

### 9 待办事项

如果希望标记某些待办事项，可以使用以下语法：

```
- [ ] 这是未完成的事项1
- [ ] 这是未完成的事项2
- [x] 这是已完成事项1
- [x] 这是已完成事项2
```

效果如下：

- [ ] 这是未完成的事项1
- [ ] 这是未完成的事项2
- [x] 这是已完成事项1
- [x] 这是已完成事项2

### 10 插入链接

如果需要插入链接，可以使用以下语法：

```
[这是链接](http://note.youdao.com/)
```
效果如下：

[这是链接](http://note.youdao.com/)

### 11 插入图片

如果需要插入图片,需要给出图片的链接，然后可以使用以下语法：

```
![image](https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Markdown-mark.svg/208px-Markdown-mark.svg.png)
```

效果如下：

![image](https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Markdown-mark.svg/208px-Markdown-mark.svg.png)

### 12 插入代码

如果需要插入代码，可以使用以下语法：

    ```
    package main

    import "fmt"

    func main() {
        fmt.Println("Hello, World!")
    }
    ```

效果如下：

```
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
```

### 13 插入表格

如果需要插入表格，可以使用以下语法：

    ```
    header 1 | header 2
    ---|---
    row 1 col 1 | row 1 col 2
    row 2 col 1 | row 2 col 2

    ```

效果如下：

header 1 | header 2
---|---
row 1 col 1 | row 1 col 2
row 2 col 1 | row 2 col 2

### 14 插入数学公式

如果需要插入数学公式，可以使用以下语法：


    ```math
    E = mc^2
    ```


效果如下：

```math
E = mc^2
```

### 15 插入流程图

如果需要插入流程图，可以使用以下语法：

    ```
    graph LR
    A-->B
    B-->C
    B-->D
    ```

效果如下：

```
graph LR
A-->B
B-->C
B-->D

```

### 16 插入序列图

如果需要插入序列图，可以使用以下语法：

    ```
    sequenceDiagram
    Client->>Server: How are you?
    Server->>Client: Great!
    ```

效果如下：

```
sequenceDiagram
Client->>Server: Request
Server->>Client: Respose
```

### 17 插入甘特图

如果需要插入甘特图，可以使用以下语法：


    ```
    gantt
    dateFormat YYYY-MM-DD
    section S1
    T1: 2014-01-01, 9d
    section S2
    T2: 2014-01-11, 9d
    section S3
    T3: 2014-01-02, 9d
    ```

效果如下：

```
gantt
dateFormat YYYY-MM-DD
section S1
T1: 2014-01-01, 9d
section S2
T2: 2014-01-11, 9d
section S3
T3: 2014-01-02, 9d
```

### 总结

其实，工作中使用markdown时，我很少使用它的画图功能，画图我还是习惯使用Visio，更多的是使用一些修饰标记符号，如标题、加粗、引用、插入代码等功能，对于markdown的编辑工具选择，我一般是使用sublime+有道云笔记。经常是在sublime编辑好后，复制到有道云笔记看效果，sublime虽然借助插件也可以预览markdown文本，但效果不是很佳，使用sublime是因为写代码就使用它，已经习惯它的各种快捷键和编辑方式。尤其多行编辑，实在太方便了。有时间给大家分享sublime的一些使用心得和插件，本次分享就到这了。

