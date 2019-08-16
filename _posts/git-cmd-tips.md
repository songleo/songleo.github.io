## 和上游同步

git remote add upstream __FORK_URL__
git fetch upstream
git checkout master
git merge upstream/master

或者

git rebase upstream/master

## 删除远程分支

git push origin --delete BRANCH_NAME

## 回滚之前的某次提交

git reset --hard ID

## 提交一个空commit

$ git commit --allow-empty -m "retest" && git push

## 回退到某次提交并覆盖远端

git reset --hard ID
git push -f

## 修改最近一次提交信息

git commit --amend

## 撤销上次提交

git reset --soft HEAD^

## 撤销上次add

git reset HEAD
