---
layout: post
title: Windows平台使用PyInstaller将Python脚本打包成可执行文件
date: 2016-12-02 20:00:32
---

平时工作中，有时候需要将自己写的Python脚本在Windows运行，但是若Windows没有安装Python，那么就不能直接运行Python脚本。本文介绍一种方法，通过PyInstaller工具将Python脚本打包成一个可执行文件，可以直接在Windows运行，不管Windows是否安装Python都可以运行该可执行文件，详细步骤如下：

## 1 安装Python

首先在Windows上先安装Python，这里需要特别指出，如果编译的Python可执行文件要运行在64位系统，那么需要安装对应64位版本Python，否则后面编译时会有错。Windows的Python安装比较简单，直接下载相应的软件包，运行安装即可。下载链接:

>https://www.python.org/downloads/windows/

选择对应的系统版本和Python版本下载即可。由于我系统是64位，所以我选择了Python2.7的最新版本Python-2.7.12。下载后直接运行安装，安装完成后，将Python和pip安装路径添加到系统PATH，就可以直接在命令行执行Python和使用pip安装Python库，执行Python输出如下：

```
C:\Users\Administrator>python
Python 2.7.12 (v2.7.12:d33e0cf91556, Jun 27 2016, 15:24:40) [MSC v.1500 64 bit (
AMD64)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

## 2 下载PyInstaller

PyInstaller是将Python打包成可执行文件的工具，下载后解压即可，链接如下：

> https://pypi.python.org/pypi/PyInstaller

我下载是最新版PyInstaller-3.2.tar.gz。

## 3 需要打包的Python脚本

下面这段代码是要打包的Python脚本，主要功能是检测系统的物理cpu核数、逻辑cpu核数和cpu是否开启超线程功能：

```python
#!/usr/bin/python
# coding:utf8

import psutil

logical_cores = psutil.cpu_count(logical=True)
if logical_cores is None:
    logical_cores = 1

physical_cores = psutil.cpu_count(logical=False)
if physical_cores is None:
    physical_cores = 1

print "logical_cores: %d" % (logical_cores)
print "physical_cores: %d" % (physical_cores)

if logical_cores / physical_cores == 2:
    print "hyper threading: enable"
else:
    print "hyper threading: disable"
```

使用Python运行该脚本，输出如下：

```
E:\share\git\python_practice\demo>python get_cpu_info.py
logical_cores: 2
physical_cores: 2
hyper threading: disable
```

>如果打开超线程，逻辑cpu数是物理cpu数的两倍

一般会提示缺少psutil库，使用pip安装即可，如下：

```
D:\Program Files\PyInstaller-3.2>pip install psutil
```

## 4 使用PyInstaller打包Python脚本

进入PyInstaller目录，将要打包的Python脚本拷贝到PyInstaller目录，这里是get_cpu_info.py，在PyInstaller目录下打开命令行，执行以下命令打包Python脚本：

```
D:\Program Files\PyInstaller-3.2>python pyinstaller.py -F get_cpu_info.py
```

一般会提示缺少pywintypes和pefile库，使用pip安装即可，如下：

```
D:\Program Files\PyInstaller-3.2>pip install pypiwin32
D:\Program Files\PyInstaller-3.2>pip install pefile
```

>注：直接使用pip安装pywintypes会提示找不到该库，因为该库从属于pypiwin32，所以直接安装pypiwin32即可

依次安装缺少的库后，再次执行打包命令。在PyInstaller目录下会生成相应Python脚本名称的目录，进入该目录下的dist目录，就可以找到打包好的可执行文件。例如示例中打包生成的可执行文件在目录D:\Program Files\PyInstaller-3.2\get_cpu_info\dist下，进入该目录，直接运行可执行文件，输出如下：

```
D:\Program Files\PyInstaller-3.2\get_cpu_info\dist>get_cpu_info.exe
logical_cores: 2
physical_cores: 2
hyper threading: disable
```

可以看到，不需要使用Python也可以直接运行。将该可执行文件拷贝到其他Windows7 64位机器也可以直接运行，即使没有安装Python也没问题。

#### 本次荐书：浪潮之巅

![image](https://img13.360buyimg.com/n1/s200x200_jfs/t2989/330/600268845/199619/83eb7938/5760cf7bN08055a66.jpg)

