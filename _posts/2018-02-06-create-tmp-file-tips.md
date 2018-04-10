---
layout: post
title: tempfile.NamedTemporaryFile创建临时文件在windows没有权限打开
date: 2018-02-06 00:05:00
---

记录下来是因为当时谷歌这个问题时发现，网上也有很多人遇到这个问题，我也因为这个问题导致了一个bug，所以告诫自己以后使用API多仔细看看文档。

python的tempfile模块用于创建系统临时文件，是一个很有用的模块。通过tempfile.NamedTemporaryFile，可以轻易的创建临时文件，并返回一个文件对象，文件名可以通过对象的name属性获取，且创建的临时文件会在关闭后自动删除。下面这段python代码创建一个临时文件，并再次打开该临时文件，写入数据，然后再次打开，读取文件，并按行打印文件内容。

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import tempfile


# create tmp file and write it
tmp_file = tempfile.NamedTemporaryFile()
print 'tmp file is {self.name}'.format(self=tmp_file)

with open(tmp_file.name, 'w') as f:
    f.write("line 1\nline 2\nline 3\n")


# user tmp file
with open(tmp_file.name) as f:
    for line in f.readlines():
        print line

```

在linux上运行上面的python代码，会创建一个临时文件，且程序退出后该临时文件会自动删除，输出如下：

```
root@master:demo$ python tmp_file.py
tmp file is /tmp/tmpb3EYGV
line 1

line 2

line 3

```

但是在windows上运行时，提示没有权限，不能打开创建的临时文件，是不是感觉很奇怪。

```
E:\share\git\python_practice\demo>tmp_file.py
tmp file is c:\users\leo\appdata\local\temp\tmphn2kqj
Traceback (most recent call last):
  File "E:\share\git\python_practice\demo\tmp_file.py", line 11, in <module>
    with open(tmp_file.name, 'w') as f:
IOError: [Errno 13] Permission denied: 'c:\\users\\leo\\appdata\\local\\temp\\tm
phn2kqj'

```

查看官方文档，该API解释如下：

```
tempfile.NamedTemporaryFile([mode='w+b'[, bufsize=-1[, suffix=''[, prefix='tmp'[, dir=None[, delete=True]]]]]])
This function operates exactly as TemporaryFile() does, except that the file is guaranteed to have a visible name in the file system (on Unix, the directory entry is not unlinked). That name can be retrieved from the name attribute of the returned file-like object. Whether the name can be used to open the file a second time, while the named temporary file is still open, varies across platforms (it can be so used on Unix; it cannot on Windows NT or later). If delete is true (the default), the file is deleted as soon as it is closed.
The returned object is always a file-like object whose file attribute is the underlying true file object. This file-like object can be used in a with statement, just like a normal file.
New in version 2.3.
New in version 2.6: The delete parameter.
```

注意其中的一句话：

```
Whether the name can be used to open the file a second time, while the named temporary file is still open, varies across platforms (it can be so used on Unix; it cannot on Windows NT or later).
```

大概意思是，当这个临时文件处于打开状态，在unix平台，该名字可以用于再次打开临时文件，但是在windows不能。所以，如果要在windows打开该临时文件，需要将文件关闭，然后再打开，操作完文件后，再调用os.remove删除临时文件。

##### 参考：https://docs.python.org/2/library/tempfile.html