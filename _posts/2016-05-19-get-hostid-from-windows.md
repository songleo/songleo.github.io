---
layout: post
title: go获取windows的hostid
date: 2016-05-19 23:44:32
---

在类unix系统中可以通过hostid命令获取到一个十六进制数，称为hostid，在大多数情况下可以作为该机器的唯一标识符。例如在我的ubuntu系统上执行如下：

    root@leo:demo# hostid
    a8c06701

实际上hostid命令是通过系统调用gethostid()得到hostid，但是gethostid()在获取hostid时先读取系统中的hostid文件获取hostid，如果hostid文件不存在，gethostid()会通过机器名获取ip地址，但是不使用回环地址127.0.0.1，然后将ip地址按一定的规则转换成hostid返回。所以当机器上没有hostid文件时，执行hostid命令结果会不一样，因为ip改变后hostid就随之改变。但是在windows系统中没有hostid的概念，所以如果需要获取windows系统的hostid时，必须通过ip地址转换。

本文将通过go获取到ip地址，然后将ip按下面的规则转换成相应的hostid（linux系统也是通过以下规则转换）：

    a8 c0 67 01
    |  |  |  |___ 1
    |  |  |_____ 103
    |  |_______ 192
    |_________ 168

 如果机器有多个ip，就会存在多个hostid。具体代码如下：

```go
package main

import (
    "fmt"
    "net"
    "runtime"
)

func main() {

    interfaceAddrs, err := net.InterfaceAddrs()
    if err != nil {
        fmt.Println(err)
    }
    for _, interfaceAddr := range interfaceAddrs {
        ipnet, ok := interfaceAddr.(*net.IPNet)
        if ok && !ipnet.IP.IsLoopback() {
            if ipnet.IP.To4() != nil {
                var hostid string
                if runtime.GOOS == "windows" {
                    hostid = fmt.Sprintf(
                        "%.2x%.2x%.2x%.2x",
                        ipnet.IP[1],
                        ipnet.IP[0],
                        ipnet.IP[3],
                        ipnet.IP[2])
                } else {
                    hostid = fmt.Sprintf(
                        "%.2x%.2x%.2x%.2x",
                        ipnet.IP[13],
                        ipnet.IP[12],
                        ipnet.IP[15],
                        ipnet.IP[14])
                }
                fmt.Printf("hostid:%v\n", hostid)
            }
        }
    }
}
```

输出如下（3个IP）：

    hostid:a8c06801
    hostid:a8c06538
    hostid:11ac012a
