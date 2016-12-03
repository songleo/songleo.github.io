---
layout: post
title: c库函数getenv引起的core dumped
date: 2016-09-24 20:21:32
---

最近的项目中使用c作为开发语言，由于我之前学习c仅限于看完了几本相关书籍，除了上学期间和找工作时写的一些c程序以及工作中一些关于c的bug fix，在项目中使用c还是第一次，通过这段时间对c的使用，更能体会到下面这句话的含义：

> 如果没有真正骑过自行车，就算看十本教你学骑自行车的书，最后还是不会骑自行车

其实意思就是学习编程语言，只看书还是不行的(当然不看书也不行)。也正是由于我实践经验少，在使用c库函数getenv()获取系统环境变量时，由于使用不当导致`Segmentation fault (core dumped)`错误。当时想不通为什么如此简单的库函数怎么就会引起`core dumped`呢？感兴趣可以看看，代码如下：

```
#include <stdio.h>
int main ()
{
    char *p = getenv("PATH");
    printf("%s\n", p);
    return 0;
}
```

编译运行如下：

```
root@leo:demo# gcc getenv.c -o getenv && ./getenv
getenv.c: In function ‘main’:
getenv.c:4:12: warning: initialization makes pointer from integer without a cast [enabled by default]
  char *p = getenv("PATH");
            ^
Segmentation fault (core dumped)
```

其实如果仔细看gcc编译时的警告信息，就应该马上知道问题出在什么地方。我偏觉得一个如此简单的程序，有警告也可以忽略，不看也罢。然后我想了好久，就是想不通为啥会导致`core dumped`。于是先man一下这个函数，解释如下：

```
GETENV(3)                                Linux Programmer's Manual                                GETENV(3)

NAME
       getenv, secure_getenv - get an environment variable

SYNOPSIS
       #include <stdlib.h>

       char *getenv(const char *name);

       char *secure_getenv(const char *name);

   Feature Test Macro Requirements for glibc (see feature_test_macros(7)):

       secure_getenv(): _GNU_SOURCE

DESCRIPTION
       The  getenv()  function  searches  the  environment  list to find the environment variable name, and
       returns a pointer to the corresponding value string.

RETURN VALUE
       The  getenv()  function  returns  a  pointer to the value in the environment, or NULL if there is no
       match.
```

通过使用文档，可以了解到getenv()函数主要功能是在系统的环境变量列表中查找参数`name`指定的环境变量。如果找到相应的环境变量，那么返回一个指向该环境变量值的字符串指针。如果没有找到，返回`NULL`。原谅我的智商，看完这个解释我还是没明白为什么我的代码会`core dumped`。直到我打开浏览器，谷歌了一下，然后看到http://stackoverflow.com/上也有人问同样的问题，问题链接如下：

> http://stackoverflow.com/questions/27348009/getenv-segmentation-fault

看完别人的解答，我当时想说牛话，还好忍住了，原来是因为没有添加头文件`#include <stdlib.h>`，我又想，没有添加头文件为什么能编译过。这就是gcc在搞鬼了，因为gcc提供了一些内置函数，如果在代码中没有添加相应函数的头文件，那么gcc会使用内置函数，所以能编译通过。但是由于函数没有提供头文件，即没有声明，默认返回值是`int`型。其实问题就出在这里，因为`getenv()`没有声明，它返回的整数被当成一个地址使用，但是由于这个地址是一个不可访问的地址，所以访问该地址就会导致`core dumped`，到此，问题解决。

正确代码如下：

```
#include <stdio.h>
#include <stdlib.h>
int main ()
{
    char *p = getenv("PATH");
    printf("%s\n", p);
    return 0;
}
```

编译运行如下：

```
root@leo:demo# gcc getenv.c -o getenv && ./getenv
/opt/python-2.7.10/bin:/root/go/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games
```

### 总结

- c函数使用前必须声明，不然默认返回值是int
- 不要忽略编译时的警告信息，有时候bug fix的提示信息就在里面
- 遇到问题一定要搞明白，不然下次还是不明白(这个是同事兼球友祁大神经常说的)
- 学编程实践很重要(大道理大家都懂Orz)

#### 本次荐书：黑客与画家

![image](https://img10.360buyimg.com/n1/jfs/t673/9/1408715732/231177/a7d09775/54ddac23Nde0e51fa.jpg)

