---
layout: post
title: prometheus remote write adapter
date: 2020-06-28 12:12:05
---

## remote write adapter

以下代码是我参考prometheus官方给出的remote write adapter修改的，

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
			fmt.Println(m)

			for _, s := range ts.Samples {
				fmt.Printf("  %f %d\n", s.Value, s.Timestamp)
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
  - url: "http://localhost:1234/receive"
```

完整的prometheus.yml如下：

```
# my global config
global:
  scrape_interval:     90s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
  # scrape_timeout is set to the global default (10s).

# send all data to url
remote_write:
  - url: "http://192.168.1.105:1234/receive"

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'ssli-prometheus'

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.

    static_configs:
    - targets: ['192.168.1.105:9090']

```

## 启动prometheus

启动prometheus和remote write adapter，查看remote write adapter收到的监控数据。

1 启动prometheus


```
$ docker run -d --rm -p 9090:9090 -v /Users/ssli/share/git/k8s_practice/prometheus/remote_write/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
8ff76a4d1ac80a275b755102785cfa6d014b8889b2e28f9d99f8f8a535e2fc1c
$ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                    NAMES
8ff76a4d1ac8        prom/prometheus     "/bin/prometheus --c…"   4 seconds ago       Up 3 seconds        0.0.0.0:9090->9090/tcp   angry_kapitsa

```

输入http://localhost:9090/graph，可以看到prometheus的ui界面。

2 启动remote write adapter

remote write adapter会接收到prometheus发送的监控数据。

```
$ go run remote-write-adapter.go
start remote write http server ...
go_gc_duration_seconds{instance="192.168.1.105:9090", job="ssli-prometheus", quantile="0"}
  0.000012 1593332190824
go_gc_duration_seconds{instance="192.168.1.105:9090", job="ssli-prometheus", quantile="0.25"}
  0.000016 1593332190824
go_gc_duration_seconds{instance="192.168.1.105:9090", job="ssli-prometheus", quantile="0.5"}
  0.000334 1593332190824
go_gc_duration_seconds{instance="192.168.1.105:9090", job="ssli-prometheus", quantile="0.75"}
  0.000361 1593332190824
go_gc_duration_seconds{instance="192.168.1.105:9090", job="ssli-prometheus", quantile="1"}

...
```

##  ref

- https://github.com/prometheus/prometheus/tree/master/documentation/examples/remote_storage/example_write_adapter
- https://raw.githubusercontent.com/prometheus/prometheus/master/documentation/examples/remote_storage/example_write_adapter/server.go
- https://github.com/prometheus/prometheus/blob/master/documentation/examples/prometheus.yml