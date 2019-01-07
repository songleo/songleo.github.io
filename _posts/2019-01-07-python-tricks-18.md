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

通过具名元组，可以实现常量的定义。如果你试图修改其中的属性，比如rgb.RED = 3，会发现程序抛出AttributeError异常，即实现了不能修改常量的目的。

### 2 去除list中重复元素

```python
#!/usr/bin/python
# coding=utf-8

repeated_list = [0, 0, 0, 1, 1, 1, 2, 2, 2]
print repeated_list

unique_list = list(set(repeated_list))
print unique_list
```

运行示例代码输出如下：

```
$ ./python-tips-18.py
repeated_list = [0, 0, 0, 1, 1, 1, 2, 2, 2]
unique_list = [0, 1, 2]
```

由示例可以看到，通过借助set的唯一性，将list中重复元素除去，确保每个元素只出现一次。

### 3 函数调用时传递list的拷贝

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

由示例中可以看到，如果传递my_list[:]给mod_list函数，源list不会受到影响，如果直接传递my_list给mod_list函数，mod_list函数对my_list的修改会影响源list，如果不希望修改源list，推荐使用该方式将list传递给函数。
