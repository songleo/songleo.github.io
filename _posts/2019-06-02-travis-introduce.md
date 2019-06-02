---
layout: post
title: travis简介
date: 2019-06-02 00:12:05
---

travis提供的是持续集成服务。只要有新的代码提交，就会自动pull。然后提供一个运行环境，执行测试，完成构建，还能部署到服务器。对一些敏感的信息，提供文字加密后和文件加密功能。

```
code -> build -> integrate -> test -> deliver -> deploy
```

- 前4个阶段叫ci，即持续集成
- 前5个阶段叫cd，即继续发布
- 所有阶段叫cd，即持续部署

需要将travis和github关联。

.travis.yml语法：

- language：指定运行环境
- script：指定运行脚本，设置成true表示不运行，支持多个命令，如果一个命令失败，还会继续执行，但是构建结果是失败，支持&&操作符
- sudo：表示是否需要sudo权限
- install：用来指定安装脚本，支持多个命令，一个命令失败就停止，设置为true表示不需要安装
- go/python/node_js：用于指定特定语言的相关配置，比如版本信息、环境变量
- env：用于指定环境变量，脚本中可以使用这些环境变量，还可以在每个项目的页面中设置相应的环境变量，这些环境变量只有管理员可以看到
- service：用于指定需要依赖的服务
- branches：用于指定需要监听的分支
- before_install：用于install阶段之前执行，比如安装一些依赖，提前准备的环境
- before_script：用于script阶段之前执行
- after_failure：用于script阶段失败时执行
- after_success：用于script阶段成功时执行
- before_deploy：用于deploy步骤之前执行
- after_deploy：用于deploy步骤之后执行
- after_script：用于script阶段之后执行

完整的流程如下：

```
before_install -> install -> before_script -> script ->
after_failure|after_success -> before_deploy -> deploy ->
after_deploy -> after_script
```

常见问题汇总：

1 如果在trvais的配置文件中访问github repo没有权限，需要提供一个token，否则会导致构建失败。
例如git clone时会失败。

ref:

http://www.ruanyifeng.com/blog/2017/12/travis_ci_tutorial.html
https://github.com/nukc/how-to-use-travis-ci
