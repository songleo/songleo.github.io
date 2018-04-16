---
layout: post
title: shell技巧分享（三）
date: 2018-04-13 23:35:00
---

这是一个系列文章，主要分享shell（部分功能仅适用于bash）的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 交互模式时自动输入

```
$ pip uninstall redis
Uninstalling redis-2.10.6:
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/DESCRIPTION.rst
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/INSTALLER
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/METADATA
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/RECORD
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/WHEEL
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/metadata.json
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/top_level.txt
  /usr/lib/python2.7/site-packages/redis/__init__.py
  /usr/lib/python2.7/site-packages/redis/__init__.pyc
  /usr/lib/python2.7/site-packages/redis/_compat.py
  /usr/lib/python2.7/site-packages/redis/_compat.pyc
  /usr/lib/python2.7/site-packages/redis/client.py
  /usr/lib/python2.7/site-packages/redis/client.pyc
  /usr/lib/python2.7/site-packages/redis/connection.py
  /usr/lib/python2.7/site-packages/redis/connection.pyc
  /usr/lib/python2.7/site-packages/redis/exceptions.py
  /usr/lib/python2.7/site-packages/redis/exceptions.pyc
  /usr/lib/python2.7/site-packages/redis/lock.py
  /usr/lib/python2.7/site-packages/redis/lock.pyc
  /usr/lib/python2.7/site-packages/redis/sentinel.py
  /usr/lib/python2.7/site-packages/redis/sentinel.pyc
  /usr/lib/python2.7/site-packages/redis/utils.py
  /usr/lib/python2.7/site-packages/redis/utils.pyc
Proceed (y/n)? y
  Successfully uninstalled redis-2.10.6
$ pip install redis
Collecting redis
  Using cached redis-2.10.6-py2.py3-none-any.whl
Installing collected packages: redis
Successfully installed redis-2.10.6
$ echo y | pip uninstall redis
Uninstalling redis-2.10.6:
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/DESCRIPTION.rst
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/INSTALLER
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/METADATA
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/RECORD
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/WHEEL
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/metadata.json
  /usr/lib/python2.7/site-packages/redis-2.10.6.dist-info/top_level.txt
  /usr/lib/python2.7/site-packages/redis/__init__.py
  /usr/lib/python2.7/site-packages/redis/__init__.pyc
  /usr/lib/python2.7/site-packages/redis/_compat.py
  /usr/lib/python2.7/site-packages/redis/_compat.pyc
  /usr/lib/python2.7/site-packages/redis/client.py
  /usr/lib/python2.7/site-packages/redis/client.pyc
  /usr/lib/python2.7/site-packages/redis/connection.py
  /usr/lib/python2.7/site-packages/redis/connection.pyc
  /usr/lib/python2.7/site-packages/redis/exceptions.py
  /usr/lib/python2.7/site-packages/redis/exceptions.pyc
  /usr/lib/python2.7/site-packages/redis/lock.py
  /usr/lib/python2.7/site-packages/redis/lock.pyc
  /usr/lib/python2.7/site-packages/redis/sentinel.py
  /usr/lib/python2.7/site-packages/redis/sentinel.pyc
  /usr/lib/python2.7/site-packages/redis/utils.py
  /usr/lib/python2.7/site-packages/redis/utils.pyc
Proceed (y/n)?   Successfully uninstalled redis-2.10.6
```

有时候执行命令会进入交互模式，需要根据输入作出不同响应。如果我们提前知道需要输入的字符没有风险，那么可以通过echo命令将字符直接传递给命令，避免进入交互模式耽搁时间。比如示例中通过pip命令卸载redis包时，就会让用户输入y或者n，然后根据输入进行下一步操作。借助echo命令，可以避免进入交互模式，命令快速执行完毕。再次提醒，前提是你知道输入的字符没有风险，比如不要随便给rm命令echo一个y。

### 2 运行c代码

```
$ cat helloworld.c

#include <stdio.h>

int main ()
{
    printf("hello world!\n");
    return 0;
}
$ gcc helloworld.c -o helloworld
$ ./helloworld
hello world!
$ ls | grep helloworld
helloworld
helloworld.c
$ crn helloworld.c
hello world!
$ ls | grep helloworld
helloworld
helloworld.c
```

定义的crn函数如下：

```bash
crn(){
    gcc $* -g;
    if [ $? -ne 0 ]; then
        echo "failed to build $1"
    else
        ./a.out
        rm -rf ./a.out
    fi
}
```

在linux命令行，要运行一个c程序，需要先编译c代码，然后才能运行该程序。使用go语言运行go代码时，发现go可以直接运行源代码，于是有所启示，我定义一个crn函数，该函数参数是c源代码文件，crn命令会先编译c代码，然后执行编译后的可执行程序，执行完毕后将可执行程序删除，省去了编译环节，更加快速的执行c源程序。例如示例中，执行crn helloworld.c命令就可以运行该c源代码，确实方便不少。

### 3 解压常见格式的压缩包

```bash
ltar(){
if [ -f $1 ]; then
case $1 in
    *.tar.bz2) tar xjf $1;;
    *.tar.gz) tar zxvf  $1;;
    *.bz2) bunzip2 $1 ;;
    *.rar) unrar e $1 ;;
    *.gz) gunzip $1 ;;
    *.tar) tar xf $1 ;;
    *.tbz2) tar xjf $1 ;;
    *.tgz) tar xzf $1 ;;
    *.zip) unzip $1 ;;
    *.Z) uncompress $1 ;;
    *.7z)7z x $1 ;;
    *) echo "'$1' cannot be extracted";;
esac
else
    echo "'$1' is not a valid file"
fi
}
```

```
$ ls
gz_file.tar.gz  tar_file.tar
$ ltar tar_file.tar
$ ltar gz_file.tar.gz
```

日常工作中，经常需要解压不同格式的压缩包，但是压缩格式有很多种，每种压缩格式的解压选项和命令行有可能不一样，要记住那么多解压命令和选项实在不容易。通过定义一个函数ltar，将常见压缩格式文件的解压命令都封装在该函数内部，实现一键解压，例如示例中执行ltar tar_file.tar命令和ltar gz_file.tar.gz命令都能解压相应的压缩文件。

