---
layout: post
title: sublime常用插件
date: 2019-05-26 00:12:05
---

本文主要记录我经常使用的sublime插件，持续更新中。


- auto-save：自动保存修改的问文件

- filediffs：文件diff工具

- sidebarenhancements：边框功能增强，很有用的一个插件

- gitgutter：配合git显示文件被修改后的标识

- golangbuild：sublime的官方go编译

- gotools：go语言工具整合

- golang tools integration：go语言工具整合，自动格式化和调用goimports

安装过程中的问题汇总：

### 1 package control安装

手动下载[Package Control.sublime-package](https://packagecontrol.io/Package%20Control.sublime-package)到本地，打开Preferences -> Browse Packages，找到移本地包安装目录`Installed Packages/`，将下载的文件复制到该目录，重启sublime即可。

### 2 安装插件报错`There are no packages available for installation`

解决办法：

```
Preferences -> Package Settings -> Package Control -> Settings - User
```

添加以下内容：

```
{
"channels":
    [
        "https://packagecontrol.io/channel_v3.json",
        "http://cst.stu.126.net/u/json/cms/channel_v3.json",
        "https://web.archive.org/web/20150905194312/https://packagecontrol.io/channel_v3.json"
    ]
}
```

> 未完待续 ......
