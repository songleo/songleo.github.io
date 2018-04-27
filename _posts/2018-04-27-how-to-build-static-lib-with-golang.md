---
layout: post
title: go语言静态库制作和使用
date: 2018-04-27 22:30:00
---

这里以Windows平台作为示例，Linux平台步骤一样，我的环境如下：

```
>echo %GOPATH%
E:\share\git\go_practice\

>echo %GOROOT%
C:\Go\

>tree /F %GOPATH%\src
卷 work 的文件夹 PATH 列表
卷序列号为 0009-D8C8
E:\SHARE\GIT\GO_PRACTICE\SRC
│  main.go
│
└─demo
        demo.go

```

这是需要引用demo.go的go代码（main.go）：

```go
package main

import "demo"

func main() {
    demo.Demo()
}
```

这是需要编译成静态库的go代码（demo.go）：

```go
package demo

import "fmt"

func Demo() {
    fmt.Println("call demo ...")
}
```

这里的demo.go是在GOPATH\src目录下的一个包，main.go可以直接使用该包，运行main.go如下：

```
>go run main.go
call demo ...
```

现在，需要将demo.go编译成静态库demo.a，不提供demo.go的源代码，让main.go也能正常编译运行，步骤如下：

### 1 编译静态库demo.a

```
>go install demo
```

在命令行运行go install demo命令，会在GOPATH目录生相应的静态库文件demo.a（一般在GOPATH\pkg\windows_amd64目录）。

### 2 编译main.go

进入main.go所在目录，编译main.go。

```
>go tool compile -I E:\share\git\go_practice\pkg\win
dows_amd64 main.go
```

-I选项指定了demo.a所在路径，即E:\share\git\go_practice\pkg\win
dows_amd64目录。

### 3 链接main.o

```
E:\share\git\go_practice\src>go tool link -o main.exe -L E:\share\git\go_practic
e\pkg\windows_amd64 main.o

```

-L选项制定了静态库demo.a所在路径，即E:\share\git\go_practice\pkg\win
dows_amd64目录。

### 4 运行main.exe

```
E:\share\git\go_practice\src>main.exe
call demo ...
```

现在，就算把demo目录删除，再次编译链接main.go，也能正确生成main.exe:

```
>go tool compile -I E:\share\git\go_practice\pkg\win
dows_amd64 main.go

>go tool link -o main.exe -L E:\share\git\go_practic
e\pkg\windows_amd64 main.o

>main.exe
call demo ...
```

但是，如果你删除了静态库demo.a，就不能编译链接main.go了，如下：

```
>go tool compile -I E:\share\git\go_practice\pkg\win
dows_amd64 main.go
main.go:3: can't find import: "demo"
```

这就是go语言静态库的制作和使用方式，下次介绍动态库的制作和使用方式。