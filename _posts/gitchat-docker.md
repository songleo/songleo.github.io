# docker学习记录

- chroot: 改变进程的根目录，使其不能访问其他目录，达到隔离效果
- namespace：实现资源的隔离，使进程看起来拥有自己的独立资源，一般通过clone/unshare/setns操作namespace
- cgroups：实现资源限制功能

> 一键安装docker: curl -fsSL https://get.docker.com -o get-docker.sh
