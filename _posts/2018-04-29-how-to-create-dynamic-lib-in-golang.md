---
layout: post
title: go语言动态库的编译和使用
date: 2018-04-29 13:06:00
---

本文主要介绍go语言动态库的编译和使用方法，以linux平台为例，windows平台步骤一样，具体环境如下：

```
$ echo $GOPATH
/media/sf_share/git/go_practice
$ echo $GOROOT
/usr/lib/golang/
$ tree $GOPATH/src
/media/sf_share/git/go_practice/src
|-- demo
|   `-- demo.go
`-- main.go

1 directory, 2 files
```

在$GOPATH/src目录，有demo包和使用demo包的应用程序main.go，main.go代码如下：

```go
package main

import "demo"

func main() {
    demo.Demo()
}
```

demo包中的demo.go代码如下：

```go
package demo

import "fmt"

func Demo() {
    fmt.Println("call demo ...")
}
```

由于demo.go是在$GOPATH/src目录下的一个包，main.go在import该包后，可以直接使用，运行main.go：

```
$ go run main.go
call demo ...
```

现在，需要将demo.go编译成动态库libdemo.so，让main.go以动态库方式编译，详细步骤如下：

### 1 将go语言标准库编译成动态库

```
$ go install -buildmode=shared -linkshared  std
```

在命令行运行go install -buildmode=shared -linkshared  std命令，-buildmode指定编译模式为共享模式，-linkshared表示链接动态库，成功编译会在$GOROOT目录下生标准库的动态库文件libstd.so，一般位于$GOROOT/pkg/linux_amd64_dynlink目录：

```
$ cd $GOROOT/pkg/linux_amd64_dynlink
$ ls libstd.so
libstd.so
```


### 2 将demo.go编译成动态库

```
$ go install  -buildmode=shared -linkshared demo
$ cd $GOPATH/pkg
$ ls linux_amd64_dynlink/
demo.a  demo.shlibname  libdemo.so
```

成功编译后会在$GOPATH/pkg目录生成相应的动态库libdemo.so。

### 3 以动态库方式编译main.go

```
$ go build -linkshared main.go
$ ll -h
total 25K
drwxrwx---. 1 root vboxsf 4.0K Apr 28 17:30 ./
drwxrwx---. 1 root vboxsf 4.0K Apr 28 17:22 ../
drwxrwx---. 1 root vboxsf    0 Apr 28 08:37 demo/
-rwxrwx---. 1 root vboxsf  16K Apr 28 17:30 main*
-rwxrwx---. 1 root vboxsf   58 Apr 28 08:37 main.go*
$ ./main
call demo ...
```

示例中可以看到，以动态库方式编译生成的可执行文件大小才16K。如果以静态库方式编译，可执行文件大小为1.5M，如下所示：

```
$ go build main.go
$ ll -h
total 1.5M
drwxrwx---. 1 root vboxsf 4.0K Apr 28 17:32 ./
drwxrwx---. 1 root vboxsf 4.0K Apr 28 17:22 ../
drwxrwx---. 1 root vboxsf    0 Apr 28 08:37 demo/
-rwxrwx---. 1 root vboxsf 1.5M Apr 28 17:32 main*
-rwxrwx---. 1 root vboxsf   58 Apr 28 08:37 main.go*
$ ./main
call demo ...
```

以动态库方式编译时，如果删除动态库libdemo.so或者标准动态库libstd.so，运行main都会由于找不到动态库导致出错，例如删除动态库libdemo.so：

```
$ rm ../pkg/linux_amd64_dynlink/libdemo.so
$ ./main
./main: error while loading shared libraries: libdemo.so: cannot open shared object file: No such file or directory
```

以上就是go语言动态库的编译和使用方法，需要注意的是，其他go程序在使用go动态库时，必须提供动态库的源码，否则会编译失败。例如，这里将demo.go代码删除，再以动态库方式编译main.go时，就会编译失败：

```
$ go install  -buildmode=shared -linkshared demo
$ rm demo/demo.go
$ go build -linkshared main.go
main.go:3:8: no buildable Go source files in /media/sf_share/git/go_practice/src/demo
```

动态库编译方式和静态库不一样，静态库可以不提供源码，直接使用静态库编译，而动态库就不行。

相关文章：

> [go语言静态库的编译和使用](http://reborncodinglife.com/2018/04/27/how-to-create-static-lib-in-golang/)