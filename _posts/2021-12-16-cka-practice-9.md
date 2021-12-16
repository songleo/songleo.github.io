---
layout: post
title: cka练习（九）
date: 2021-12-16 12:12:05
---

```shell
$ cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: job1
spec:
  parallelism: 3
  completions: 6
  template:
    spec:
      containers:
      - name: job1
        image: quay.io/prometheus/busybox:latest
        command: ["/bin/sh", "-c", "echo \"hello k8s\" && sleep 10"]
      restartPolicy: Never
EOF
$ k get job
NAME   COMPLETIONS   DURATION   AGE
job1   6/6           23s        46s
$ k get po
NAME         READY   STATUS      RESTARTS   AGE
job1-5g8mc   0/1     Completed   0          48s
job1-7w6k5   0/1     Completed   0          37s
job1-8kddt   0/1     Completed   0          37s
job1-9lc4d   0/1     Completed   0          48s
job1-lvm2s   0/1     Completed   0          48s
job1-sxxzb   0/1     Completed   0          37s
$ k logs job1-5g8mc
hello k8s
$ cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: job2
spec:
  template:
    spec:
      containers:
      - name: pi
        image: quay.io/centos7/perl-530-centos7
        command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(100)"]
      restartPolicy: Never
EOF
$ k get job
NAME   COMPLETIONS   DURATION   AGE
job2   1/1           17s        35s
$ k get po
NAME         READY   STATUS        RESTARTS   AGE
job2-4rjfx   0/1     Completed     0          41s
$ k logs job2-4rjfx
3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117068
$ cat <<EOF | kubectl apply -f -
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: testcj
spec:
  schedule: "*/2 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: c1
            image: quay.io/prometheus/busybox:latest
            imagePullPolicy: IfNotPresent
            command:
            - /bin/sh
            - -c
            - date
          restartPolicy: OnFailure
EOF
$ k get cj
NAME     SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
testcj   */2 * * * *   False     1        3s              2m1s
$ k get po
NAME                      READY   STATUS      RESTARTS   AGE
testcj-1639625280-9cjxt   0/1     Completed   0          5s
$ k logs testcj-1639625280-9cjxt
Thu Dec 16 03:28:03 UTC 2021

# cron schedule syntax
# ┌───────────── minute (0 - 59)
# │ ┌───────────── hour (0 - 23)
# │ │ ┌───────────── day of the month (1 - 31)
# │ │ │ ┌───────────── month (1 - 12)
# │ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday;
# │ │ │ │ │                                   7 is also Sunday on some systems)
# │ │ │ │ │
# │ │ │ │ │
# * * * * *
```

## 参考

- cka/ckad应试指南：从docker到kubernetes完全攻略 ch-11
