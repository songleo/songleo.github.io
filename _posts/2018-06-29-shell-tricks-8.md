---
layout: post
title: shell技巧分享（八）
date: 2018-06-29 00:05:00
---

这是一个系列文章，主要分享shell（部分功能仅适用于bash）的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 &&的作用

```bash
$ touch test.log
$ cat test.log && echo ok
ok
$ rm test.log
$ cat test.log && echo ok
cat: test.log: No such file or directory
```

如果命令之间使用&&分隔，相当于逻辑“与”，此时只有前一个命令执行成功，后一个命令才会执行，如果前一个命令执行失败，后一个命令就不执行。由示例中可以看到，当test.log文件存在时，会正常打印ok，但是删除test.log文件后，cat test.log执行失败，不会执行第二条命令，所以不打印ok。

### 2 ||的作用

```bash
$ touch test.log
$ cat test.log || echo ok
$ rm test.log
$ cat test.log || echo ok
cat: test.log: No such file or directory
ok
```

如果命令之间使用\|\|分隔，相当于逻辑“或”，此时只有前一个命令执行失败，后一个命令才会执行，如果前一个命令执行成功，后一个命令就不执行。由示例中可以看到，当test.log文件存在时，不会打印ok，但是删除test.log文件后，cat test.log执行失败，此时会执行第二条命令，所以打印ok，行为和&&相反。

### 3 分号的作用

```bash
$ touch test.log
$ cat test.log;echo ok
ok
$ rm test.log
$ cat test.log;echo ok
cat: test.log: No such file or directory
ok
```

如果命令之间使用分号分隔，那么命令会依次执行，不管分号前的命令是否执行成功，后续命令都会执行。由示例中可以看到，就算将test.log文件删除，也会正常打印ok。

三种符号的作用总结如下：

- cmdA && cmdB：只有cmdA执行成功，才会执行cmdB
- cmdA \|\| cmdB：只有cmdA执行失败，才会执行cmdB
- cmdA ; cmdB：不管cmdA是否执行成功，都会执行cmdB
