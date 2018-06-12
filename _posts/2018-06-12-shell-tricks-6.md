---
layout: post
title: shell技巧分享（六）
date: 2018-06-06 00:05:00
---

这是一个系列文章，主要分享shell（部分功能仅适用于bash）的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 从文件中查询特定字符串

- 查询目录下所有文件

```bash
$ grep -R -n "facebook" demo/
demo/python-tips-3.py:24:#     'facebook': 'https://www.facebook.com/',
demo/python-tips-3.py:27:# print url_dict.get('facebook', 'https://www.google.com/')
demo/python-tips-3.py:32:# https://www.facebook.com/
demo/python-tips-3.py:37:# print url_dict['facebook']
demo/python-tips-3.py:43:# https://www.facebook.com/
```

示例中查询demo目录下所有包含字符串facebook的文件，-n选项是为了打印匹配行的行号，-R选项是为了递归查询目录下所有文件。

- 查询指定文件

```bash
$ grep -n "Failed" boot.log
203:[FAILED] Failed to start Ipmievd Daemon.
222:[FAILED] Failed to start LSB: Bring up/down networking.
252:[FAILED] Failed to start Crash recovery kernel arming.
```

示例中查询boot.log文件中是否包含字符串Failed，-n选项是为了打印匹配行的行号。

### 2 查询目录或文件

- 查询目录

```bash
$ find ./python_practice/ -type d -name "*demo*"
./python_practice/demo
./python_practice/fluent_python_demo
```

示例中，查询python_practice目录下，名字包含字符串demo的所有目录。-type d指定查询类型是目录，-name指定名称包含字符串demo，星号（*）是通配符，表示任意字符。

- 查询文件

```bash
$ find ./python_practice/ -type f -name "*tips*"
./python_practice/demo/python-tips-1.py
./python_practice/demo/python-tips-10.py
./python_practice/demo/python-tips-2.py
./python_practice/demo/python-tips-3.py
./python_practice/demo/python-tips-4.py
./python_practice/demo/python-tips-6.py
./python_practice/demo/python-tips-7.py
./python_practice/demo/python-tips-9.py
```

示例中，查询python_practice目录下，名字包含字符串demo的所有文件。-type f指定查询类型是文件，-name指定名称包含字符串tips，星号（*）是通配符，表示任意字符。

### 3 查看机器ip

```bash
$ alias ip='ifconfig | grep -o "[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}" | grep -v -E 255\|127'
$ ip
172.17.0.1
192.168.14.10
192.168.122.1
```

linux一般通过ifconfig命令查看机器ip，但是如果机器有多块网卡，从ifconfig的输出信息中不容易找到所有ip地址。借助alias命令，定义一个新命令ip，可以快速查看机器的ip地址。示例中，-o选项是为了只打印匹配的字符串，-v选项反向匹配，即不匹配指定的字符串，去除包含数字255和127的ip地址，-E选项是为了使用扩展的正则表达式。由示例中可以看到，通过新命令ip查询机器ip地址时，输出信息更易读。或者直接执行hostname -i命令，也可以查看当前机器使用的ip地址，如下：

```bash
$ hostname -i
192.168.14.10
```
