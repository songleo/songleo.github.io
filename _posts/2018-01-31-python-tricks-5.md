---
layout: post
title: python技巧分享（五）
date: 2018-01-31 22:59:00
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 如何在命令行查看python文档

- 推荐方式

```
root@master:~$ pydoc sys.exit
Help on built-in function exit in sys:

sys.exit = exit(...)
    exit([status])

    Exit the interpreter by raising SystemExit(status).
    If the status is omitted or None, it defaults to zero (i.e., success).
    If the status is an integer, it will be used as the system exit status.
    If it is another kind of object, it will be printed and the system
    exit status will be one (i.e., failure).

root@master:~$ pydoc sorted
Help on built-in function sorted in module __builtin__:

sorted(...)
    sorted(iterable, cmp=None, key=None, reverse=False) --> new sorted list
```

第一个命令pydoc sys.exit查看sys模块的exit函数文档信息，第二个命令pydoc sorted查看了内建函数sorted的文档信息。

### 2 如何将python代码打包成独立的二进制文件

- 推荐方式

需要编译的python代码如下：

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

print 'hello, world!'
```

将python代码打包成独立的二进制文件步骤：

```
root@master:demo$ python hello_world.py
hello, world!
root@master:demo$ pip install pyinstaller
root@master:demo$ pyinstaller -F hello_world.py
root@master:demo$ cd ./dist/
root@master:dist$ ./hello_world
hello, world!
```

我解释下上面命令行，首先使用python直接运行需要编译成独立二进制文件的hello_world.py，程序正常打印hello, world!，然后使用pip安装pyinstaller，通过pyinstaller将hello_world.py打包成独立的二进制文件，然后进入当前目录下的dist目录，运行打包成功的二进制文件hello_world，程序正常打印hello, world!。除了pyinstaller，还有其他工具可以实现类似功能，比如[py2exe](http://www.py2exe.org/)和[cx_Freeze](https://anthony-tuininga.github.io/cx_Freeze/)，如果感兴趣，可以看看。

### 3 如何自动格式化python代码

- 推荐方式

格式化前的demo.py代码：

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import math, sys;

def example1():
    ####This is a long comment. This should be wrapped to fit within 72 characters.
    some_tuple=(   1,2, 3,'a'  );
    some_variable={'long':'Long code lines should be wrapped within 79 characters.',
    'other':[math.pi, 100,200,300,9876543210,'This is a long string that goes on'],
    'more':{'inner':'This whole logical line should be wrapped.',some_tuple:[1,
    20,300,40000,500000000,60000000000000000]}}
    return (some_tuple, some_variable)
def example2(): return {'has_key() is deprecated':True}.has_key({'f':2}.has_key(''));
class Example3(   object ):
    def __init__    ( self, bar ):
     #Comments should have a space after the hash.
     if bar : bar+=1;  bar=bar* bar   ; return bar
     else:
                    some_string = """
                       Indentation in multiline strings should not be touched.
Only actual code should be reindented.
"""
                    return (sys.path, some_string)

```

安装autopep8，并使用autopep8格式化demo.py代码：

```
root@master:demo$ pip install autopep8
root@master:demo$ autopep8 --in-place --aggressive --aggressive demo.py
```

格式化后的demo.py代码：

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import math
import sys


def example1():
    # This is a long comment. This should be wrapped to fit within 72
    # characters.
    some_tuple = (1, 2, 3, 'a')
    some_variable = {
        'long': 'Long code lines should be wrapped within 79 characters.',
        'other': [
            math.pi,
            100,
            200,
            300,
            9876543210,
            'This is a long string that goes on'],
        'more': {
            'inner': 'This whole logical line should be wrapped.',
            some_tuple: [
                1,
                20,
                300,
                40000,
                500000000,
                60000000000000000]}}
    return (some_tuple, some_variable)


def example2(): return ('' in {'f': 2}) in {'has_key() is deprecated': True};


class Example3(object):
    def __init__(self, bar):
        # Comments should have a space after the hash.
        if bar:
            bar += 1
            bar = bar * bar
            return bar
        else:
            some_string = """
                       Indentation in multiline strings should not be touched.
Only actual code should be reindented.
"""
            return (sys.path, some_string)

```

可以看到，经过autopep8格式化后的python代码更易读，也符合python的代码风格，这里的示例代码使用autopep8官方例子，详情请戳[https://pypi.python.org/pypi/autopep8](https://pypi.python.org/pypi/autopep8)。
