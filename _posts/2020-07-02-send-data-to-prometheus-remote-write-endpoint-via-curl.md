---
layout: post
title: 使用curl命令给prometheus remote write endpoint发送数据
date: 2020-07-02 12:12:05
---

## remote write adapter

以下代码是我参考prometheus官方给出的remote write adapter修改的：

```golang
package main

import (
  "fmt"
  "io/ioutil"
  "log"
  "net/http"

  "github.com/gogo/protobuf/proto"
  "github.com/golang/snappy"
  "github.com/prometheus/common/model"

  "github.com/prometheus/prometheus/prompb"
)

func main() {
  fmt.Println("start remote write http server ...")
  http.HandleFunc("/receive", func(w http.ResponseWriter, r *http.Request) {
    compressed, err := ioutil.ReadAll(r.Body)
    if err != nil {
      http.Error(w, err.Error(), http.StatusInternalServerError)
      return
    }

    reqBuf, err := snappy.Decode(nil, compressed)
    if err != nil {
      http.Error(w, err.Error(), http.StatusBadRequest)
      return
    }

    var req prompb.WriteRequest
    if err := proto.Unmarshal(reqBuf, &req); err != nil {
      http.Error(w, err.Error(), http.StatusBadRequest)
      return
    }

    for _, ts := range req.Timeseries {
      m := make(model.Metric, len(ts.Labels))
      for _, l := range ts.Labels {
        m[model.LabelName(l.Name)] = model.LabelValue(l.Value)
      }
      fmt.Printf("time series data = <%v> ", m)

      for _, s := range ts.Samples {
        fmt.Printf("samples.Value = <%f> samples.Timestamp = <%d> seconds\n", s.Value, s.Timestamp/1000)
      }
    }
  })

  log.Fatal(http.ListenAndServe(":1234", nil))
}

```


## 启动remote write adapter

```
$ go run remote-write-adapter.go
start remote write http server ...

```

## 使用curl命令发送数据

```
$ cat compressed.data | curl -i --data-binary @- -H "Content-Encoding: compress" http://localhost:1234/receive
HTTP/1.1 200 OK
Date: Thu, 02 Jul 2020 06:49:48 GMT
Content-Length: 0

```

compressed.data是经过压缩后的指标数据，具体参考：https://prometheus.io/docs/prometheus/latest/storage/#overview

## remote write adapter收到数据

```
$ grn remote-write-adapter.go
start remote write http server ...
time series data = <go_info{cluster="ssli-test", instance="127.0.0.1:9090", job="prometheus", replica="0", version="go1.13.8"}> samples.Value = <1.000000> samples.Timestamp = <1583412460> seconds

```