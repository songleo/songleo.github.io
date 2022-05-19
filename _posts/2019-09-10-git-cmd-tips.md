---
layout: post
title: git命令tips
date: 2019-09-10 00:12:05
---

- 和上游同步

```
git remote add upstream __FORK_URL__
git fetch upstream
git checkout master
git merge upstream/master

或者

git rebase upstream/master
```

- 删除远程分支

```
git push origin --delete BRANCH_NAME
```

- 基于tag创建分支

```
git branch <new-branch-name> <tag-name>
```

- clone时指定名字

```
git clone url.git new_name
```

- 回滚之前的某次提交

```
git reset --hard ID
```

- 回滚之前的某次提交，保留本地修改

```
git reset ID
```

- 提交一个空commit

```
git commit --allow-empty --signoff -m "rebuild img" && git push
```

- 回退到某次提交并覆盖远端

```
git reset --hard ID
git push -f
```

- 修改最近一次提交信息

```
git commit --amend
```

- 添加signoff

```
git commit --amend --signoff
```

- 撤销上次提交

```
git reset --soft HEAD^
```

- 删除远程分支

```
git push origin --delete br-name
``

- 撤销上次add

```
git reset HEAD
git revert HEAD
```

- 基于别人的pr修改

```
git commit --amend
```

- merge某次提交

```
git cherry-pick ID
```

- 查看修改的文件列表

```
git whatchanged
```

> :) 未完待续......
