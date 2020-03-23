---
layout: post
title: 使用grafana访问ocp4.3的prometheus
date: 2020-03-23 12:12:05
---

ocp4.3自带了prometheus和grafana，默认在openshift-monitoring namespace下面，但是用户不能修改openshift-monitoring namespace下的资源，比如你无法修改系统自带的grafana的dashboard。如果你修改了相应的资源，会被集群重置成默认状态。本文介绍如何通过安装自己的grafana访问ocp4.3自带的prometheus数据。

### 安装grafana

先创建相应的project：

```
# oc new-project ssli-monitoring
# oc project ssli-monitoring
```

进入ocp的dashboard，在project ssli-monitoring下安装grafana operator，然后创建grafana实例，在创建grafana实例的yaml中，记住相应的用户名和密码，后面登录grafana使用，创建grafana的yaml如下：

```
apiVersion: integreatly.org/v1alpha1
kind: Grafana
metadata:
  name: ssli-grafana
  namespace: ssli-monitoring
spec:
  ingress:
    enabled: true
  config:
    auth:
      disable_signout_menu: true
    auth.anonymous:
      enabled: true
    log:
      level: warn
      mode: console
    security:
      admin_password: secret
      admin_user: root
  dashboardLabelSelector:
    - matchExpressions:
        - key: app
          operator: In
          values:
            - grafana

```

安装完毕后，查看相关资源正常输出如下：

```
# oc get pod
NAME                                  READY   STATUS    RESTARTS   AGE
grafana-deployment-64f8b9cdd9-6g88f   1/1     Running   0          72s
grafana-operator-66d7f554d5-xgrjp     1/1     Running   0          2m44s
# oc get grafana
NAME           AGE
ssli-grafana   82s
# oc get route
NAME            HOST/PORT                                                      PATH   SERVICES          PORT      TERMINATION   WILDCARD
grafana-route   grafana-route-ssli-monitoring.apps.ssli-ocp1.os.fyre.ibm.com          grafana-service   grafana   edge          None
#
```

### 创建rbac

要访问ocp自带的prometheus数据，我们需要配置相应的认证信息，首先创建serviceaccount：

```
# oc create serviceaccount grafana -n ssli-monitoring
serviceaccount/grafana created
```

为serviceaccount创建相应的clusterrolebinding：

```
# oc create clusterrolebinding grafana-cluster-monitoring-view \
  --clusterrole=cluster-monitoring-view \
  --serviceaccount=ssli-monitoring:grafana
```

获取serviceaccount的token：

```
# oc sa get-token grafana -n ssli-monitoring
eyJh...S9WeA
```

### 创建datasources访问ocp的prometheus

以secret的方式创建datasources，yaml如下：

```
apiVersion: v1
kind: Secret
metadata:
  name: openshift-monitoring-grafana-datasource
  namespace: ssli-monitoring
stringData:
  ssli-datasources.yaml: |
    apiVersion: 1
    datasources:
    - name: "openshift-monitoring-datasource"
      type: prometheus
      access: proxy
      url: "https://prometheus-k8s-openshift-monitoring.apps.ssli-ocp1.os.fyre.ibm.com"
      basicAuth: false
      withCredentials: false
      isDefault: false
      jsonData:
        tlsSkipVerify: true
        httpHeaderName1: "Authorization"
      secureJsonData:
        httpHeaderValue1: "Bearer eyJh...S9WeA"
      editable: true
```

这里需要注意3个配置项：

- namespace：安装的grafana所在的namespace
- url：ocp的prometheus的访问route，通过执行oc get route prometheus-k8s -n openshift-monitoring获取
- httpHeaderValue1：使用serviceaccount的token


创建secret，并将secret挂载到grafana的pod中，如下：

```
root@ssli-ocp1-inf:grafana$ oc apply -f secret.yaml
secret/openshift-monitoring-grafana-datasource created

```

然后更新grafana的deployment，添加以下内容挂载secret：


```
            - name: ssli-grafana-datasources
              mountPath: /etc/grafana/provisioning/datasources

...

        - name: ssli-grafana-datasources
          secret:
            secretName: openshift-monitoring-grafana-datasource
            defaultMode: 420
```

待grafana的pod待重启完毕，访问grafana的dashboard，使用以下命令获取grafana的dashboard的url：

```
# oc get route -n ssli-monitoring
NAME            HOST/PORT                                                      PATH   SERVICES          PORT      TERMINATION   WILDCARD
grafana-route   grafana-route-ssli-monitoring.apps.ssli-ocp1.os.fyre.ibm.com          grafana-service   grafana   edge          None
```

登录是使用创建grafana时指定的用户名和密码，默认如下：

```
admin_password: secret
admin_user: root
```

在dashboard中找到创建的datasources，然后点击save & test，配置正常的话会提示一下信息：

```
Data source is working
```

然后就可以添加自己的grafana dashboard。
