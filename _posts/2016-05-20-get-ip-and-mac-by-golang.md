---
layout: post
title: go获取机器的mac地址和ip
date: 2016-05-20 23:44:32
---

开发中常需要获取机器的mac地址或者ip，本文通过go获取机器上所有mac地址和ip，详细代码如下：

```go
package main

import (
    "fmt"
    "net"
)

func getMacAddrs() (macAddrs []string) {
    netInterfaces, err := net.Interfaces()
    if err != nil {
        fmt.Printf("fail to get net interfaces: %v", err)
        return macAddrs
    }

    for _, netInterface := range netInterfaces {
        macAddr := netInterface.HardwareAddr.String()
        if len(macAddr) == 0 {
            continue
        }

        macAddrs = append(macAddrs, macAddr)
    }
    return macAddrs
}

func getIPs() (ips []string) {

    interfaceAddr, err := net.InterfaceAddrs()
    if err != nil {
        fmt.Printf("fail to get net interface addrs: %v", err)
        return ips
    }

    for _, address := range interfaceAddr {
        ipNet, isValidIpNet := address.(*net.IPNet)
        if isValidIpNet && !ipNet.IP.IsLoopback() {
            if ipNet.IP.To4() != nil {
                ips = append(ips, ipNet.IP.String())
            }
        }
    }
    return ips
}

func main() {
    fmt.Printf("mac addrs: %q\n", getMacAddrs())
    fmt.Printf("ips: %q\n", getIPs())
}
```

## 输出：

### linux

    mac addrs: ["08:00:27:88:0f:fd" "08:00:27:0b:06:54" "56:84:7a:fe:97:99"]
    ips: ["192.168.1.104" "192.168.56.101" "172.17.42.1"]

### windows

    mac addrs: ["00:e0:66:07:5c:97:00:00" "08:00:27:00:d8:94:00:00"]
    ips: ["192.168.1.101" "169.254.167.46"]

**特别指出**：go语言在获取机器的mac地址和ip时，windows和linux输出格式不一样，比如windows获取的mac地址是8个字节，而linux获取的mac是6个字节，ip异同可以参考这篇博客[go获取windows的hostid](http://reborncodinglife.com/2016/05/19/get-hostid-from-windows/)，所以不同平台需做不同处理。