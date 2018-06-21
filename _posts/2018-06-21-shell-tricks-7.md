---
layout: post
title: shell技巧分享（七）
date: 2018-06-21 00:05:00
---

这是一个系列文章，主要分享shell（部分功能仅适用于bash）的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 echo替换字符串

```bash
$ str="12121212"
$ echo ${str/1/a}
a2121212
$ echo ${str//1/a}
a2a2a2a2
```

在命令行将某些字符串替换成其他字符串，可以借助echo实现该功能。由示例中可以看到，使用一个斜杠（/）只替换首次出现的字符，使用2个斜杠（/）替换所有字符。

### 2 备份文件

lbak函数定义：

```bash
lbak(){
    if [[ $# -ge 1 ]]; then
        cp -rf $1 $1.bak
    fi
}
```

示例：

```bash
$ ls
$ touch test
$ echo 123 > test
$ cat test 
123
$ lbak test 
$ ls
test  test.bak
$ cat test.bak 
123
```

在linux上修改某些关键文件时，建议先将原文件备份再修改，不然修改后出问题，想恢复比较不易。通过定义一个lbak函数，自动实现文件备份，生成后缀名为bak的文件。由示例中可以看到，创建的test文件，在修改之前，通过lbak命令备份该文件，备份后会在当前目录自动生成一个test.bak文件，如果修改完文件test后，需要恢复该文件，直接将test.bak覆盖test文件即可，所以也可以定义一个lunbak函数，用于自动将备份文件恢复。

### 3 命令行子命令自动补齐

```bash
$ cat demo.bash 
_demo()
{
    COMPREPLY=()
    local cur=${COMP_WORDS[COMP_CWORD]};
    local cmd=${COMP_WORDS[COMP_CWORD-1]};
    case $cmd in

    'demo')
          COMPREPLY=( $(compgen -W 'foo bar help version' -- $cur) ) ;;
    '*')
          ;;
    esac
}

complete -F _demo demo
$ source demo.bash 
$ demo 
bar      foo      help     version  
```

linux的自动补齐功能非常强大，通过其提供的框架，可以给自己的命令行添加自动补齐功能。由示例中可以看到，首先创建一个demo.bash的shell脚本，该脚本需具有可执行权限，然后在当前终端source该脚本。此时，如果执行demo命令，按tab键会自动打印出相应的子命令，如果输入子命令的首字母按tab键，会自动补齐子命令，很方便就能实现命令的自动补齐功能。
