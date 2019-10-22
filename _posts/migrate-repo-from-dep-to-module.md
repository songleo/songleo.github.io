### 初始化module

```
root@ssli-dev:cluster-api-provider-gke$ export GO111MODULE=on
root@ssli-dev:cluster-api-provider-gke$ pwd
/share/git/src/sigs.k8s.io/cluster-api-provider-gke
root@ssli-dev:cluster-api-provider-gke$ go mod init
go: creating new go.mod: module sigs.k8s.io/cluster-api-provider-gke
go: copying requirements from Gopkg.lock
```

### 删除导致错误的pkg (diskv)

```
root@ssli-dev:cluster-api-provider-gke$ go mod tidy -v
go: github.com/peterbourgon/diskv@v0.0.0-20190425080511-0be1b92a6df0: go.mod has post-v0 module path "github.com/peterbourgon/diskv/v3" at revision 0be1b92a6df0
go: error loading module requirements
```

从go.mod中将相应的行删除。


### 查看生成的go.mod文件

```
root@ssli-dev:cluster-api-provider-gke$ pwd
/share/git/src/sigs.k8s.io/cluster-api-provider-gke
root@ssli-dev:cluster-api-provider-gke$ cat go.mod
module sigs.k8s.io/cluster-api-provider-gke

go 1.12

require (
	cloud.google.com/go v0.40.0
	github.com/appscode/jsonpatch v0.0.0-20190108182946-7c0e3b262f30
	github.com/beorn7/perks v1.0.0
	github.com/davecgh/go-spew v1.1.1
	github.com/emicklei/go-restful v2.9.6+incompatible
	github.com/ghodss/yaml v1.0.0
	sigs.k8s.io/yaml v1.1.0
)
```

### 将k8s相关的pkg版本固定

```
replace (
	k8s.io/kube-openapi => k8s.io/kube-openapi v0.0.0-20181109181836-c59034cc13d5
	sigs.k8s.io/yaml => sigs.k8s.io/yaml v1.1.0
)
```

### 执行go mod tidy -v命令

```
root@ssli-dev:cluster-api-provider-gke$ go mod tidy -v
go: downloading k8s.io/apimachinery v0.0.0-20190221213512-86fb29eff628
Fetching https://k8s.io/apimachinery?go-get=1
go: downloading k8s.io/api v0.0.0-20190222213804-5cb15d344471
Fetching https://k8s.io/api?go-get=1
go: downloading k8s.io/client-go v0.0.0-20190228174230-b40b2a5939e4
Fetching https://k8s.io/client-go?go-get=1
go: downloading sigs.k8s.io/cluster-api v0.1.4
Fetching https://sigs.k8s.io/cluster-api?go-get=1
go: downloading sigs.k8s.io/yaml v1.1.0
...
```

### 删除vendor目录并编译

```
root@ssli-dev:cluster-api-provider-gke$ rm -rf vendor && go build
```
