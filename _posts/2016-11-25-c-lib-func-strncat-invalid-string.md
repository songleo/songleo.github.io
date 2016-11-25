---
layout: post
title: c库函数strncat出现乱字符
date: 2016-11-25 22:09:32
---

最近项目接近尾声，基本都是在fix bug，今天说说一个bug，是由于strncat使用不当函数导致命令行输出有乱字符。虽说只是一个很简单的小问题，但是不弄明白就是大问题。

### 1 strncat声明

```c
char *strncat(char *dest, const char *src, size_t n)

- dest: 目标字符串，需保证其容量能容纳连接后字符串
- src: 源字符串
- n: 追加的字符数，如果超过src大小，只拷贝src所有字符
```

这个函数的主要功能是将src指向的字符串追加到dest指向的字符串，最多追加n个字符，包括最后一个字符串结尾符NUL，最后返回指向dest字符串的指针。

### 2 strncat误用

引起bug的代码大致如下，主要功能是将一个字符串拷贝到一个空的字符数组中。

```c
#include <stdio.h>
#include <string.h>

int main ()
{
   char dest[10];
   strncat(dest, "Hello World!", 100);
   printf("Final destination string: %s\n", dest);
   return (0);
}
```

### 3 代码输出

```c
root@leo:demo# crun strncat.c
Final destination string: Hello World!
root@leo:demo# crun strncat.c
Final destination string: τ:Hello World!
root@leo:demo# crun strncat.c
Final destination string: ᰷Hello World!
```

如果从第一次运行结果来看，看似没有什么问题。但是再运行2次，发现结果有乱字符。

>广告时间: 这里使用的crun是我封装的一个命令，只是为了在终端运行c代码时方便，如果你觉得实用的话拷贝到你的bash配置文件，命令定义如下：

```
crun(){
    gcc $1 -g;
    if [ $? -ne 0 ]; then
        echo "failed build $1"
    else
        ./a.out
        rm -rf ./a.out
    fi
}
```

### 4 出现乱字符的原因

输出有乱字符，是因为dest声明后，没有初始化，其内存空间是一些随机数据。不是一个合法的字符串，所以没有字符串结束符NUL，但是strncat函数在追加字符串时需要知道目的字符串dest的结尾，因为找不到字符串结束符NUL，所以出现未定义行为。

### 5 strncat正确使用

所以正确使用方式是给dest第一个字符赋值为NUL，即字符\0。

```c
#include <stdio.h>
#include <string.h>

int main ()
{
   char dest[10];
   dest[0] = '\0';
   strncat(dest, "Hello World!", 100);
   printf("Final destination string: %s\n", dest);
   return (0);
}
```

### 6 总结

可以看出，如果忽略了c语言中的字符串结束符，会导致很多依赖该结束符的函数发生未定义行为。比如以下函数：

- strlen
- strcat
- strcpy
- strncpy

再强调下c字符串定义：

>字符串是以ASCII字符NUL结尾的字符序列，ASCII字符NUL表示为\0。

所以不要把字符数组和字符串混淆，字符串是一个字符数组，但是该字符数组最后一个字符必须是\0，但是字符数组不一定是字符串。上面说到的bug就是因为混淆了字符数组和字符串定义导致。

#### 本次荐书：代码的未来

![image](https://img11.360buyimg.com/n1/s200x200_jfs/t3460/160/1647393366/63542/6587d1a4/582ddf01Nb78d0a15.jpg)

