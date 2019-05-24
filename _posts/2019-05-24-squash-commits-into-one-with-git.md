---
layout: post
title: git将多次提交合并
date: 2019-05-16 00:12:05
---

执行git log查看提交记录：

```
$ git log
commit 9238096b62d5d2f8f02d88b3c019756aa3087cf9 (HEAD -> master, origin/master, origin/HEAD)
Author: xxx
Date:   Tue Apr 2 08:06:35 2019 +0800

    auto commit

commit 0865d59799337716d3cc6f74efae0a1c3cb101db
Author: xxx
Date:   Wed Mar 20 15:51:54 2019 +0800

    auto commit

commit 72dae88a2dcc059ba64b1978822f03adeee586ad
Author: xxx
Date:   Wed Mar 13 10:30:42 2019 +0800

    auto commit

commit eb5eca3677c77d9cfdc49cffd083107d3ba905f2
Author: xxx
Date:   Wed Mar 13 10:23:00 2019 +0800

    auto commit

commit 42325d7ddb78fcc94e2a84e5fb4db1d057707123
Author: xxx
Date:   Tue Mar 5 16:41:01 2019 +0800

    auto commit
```

选择要合并的提交，比如这里合并前4个提交，即：

- 9238096b62d5d2f8f02d88b3c019756aa3087cf9
- 0865d59799337716d3cc6f74efae0a1c3cb101db
- 72dae88a2dcc059ba64b1978822f03adeee586ad
- eb5eca3677c77d9cfdc49cffd083107d3ba905f2

那么使用第5个提交的id，执行以下命令：

```
git rebase -i 42325d7ddb78fcc94e2a84e5fb4db1d057707123
```

按照要求，将除第一个以外的pick修改成s，保存退出：

```
pick eb5eca3 auto commit
s 72dae88 auto commit
s 0865d59 auto commit
s 9238096 auto commit
```

然后修改本次提交的信息，这里将4次的提交信息都合并，使用了第一句作为本次提交信息，保存退出：

```
This is a combination of 4 commits.
# This is the 1st commit message:

# auto commit

# This is the commit message #2:

# auto commit

# This is the commit message #3:

# auto commit

# This is the commit message #4:

# auto commit
```

执行git log查看前4次提交已经合并成一个:

```
$ git log
commit 1e645af54bcb4fd1e8dc7ec4e40e6474cc95fcbd (HEAD -> master)
Author: xxx
Date:   Wed Mar 13 10:23:00 2019 +0800

    This is a combination of 4 commits.

commit 42325d7ddb78fcc94e2a84e5fb4db1d057707123
Author: xxx
Date:   Tue Mar 5 16:41:01 2019 +0800

    auto commit
```

最后执行git push -f强制推送到远程仓库，这里记住不能再pull远程仓库，否则就会被远端的提交信息合并。

放弃本次合并执行以下命令：

```
git rebase --abort
```

再次编辑输入以下命令：

```
git rebase --edit-todo
```

## 参考:
https://segmentfault.com/a/1190000007748862
