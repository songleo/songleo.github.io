## 和上游同步

git remote add upstream __FORK_URL__
git fetch upstream
git checkout master
git merge upstream/master

## 删除远程分支

git push origin --delete BRANCH_NAME

## 回滚之之前的某次提交

git reset --hard ID

## 提交一个空commit

$ git commit --allow-empty -m "retest" && git push
