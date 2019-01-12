---
layout: post
title: python技巧分享（十八）
date: 2019-01-07 00:12:05
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 通过具名元组实现常量

```python
#!/usr/bin/python
# coding=utf-8

from collections import namedtuple


RGB = namedtuple('RGB', 'RED GREEN BLUE')
rgb = RGB(0, 1, 2)

print rgb.RED
print rgb.GREEN
print rgb.BLUE
# rgb.RED = 3
```

运行示例代码输出如下：

```
$ ./python-tips-18.py
0
1
2
```

通过具名元组，可以实现常量的定义。如果试图修改其中的属性，比如rgb.RED = 3，会发现程序抛出AttributeError异常，即实现了不能修改常量的目的。

### 2 终端打印带颜色字体

```python
#!/usr/bin/python
# coding=utf-8


import termcolor

print termcolor.colored('red line', 'red')
print termcolor.colored('green line and blink', 'green', attrs=['blink'])
termcolor.cprint('red line and white background', 'red', 'on_white')
```

运行示例代码输出如下：

```
$ ./python-tips-18.py
red line
green line and blink
red line and white background
```

该示例需要安装termcolor模块且必须在终端执行。输出的第一行是红色，第二行是绿色且有闪烁效果，第三行是红色字体，白色背景。

### 3 函数调用时传递list的拷浅贝

```python
#!/usr/bin/python
# coding=utf-8


def mod_list(my_list):
    my_list[0] = 1
    my_list[1] = 2


my_list = [0, 1, 2, 3, 4]
print my_list
mod_list(my_list[:])
print my_list

my_list = [0, 1, 2, 3, 4]
print my_list
mod_list(my_list)
print my_list
```

运行示例代码输出如下：

```
$ ./python-tips-18.py
[0, 1, 2, 3, 4]
[0, 1, 2, 3, 4]
[0, 1, 2, 3, 4]
[1, 2, 2, 3, 4]
```

由示例中可以看到，传递my_list[:]给mod_list函数，源list不会受到影响，直接传递my_list给mod_list函数，mod_list函数对my_list的修改会影响源list。如果不希望修改源list，推荐使用该方式将list传递给函数。需要特别指出，这里实际还是传递一个list浅拷贝，如果list中还有list，通过该方式传递list还是会修改源list。

