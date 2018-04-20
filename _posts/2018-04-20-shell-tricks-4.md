---
layout: post
title: shell技巧分享（四）
date: 2018-04-20 00:05:00
---

这是一个系列文章，主要分享shell（部分功能仅适用于bash）的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 常用快捷键

- Alt+Backspace：删除光标前的一个单词
- Alt+F：移动光标到下一个空格处
- Alt+B：移动光标到上一个空格后第一个字符处
- Ctrl+R：搜索执行过的命令行
- Ctrl+U：删除光标之前所有字符
- Ctrl+K：删除光标之后的所有字符
- Ctrl+A：移动光标到行首
- Ctrl+E：移动光标到行尾

这8个快捷键在命令行操作时会经常用到，如果你没有使用过，多用几次就习惯了，另外，多记住几个快捷键没什么坏处。

### 2 bash调试模式

示例脚本：

```bash
#!/bin/bash -x

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo script dir is "<$script_dir>"
```

运行脚本：

```bash
$ ./get_cur_dir.sh
+++ dirname ./get_cur_dir.sh
++ cd .
++ pwd
+ script_dir=/media/sf_share/git/bash_practice
+ echo script dir is '</media/sf_share/git/bash_practice>'
script dir is </media/sf_share/git/bash_practice>
```

通过在脚本顶部添加-x选项，当运行脚本时会打印出了每一行命令，输出的+号个数表示命令的嵌套层数。从示例中可以，添加-x选项后，执行该脚本输出可以清楚看到每条命令执行的情况，方便调试脚本。如果去掉-x选项，运行脚本的只会打印：script dir is </media/sf_share/git/bash_practice>

### 3 获取脚本所在目录

示例脚本：

```bash
#!/bin/bash

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo script dir is "<$script_dir>"
```

运行脚本：

```bash
$ . ./get_cur_dir.sh
script dir is </media/sf_share/git/bash_practice>
$ source ./get_cur_dir.sh
script dir is </media/sf_share/git/bash_practice>
$ sh ./get_cur_dir.sh
script dir is </media/sf_share/git/bash_practice>
```

在shell脚本内部，经常需要去获取脚本所在目录。示例中给出的方法，无论使用source、点号或者sh方式运行脚本，都可以正确获取脚本所在目录。
