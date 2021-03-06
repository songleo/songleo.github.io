---
layout: post
title: python技巧分享（十七）
date: 2019-01-05 00:12:05
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 获取文件绝对路径

```python
#!/usr/bin/python
# coding=utf-8

import os

absolute_path = os.path.realpath(__file__)
print absolute_path
```

运行示例代码输出如下：

```
$ ./python-tips-17.py
/git/python_practice/demo/python-tips-17.py
```

由示例中可以看到，输出文件的绝对路径。


### 2 修改进程名字

```python
#!/usr/bin/python
# coding=utf-8

import time
import setproctitle
import multiprocessing


def test_process():
    p = multiprocessing.current_process()
    setproctitle.setproctitle(p.name)
    print 'starting process name <{}>, pid <{}>'.format(p.name, p.pid)
    time.sleep(100)


if __name__ == '__main__':
    p = multiprocessing.Process(
        name='test_process',
        target=test_process,
    )
    p.daemon = False
    p.start()
    time.sleep(100)
```

运行示例代码输出如下：

```
$ ./python-tips-17.py
starting process name <test_process>, pid <4281>
```

在另外一个终端查看进程名为test_process，如下：

```
$ ps -ef | grep [4]281
root      4281  4280  0 17:04 pts/20   00:00:00 test_process
```

如果注释掉setproctitle.setproctitle(p.name)，运行示例如下：

```
$ ./python-tips-17.py
starting process name <test_process>, pid <4700>
```

在另一个终端查看进程名字，可以看到进程名字是/usr/bin/python ./python-tips-17.py，而不是设置的test_process。

```
$ ps -ef | grep [4]700
root      4700  4699  0 17:06 pts/20   00:00:00 /usr/bin/python ./python-tips-17.py
```

即通过setproctitle.setproctitle(p.name)实现了修改python进程的名字。

### 3 多行字符串写法

```python
#!/usr/bin/python
# coding=utf-8

long_str = ('this is a '
            'very long '
            'string')

print long_str
```

运行示例代码输出如下：

```
$ ./python-tips-17.py
this is a very long string
```

pep8建议代码长度不超过79个字符，如果需要写一个长字符串，往往会超过79个字符。由示例中可以看到，通过该方式可以实现长字符串的书写，并且不违反pep8。