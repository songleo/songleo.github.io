---
layout: post
title: python技巧分享（十五）
date: 2018-08-16 00:12:05
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 lambda函数

```python
#!/usr/bin/env python
# coding=utf8


add = lambda x, y : x + y
print add(1, 2)
# 3

print (lambda x, y: x + y)(2, 3)
# 5
```

lambda主要用于实现匿名函数，定义一些简短的、轻量级的函数，但是牺牲了一定的可读性。由示例中可以看到，这里通过lambda定义了一个add函数，lambda自动实现了return功能，add调用方式和正常的函数一样。另外，lambda定义的函数可以不赋值给任何变量，直接就可以调用。

### 2 子类判断

```python
#!/usr/bin/env python
# coding=utf8


class BaseClass:
    pass


class SubClass(BaseClass):
    pass


class OtherClass:
    pass


print issubclass(SubClass, BaseClass)
# True
print issubclass(OtherClass, BaseClass)
# False
```

通过内置函数issubclass，可以判断一个类是否属于另外一个类的子类。由示例中可以看到，SubClass是BaseClass的子类，而OtherClass不是BaseClass的子类。

### 3 元素统计

```python
#!/usr/bin/env python
# coding=utf8

import collections


l = 'abbcccdddd'
list_counter = collections.Counter(l)
print list_counter
# Counter({'d': 4, 'c': 3, 'b': 2, 'a': 1})
print list_counter.most_common(3)
# [('d', 4), ('c', 3), ('b', 2)]
```

借助collections模块，可以实现一个可迭代对象的计数功能。由示例中可以看到，这里分别计算出了列表l中每个字母出现的次数。通过调用most_common方法，还可以找出出现次数最多的前三个字母。详情请参考：https://docs.python.org/2/library/collections.html
