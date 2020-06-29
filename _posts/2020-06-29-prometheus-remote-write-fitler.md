---
layout: post
title: prometheus remote write filter
date: 2020-06-28 12:12:05
---

## remote write adapter

以下代码是我参考prometheus官方给出的remote write adapter修改的：

```golang
// Copyright 2016 The Prometheus Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

## enable remote write for prometheus

在prometheus的配置文件prometheus.yml中添加以下配置，启用remote write功能。

```
remote_write:
  - url: "http://192.168.1.105:1234/receive"
```

这里仅保留go_info和go_goroutines指标数据，完整的prometheus.yml如下：

```
global:
  scrape_interval:     60s
  evaluation_interval: 15s

remote_write:
  - url: "http://192.168.1.105:1234/receive"
    write_relabel_configs:
        - action: keep
          source_labels:
          - __name__
          regex: go_info|go_goroutines

scrape_configs:
  - job_name: 'ssli-prometheus'
    scrape_interval: 5s
    static_configs:
    - targets: ['192.168.1.105:9090']

```

## 启动prometheus

启动prometheus和remote write adapter，查看remote write adapter收到的监控数据。

1 启动prometheus


```
$ docker run -d --rm -p 9090:9090 -v /Users/ssli/share/git/k8s_practice/prometheus/remote_write/prometheus-remote-write-filter.yml:/etc/prometheus/prometheus.yml prom/prometheus
b4bbb85ae846f533c533c72f16b684e74416e627003c78e0637f4b651ccf1298
$ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                    NAMES
b4bbb85ae846        prom/prometheus     "/bin/prometheus --c…"   4 seconds ago       Up 3 seconds        0.0.0.0:9090->9090/tcp   brave_beaver
```

输入 http://localhost:9090/graph 可以看到prometheus的ui界面。

2 启动remote write adapter

remote write adapter会接收到prometheus发送的监控数据，可以看到每隔5s收到2条指标数据，分别是go_info和go_goroutines。其他指标数据都没有被发送到remote write adapter，实现了发送指定指标数据到remote write adapter的功能。

```
$ go run remote-write-adapter.go
start remote write http server ...
time series data = <go_goroutines{instance="192.168.1.105:9090", job="ssli-prometheus"}> samples.Value = <47.000000> samples.Timestamp = <1593428516> seconds
time series data = <go_info{instance="192.168.1.105:9090", job="ssli-prometheus", version="go1.14.4"}> samples.Value = <1.000000> samples.Timestamp = <1593428516> seconds
time series data = <go_goroutines{instance="192.168.1.105:9090", job="ssli-prometheus"}> samples.Value = <45.000000> samples.Timestamp = <1593428519> seconds
time series data = <go_info{instance="192.168.1.105:9090", job="ssli-prometheus", version="go1.14.4"}> samples.Value = <1.000000> samples.Timestamp = <1593428519> seconds
time series data = <go_goroutines{instance="192.168.1.105:9090", job="ssli-prometheus"}> samples.Value = <47.000000> samples.Timestamp = <1593428522> seconds
time series data = <go_info{instance="192.168.1.105:9090", job="ssli-prometheus", version="go1.14.4"}> samples.Value = <1.000000> samples.Timestamp = <1593428522> seconds

...
```

如果你配置多个job，可以通过一下方式实现只发送指定job的指定指标数据到remote write adapter：

```
global:
  scrape_interval:     60s
  evaluation_interval: 15s

remote_write:
  - url: "http://192.168.1.105:1234/receive"
    write_relabel_configs:
        - action: keep
          source_labels:
          - __name__
          regex: go_info|go_goroutines
        - action: keep
          source_labels:
          - job
          regex: ssli-prometheus

scrape_configs:
  - job_name: 'ssli-prometheus'
    scrape_interval: 5s
    static_configs:
    - targets: ['192.168.1.105:9090']

  - job_name: 'new-job'
    scrape_interval: 5s
    static_configs:
    - targets: ['192.168.1.105:9090']
```

使用以上配置，prometheus只会将ssli-prometheus的go_info和go_goroutines指标数据发送到remote write adapter。而忽略new-job采集的指标数据。

若需要往发送的数据上添加一些自定义的label，可以在write_relabel_configs配置相应的replacement，例如以下配置会在发送的数据中添加owner="ssli"标签数据：

```
global:
  scrape_interval:     60s
  evaluation_interval: 15s

remote_write:
  - url: "http://192.168.1.105:1234/receive"
    write_relabel_configs:
        - replacement: ssli
          source_labels:
          - __name__
          target_label: owner
        - action: keep
          source_labels:
          - __name__
          regex: go_info

scrape_configs:
  - job_name: 'ssli-prometheus'
    scrape_interval: 5s
    static_configs:
    - targets: ['192.168.1.105:9090']
```

remote write adapter收到的数据如下：

```
time series data = <go_info{instance="192.168.1.105:9090", job="ssli-prometheus", owner="ssli", version="go1.14.4"}> samples.Value = <1.000000> samples.Timestamp = <1593429888> seconds
time series data = <go_info{instance="192.168.1.105:9090", job="ssli-prometheus", owner="ssli", version="go1.14.4"}> samples.Value = <1.000000> samples.Timestamp = <1593429893> seconds
time series data = <go_info{instance="192.168.1.105:9090", job="ssli-prometheus", owner="ssli", version="go1.14.4"}> samples.Value = <1.000000> samples.Timestamp = <1593429898> seconds
```

##  ref

- https://prometheus.io/docs/prometheus/latest/configuration/configuration/#remote_write
- https://raw.githubusercontent.com/prometheus/prometheus/master/documentation/examples/remote_storage/example_write_adapter/server.go
