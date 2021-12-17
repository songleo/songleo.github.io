---
layout: post
title: cka练习（十二）
date: 2021-12-17 12:12:05
---

```shell
$ cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web1
  labels:
    app-name: web1
spec:
  replicas: 2
  selector:
    matchLabels:
      app-name: web1
  template:
    metadata:
      labels:
        app-name: web1
    spec:
      containers:
      - name: nginx
        image: quay.io/songleo/nginx:1.9
        ports:
        - containerPort: 80
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
EOF
$ k get po
NAME                    READY   STATUS    RESTARTS   AGE
web1-778bc6fd85-5ktx9   1/1     Running   0          8s
web1-778bc6fd85-g5jct   1/1     Running   0          8s
$ kubectl scale deployment/web1 --replicas=6
deployment.apps/web1 scaled
$ k get po
NAME                    READY   STATUS    RESTARTS   AGE
web1-778bc6fd85-5ktx9   1/1     Running   0          73s
web1-778bc6fd85-7gzxw   1/1     Running   0          5s
web1-778bc6fd85-8s5jn   1/1     Running   0          5s
web1-778bc6fd85-g5jct   1/1     Running   0          73s
web1-778bc6fd85-nwd48   1/1     Running   0          5s
web1-778bc6fd85-x9bjz   1/1     Running   0          5s
$ kubectl set image deployment/web1 nginx=quay.io/songleo/nginx --record=true
deployment.apps/web1 image updated
$ k get po
NAME                    READY   STATUS              RESTARTS   AGE
web1-6db6d5457c-2btmw   0/1     ContainerCreating   0          2s
web1-6db6d5457c-8bktg   1/1     Running             0          5s
web1-6db6d5457c-bxlsd   1/1     Running             0          4s
web1-6db6d5457c-lnqq6   1/1     Running             0          5s
web1-6db6d5457c-lt5d9   0/1     ContainerCreating   0          3s
web1-6db6d5457c-zq5z5   1/1     Running             0          4s
web1-778bc6fd85-5ktx9   1/1     Running             0          2m48s
web1-778bc6fd85-7gzxw   0/1     Terminating         0          100s
web1-778bc6fd85-8s5jn   0/1     Terminating         0          100s
web1-778bc6fd85-g5jct   1/1     Terminating         0          2m48s
web1-778bc6fd85-nwd48   1/1     Terminating         0          100s
web1-778bc6fd85-x9bjz   0/1     Terminating         0          100s
$ kubectl rollout history deployment/web1
deployment.apps/web1
REVISION  CHANGE-CAUSE
1         <none>
2         kubectl set image deployment/web1 nginx=quay.io/songleo/nginx --record=true
$ kubectl rollout undo deployment/web1 --to-revision=1
deployment.apps/web1 rolled back
$ kgp
NAME                    READY   STATUS        RESTARTS   AGE
web1-6db6d5457c-lnqq6   0/1     Terminating   0          3m51s
web1-778bc6fd85-9gkrg   1/1     Running       0          12s
web1-778bc6fd85-jzlnl   1/1     Running       0          11s
web1-778bc6fd85-lkc47   1/1     Running       0          11s
web1-778bc6fd85-pc9lt   1/1     Running       0          12s
web1-778bc6fd85-q29cd   1/1     Running       0          10s
web1-778bc6fd85-wg2s5   1/1     Running       0          9s
$ kdp web1-778bc6fd85-9gkrg
Name:         web1-778bc6fd85-9gkrg
Namespace:    ch8
Priority:     0
Node:         kind-control-plane/172.18.0.2
Start Time:   Thu, 16 Dec 2021 19:40:00 +0800
Labels:       app-name=web1
              pod-template-hash=778bc6fd85
Annotations:  <none>
Status:       Running
IP:           10.244.0.30
IPs:
  IP:           10.244.0.30
Controlled By:  ReplicaSet/web1-778bc6fd85
Containers:
  nginx:
    Container ID:   containerd://a392d1ae4773d0babd8687c5a5ac7c58009ea7c429188728a0041a10fe1c7b4e
    Image:          quay.io/songleo/nginx:1.9
    Image ID:       quay.io/songleo/nginx@sha256:e18c5814a9f7ddd5fe410f17417a48d2de562325e9d71337274134f4a6654e3f
    Port:           80/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Thu, 16 Dec 2021 19:40:00 +0800
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-j7cwx (ro)
Conditions:
  Type              Status
  Initialized       True
  Ready             True
  ContainersReady   True
  PodScheduled      True
Volumes:
  default-token-j7cwx:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-j7cwx
    Optional:    false
QoS Class:       BestEffort
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                 node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  21s   default-scheduler  Successfully assigned ch8/web1-778bc6fd85-9gkrg to kind-control-plane
  Normal  Pulled     22s   kubelet            Container image "quay.io/songleo/nginx:1.9" already present on machine
  Normal  Created    22s   kubelet            Created container nginx
  Normal  Started    22s   kubelet            Started container nginx
```

## 参考

- cka/ckad应试指南：从docker到kubernetes完全攻略 ch-8
