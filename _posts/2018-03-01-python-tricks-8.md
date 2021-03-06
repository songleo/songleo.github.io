---
layout: post
title: python技巧分享（八）
date: 2018-03-01 00:05:00
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 pip安装指定版本号的包

```
$ pip install redis==2.7.4
OK
CLOSED
Collecting redis==2.7.4
Installing collected packages: redis
Successfully installed redis-2.7.4
$ pip uninstall redis
OK
CLOSED
Uninstalling redis-2.7.4:
  /opt/python-2.7.10/lib/python2.7/site-packages/redis-2.7.4.dist-info/DESCRIPTION.rst
  /opt/python-2.7.10/lib/python2.7/site-packages/redis-2.7.4.dist-info/INSTALLER
  /opt/python-2.7.10/lib/python2.7/site-packages/redis-2.7.4.dist-info/METADATA
  /opt/python-2.7.10/lib/python2.7/site-packages/redis-2.7.4.dist-info/RECORD
  /opt/python-2.7.10/lib/python2.7/site-packages/redis-2.7.4.dist-info/WHEEL
  /opt/python-2.7.10/lib/python2.7/site-packages/redis-2.7.4.dist-info/metadata.json
  /opt/python-2.7.10/lib/python2.7/site-packages/redis-2.7.4.dist-info/top_level.txt
  /opt/python-2.7.10/lib/python2.7/site-packages/redis/__init__.py
  /opt/python-2.7.10/lib/python2.7/site-packages/redis/__init__.pyc
  /opt/python-2.7.10/lib/python2.7/site-packages/redis/_compat.py
  /opt/python-2.7.10/lib/python2.7/site-packages/redis/_compat.pyc
  /opt/python-2.7.10/lib/python2.7/site-packages/redis/client.py
  /opt/python-2.7.10/lib/python2.7/site-packages/redis/client.pyc
  /opt/python-2.7.10/lib/python2.7/site-packages/redis/connection.py
  /opt/python-2.7.10/lib/python2.7/site-packages/redis/connection.pyc
  /opt/python-2.7.10/lib/python2.7/site-packages/redis/exceptions.py
  /opt/python-2.7.10/lib/python2.7/site-packages/redis/exceptions.pyc
  /opt/python-2.7.10/lib/python2.7/site-packages/redis/utils.py
  /opt/python-2.7.10/lib/python2.7/site-packages/redis/utils.pyc
Proceed (y/n)? y
  Successfully uninstalled redis-2.7.4
$ pip install redis==2.7.6
OK
CLOSED
Collecting redis==2.7.6
Installing collected packages: redis
Successfully installed redis-2.7.6
```

未安装redis包时，运行pip install redis -v命令，可以看到所有可用版本的redis包，这里先安装redis-2.7.4，卸载后，再安装redis-2.7.6。

### 2 以脚本形式运行python模块

```
$ python -m timeit -s 'import time' -n 1 'time.sleep(0.88)'
1 loops, best of 3: 881 msec per loop
```

通过python的-m选项，将timeit模块以脚本方式直接运行。这段代码意思是计算time.sleep(0.88)的运行时间，由输出可以看到，运行时间为881毫秒。

### 3 python快速启动一个web服务器

```
root@master:conf$ python -m SimpleHTTPServer 8080
Serving HTTP on 0.0.0.0 port 8080 ...
```

在本机浏览器中输入[http://localhost:8080/](http://localhost:8080/)，会看到命令启动路径下的所有文件及目录，单击文件可以直接下载，很适合用于将目录分享出去，供其他人访问。