---
layout: post
title: cka练习（十）
date: 2021-12-16 12:12:05
---

```shell
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: liveness
  name: liveness-exec
spec:
  containers:
  - name: liveness
    image: quay.io/prometheus/busybox:latest
    args:
    - /bin/sh
    - -c
    - touch /tmp/healthy; sleep 10; rm -rf /tmp/healthy; sleep 600
    livenessProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
      initialDelaySeconds: 10
      periodSeconds: 5
EOF
$ kgp
NAME            READY   STATUS    RESTARTS   AGE
liveness-exec   1/1     Running   1          58s
$ k exec liveness-exec -- ls /tmp
healthy
$ k exec liveness-exec -- rm -rf /tmp/healthy
$ k exec liveness-exec -- ls /tmp
$ kdp
Name:         liveness-exec
Namespace:    ch10
Priority:     0
Node:         kind-control-plane/172.18.0.2
Start Time:   Thu, 16 Dec 2021 12:22:52 +0800
Labels:       test=liveness
Annotations:  <none>
Status:       Running
IP:           10.244.0.51
IPs:
  IP:  10.244.0.51
Containers:
  liveness:
    Container ID:  containerd://d275c56d54591f8252c28a306c303f02272a4dd65ada00d3eb79a794ba540bcc
    Image:         quay.io/prometheus/busybox:latest
    Image ID:      quay.io/prometheus/busybox@sha256:2548dd93c438f7cf8b68dc2ff140189d9bcdae7130d3941524becc31573ec9e3
    Port:          <none>
    Host Port:     <none>
    Args:
      /bin/sh
      -c
      touch /tmp/healthy; sleep 10; rm -rf /tmp/healthy; sleep 600
    State:          Running
      Started:      Thu, 16 Dec 2021 12:23:47 +0800
    Last State:     Terminated
      Reason:       Error
      Exit Code:    137
      Started:      Thu, 16 Dec 2021 12:22:52 +0800
      Finished:     Thu, 16 Dec 2021 12:23:47 +0800
    Ready:          True
    Restart Count:  1
    Liveness:       exec [cat /tmp/healthy] delay=10s timeout=1s period=5s #success=1 #failure=3
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-vv9gz (ro)
Conditions:
  Type              Status
  Initialized       True
  Ready             True
  ContainersReady   True
  PodScheduled      True
Volumes:
  default-token-vv9gz:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-vv9gz
    Optional:    false
QoS Class:       BestEffort
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                 node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  62s                default-scheduler  Successfully assigned ch10/liveness-exec to kind-control-plane
  Normal   Pulled     62s                kubelet            Successfully pulled image "quay.io/prometheus/busybox:latest" in 112.409367ms
  Warning  Unhealthy  37s (x3 over 47s)  kubelet            Liveness probe failed: cat: can't open '/tmp/healthy': No such file or directory
  Normal   Killing    37s                kubelet            Container liveness failed liveness probe, will be restarted
  Normal   Pulling    7s (x2 over 62s)   kubelet            Pulling image "quay.io/prometheus/busybox:latest"
  Normal   Created    7s (x2 over 62s)   kubelet            Created container liveness
  Normal   Started    7s (x2 over 62s)   kubelet            Started container liveness
  Normal   Pulled     7s                 kubelet            Successfully pulled image "quay.io/prometheus/busybox:latest" in 126.868686ms
```

## 参考

- cka/ckad应试指南：从docker到kubernetes完全攻略 ch-10
