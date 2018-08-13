---
layout: post
title: python技巧分享（十四）
date: 2018-08-13 00:12:05
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 排列组合

```python
#!/usr/bin/env python
# coding=utf8

import itertools

for p in itertools.permutations('ABC', 2):
    print p

'''
('A', 'B')
('A', 'C')
('B', 'A')
('B', 'C')
('C', 'A')
('C', 'B')
'''

for c in itertools.combinations('ABC', 2):
    print c

'''
('A', 'B')
('A', 'C')
('B', 'C')
'''
```



### 2 创建临时文件

示例程序：

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import tempfile


TEMP_FILE = tempfile.NamedTemporaryFile()
print 'temp file name: <{self.name}>\n'.format(self=TEMP_FILE)

with open(TEMP_FILE.name, 'w') as f:
    f.write("line 1\nline 2\nline 3\n")

with open(TEMP_FILE.name) as f:
    for line in f.readlines():
        print line
```

运行示例：

```bash
$ python tmp_file_demo.py 
temp file name: </tmp/tmpVSppeA>

line 1

line 2

line 3

$ ls /tmp/tmpVSppeA
ls: cannot access /tmp/tmpVSppeA: No such file or directory
```



### 3 打印信息到stderr

示例程序：

```python
#!/usr/bin/env python
# coding=utf8

from __future__ import print_function
import sys


def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)


eprint("print to stderr")
print("print to stdout")

'''
print to stderr
print to stdout
'''
```

运行示例：

```bash
$ python print_stderr.py 
print to stderr
print to stdout
$ python print_stderr.py > /tmp/stdout.log
print to stderr
$ python print_stderr.py 2> /tmp/stderr.log
print to stdout
$ python print_stderr.py > /tmp/stdout_and_stderr.log 2>&1
$ cat /tmp/stdout.log
print to stdout
$ cat /tmp/stderr.log
print to stderr
$ cat /tmp/stdout_and_stderr.log
print to stderr
print to stdout
```


