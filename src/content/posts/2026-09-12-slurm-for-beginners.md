---
title: "零基础看懂 slurm：从多节点集群到第一个作业"
description: "用一个控制节点和两个计算节点的例子，介绍 slurm 的使用场景、核心组件、安装思路、常用命令和多节点作业。"
pubDatetime: 2026-09-12T01:30:00+08:00
tags: ["slurm", "linux", "学习笔记", "部署"]
---

第一次接触 slurm 时，我以为它只是一个“把程序放到服务器上运行”的工具。继续了解后才发现，它真正解决的问题是：

> 当很多人共享很多台服务器时，由谁决定任务先跑还是后跑、使用哪些节点、占用多少 cpu、内存和 gpu？

如果只有一台服务器，我们登录后直接运行程序就可以了。但有几十台计算节点、几百块 gpu 和很多用户时，大家都直接登录服务器抢资源，很快就会乱成一团。

slurm 就像集群里的资源管理员和任务调度员。用户只需要说明“我要多少资源、运行什么程序”，slurm 负责排队、选择节点、启动任务、监控状态，并在任务结束后回收资源。

这篇文章不讨论复杂的调度算法，先通过一个控制节点和两个计算节点的例子，理解 slurm 是什么、如何安装，以及如何提交第一个多节点作业。

## 先从一个实际场景开始

假设实验室有三台 linux 服务器：

| 主机名 | 角色 | 配置 | 用途 |
| --- | --- | --- | --- |
| `control` | 控制节点 | 4 核 cpu、8 gb 内存 | 接收作业、排队和调度 |
| `node01` | 计算节点 | 16 核 cpu、64 gb 内存 | 真正运行计算任务 |
| `node02` | 计算节点 | 16 核 cpu、64 gb 内存 | 真正运行计算任务 |

两位用户同时提交任务：

- 小王需要两个节点运行并行计算；
- 小李需要一个节点训练模型；
- 当前只有一个节点空闲。

如果没有调度系统，只能由管理员在群里协调，或者让用户自己抢服务器。slurm 会把任务放进队列，根据资源、优先级和调度规则决定谁先运行。

```text
用户提交作业
    ↓
slurm 检查资源请求
    ↓
资源足够？
  ├─ 是 → 分配节点并运行
  └─ 否 → 留在队列中等待
             ↓
       有资源释放后再运行
```

所以，使用 slurm 并不等于程序会立刻运行。进入队列等待是正常行为，不一定是故障。

## slurm 是什么

slurm 是面向 linux 集群的开源工作负载管理和作业调度系统。它主要做三件事：

- 分配资源：给作业分配节点、cpu、内存、gpu 和运行时间；
- 运行任务：在分配到的节点上启动、监控和结束程序；
- 管理队列：资源不足时让作业排队，并按照规则选择下一个作业。

可以把它理解成饭店的前台：

| 饭店 | slurm 集群 |
| --- | --- |
| 顾客 | 用户 |
| 点菜单 | 作业脚本 |
| 桌位和厨房 | 计算节点与资源 |
| 排号队列 | 作业队列 |
| 前台安排座位 | 调度器分配资源 |

slurm 不是虚拟机平台，也不是容器平台。它通常直接调度 linux 节点上的进程，尤其适合高性能计算、科学计算、工程仿真、批量数据处理和 ai 训练等场景。

## 哪些场景适合使用 slurm

### 高性能计算

天气模拟、流体计算、基因分析等任务可能需要多个节点共同计算。slurm 可以一次为作业分配多个节点，再配合 mpi 等并行计算工具启动进程。

### ai 训练和 gpu 集群

用户可以申请指定数量或型号的 gpu。例如一个训练任务需要 2 台服务器、每台 4 块 gpu，slurm 会等到满足条件的资源同时可用后再启动任务。

### 大量批处理任务

如果有 1000 个输入文件需要分别处理，可以使用作业数组批量提交，而不是手工启动 1000 条命令。

### 多用户共享集群

不同团队共享同一批服务器时，可以通过分区、账户、服务质量和优先级限制资源使用，避免某个用户长期占满整个集群。

如果只是个人使用一台服务器，直接运行程序通常更简单。slurm 的价值主要体现在多节点、多用户和资源竞争场景。

## 先认识几个核心组件

一个最小可用的 slurm 集群至少需要控制节点和计算节点。

```text
                     用户
                      ↓
             sbatch / srun / squeue
                      ↓
              control 控制节点
                  slurmctld
                 /         \
                ↓           ↓
        node01 计算节点   node02 计算节点
             slurmd           slurmd

所有节点：munge 负责组件之间的身份认证
可选组件：slurmdbd + 数据库保存历史作业和计费信息
```

### slurmctld：集群的大脑

`slurmctld` 运行在控制节点上，负责接收作业、维护队列、监控节点，并决定把资源分配给哪个作业。

生产环境可以配置备用控制节点，避免主控制节点故障后整个调度系统不可用。

### slurmd：计算节点上的执行者

每个计算节点运行一个 `slurmd`。它向控制节点报告本机状态，接收任务并在本机启动进程。

简单理解：`slurmctld` 负责决定“谁来做”，`slurmd` 负责真正“开始做”。

### munge：节点之间的身份证

slurm 组件之间需要确认消息来自可信节点。小型集群经常使用 munge 完成认证，所有节点必须使用同一份 `munge.key`，并严格保护它的权限。

munge 只解决 slurm 组件间的认证问题，不等于用户不需要 linux 账号。

### slurmdbd：可选的历史记录员

`slurmdbd` 可以把作业历史、资源消耗和账户信息写入数据库。实验环境可以先不部署，但需要长期统计、配额、计费或多集群管理时通常会使用它。

### 登录节点：用户工作的入口

较大的集群通常还有登录节点。用户在登录节点编辑代码、准备数据和提交作业，但不在这里执行重计算。

登录节点不是 slurm 必须的守护进程角色，而是一种常见的集群使用方式。小型实验环境可以暂时在控制节点上执行客户端命令。

## 再理解五个常用概念

| 概念 | 白话解释 | 示例 |
| --- | --- | --- |
| node | 一台计算服务器 | `node01` |
| partition | 一组节点形成的队列 | `debug`、`gpu` |
| job | 用户提交的一份工作 | 训练一次模型 |
| task | 作业中的一个进程 | 一个 mpi rank |
| job step | 作业内的一次执行步骤 | 一次 `srun` |

最容易混淆的是 node、task 和 cpu：

```text
--nodes=2
```

表示申请两台计算节点。

```text
--ntasks-per-node=4
```

表示每个节点启动 4 个任务，总共 8 个任务。

```text
--cpus-per-task=2
```

表示每个任务使用 2 个 cpu。因此整个作业总共申请 16 个 cpu。

不要把 task 简单理解为一台服务器。一个节点可以运行多个 task，一个 task 也可以使用多个 cpu。

## 三节点实验环境的安装思路

下面使用 `control`、`node01` 和 `node02` 说明安装过程。它是一份理解安装关系的实验示例，不是可以直接用于生产环境的完整方案。不同 linux 发行版和 slurm 版本的软件包名称、默认目录及插件会有差异，应以对应版本的官方文档和发行版说明为准。

### 1. 准备基础环境

三台机器至少需要满足：

- 主机名和地址可以互相解析；
- 时间保持同步；
- 用户名、uid 和 gid 保持一致；
- 节点间所需端口可以通信；
- 安装相同兼容版本的 slurm 和 munge；
- 作业需要共享文件时，提前准备 nfs 或其他共享存储。

为什么 uid 和 gid 要一致？因为作业可能由 `node01` 转到 `node02` 执行。如果同一个 uid 在两台机器上对应不同用户，文件权限和进程身份就会出错。

官方默认端口通常包括：

| 组件 | 默认端口 |
| --- | --- |
| `slurmctld` | 6817 |
| `slurmd` | 6818 |
| `slurmdbd` | 6819 |

实际防火墙策略应只放行集群需要的通信，不要为了省事直接关闭所有安全控制。

### 2. 安装 slurm 和 munge

在所有节点安装 slurm 客户端、对应的守护进程和 munge。以使用系统软件包的环境为例，角色关系大致如下：

```text
control：slurm 客户端 + slurmctld + munge
node01 ：slurm 客户端 + slurmd    + munge
node02 ：slurm 客户端 + slurmd    + munge
```

有些发行版提供拆分软件包，有些提供一个包含常用组件的软件包。生产环境应固定版本并先验证兼容性，不要让节点各自安装不同版本。

### 3. 配置 munge

先在受控节点生成一份 `munge.key`，再通过安全方式分发到所有节点。三台机器必须使用完全相同的密钥，并让文件只对 munge 服务账户保留必要权限。

完成后先启动 munge，并验证本机和跨节点认证。只有 munge 正常，才继续启动 slurm 服务。

```text
同一份 munge.key
    ├─ control
    ├─ node01
    └─ node02
```

不要把 `munge.key` 放进 git、博客、聊天记录或普通共享目录。

### 4. 获取计算节点的真实硬件信息

在每个计算节点执行：

```bash
slurmd -C
```

它会输出可用于 `slurm.conf` 的 cpu、插槽、核心、线程和内存信息。把输出中的硬件参数作为配置依据，不要直接复制网上示例里的数字。

如果两台计算节点配置相同，可以使用节点范围简化配置；配置不同则应分别填写。

### 5. 编写 slurm.conf

下面是一个只用于理解的最小示例。假设两台计算节点各有 16 个 cpu、约 64 gb 内存；真实环境必须根据 `slurmd -C` 的结果调整：

```ini
ClusterName=demo-cluster
SlurmctldHost=control

SlurmUser=slurm
SlurmdUser=root
AuthType=auth/munge

StateSaveLocation=/var/spool/slurmctld
SlurmdSpoolDir=/var/spool/slurmd

SchedulerType=sched/backfill
SelectType=select/cons_tres
SelectTypeParameters=CR_Core_Memory

ProctrackType=proctrack/cgroup
TaskPlugin=task/cgroup
ReturnToService=2

NodeName=node[01-02] CPUs=16 RealMemory=64000 State=UNKNOWN
PartitionName=debug Nodes=node[01-02] Default=YES MaxTime=01:00:00 State=UP
```

这里最重要的几行是：

- `SlurmctldHost` 指定控制节点；
- `NodeName` 登记计算节点及其资源；
- `PartitionName` 把计算节点加入名为 `debug` 的分区；
- `MaxTime` 限制该分区中单个作业的最长运行时间。

所有节点都需要读取一致的 `slurm.conf`。生产环境还应认真配置 cgroup、日志、资源隔离、节点健康检查、记账、高可用和安全策略。

### 6. 准备运行目录并启动服务

先创建配置中使用的状态和临时目录，并设置正确的属主和权限。然后按照以下顺序启动：

```text
所有节点启动 munge
        ↓
control 启动 slurmctld
        ↓
node01、node02 启动 slurmd
```

最后查看集群状态：

```bash
sinfo -N -l
```

如果两个节点都是 `idle`，说明它们在线且暂时没有运行作业。

常见状态包括：

| 状态 | 含义 |
| --- | --- |
| `idle` | 节点空闲，可以接收作业 |
| `alloc` | 节点资源已经全部分配 |
| `mix` | 节点一部分资源已使用，一部分仍空闲 |
| `down` | 节点不可用 |
| `drain` | 节点不再接收新作业，常用于维护或故障隔离 |

## 第一个交互式多节点命令

先让 slurm 在两个节点上各运行一次 `hostname`：

```bash
srun --nodes=2 --ntasks-per-node=1 --label hostname
```

可能看到：

```text
0: node01
1: node02
```

这条命令表示：

- 申请 2 个节点；
- 每个节点运行 1 个任务；
- 用编号标记每个任务的输出；
- 每个任务执行 `hostname`。

如果资源暂时不足，`srun` 也可能等待。它并不是绕过队列直接登录计算节点。

## 第一个批处理作业

实际工作中更常见的是编写作业脚本，然后用 `sbatch` 提交。创建 `multi-node-demo.sh`：

```bash
#!/bin/bash
#SBATCH --job-name=multi-node-demo
#SBATCH --partition=debug
#SBATCH --nodes=2
#SBATCH --ntasks-per-node=2
#SBATCH --cpus-per-task=1
#SBATCH --time=00:05:00
#SBATCH --output=slurm-%j.out

echo "job id: $SLURM_JOB_ID"
echo "allocated nodes: $SLURM_JOB_NODELIST"

srun --label bash -c 'echo "task=$SLURM_PROCID host=$(hostname)"'
```

提交作业：

```bash
sbatch multi-node-demo.sh
```

命令会返回类似结果：

```text
Submitted batch job 123
```

这里的 `123` 是作业编号，不代表作业已经运行完成。查看队列：

```bash
squeue
```

作业完成后查看输出：

```bash
cat slurm-123.out
```

可能看到：

```text
job id: 123
allocated nodes: node[01-02]
0: task=0 host=node01
1: task=1 host=node01
2: task=2 host=node02
3: task=3 host=node02
```

这说明脚本本身先在作业分配到的第一个节点上执行，`srun` 再按照资源请求在两个节点上启动 4 个任务。

## sbatch、srun 和 salloc 有什么区别

### sbatch：提交后可以离开

`sbatch` 把脚本交给 slurm。作业在后台排队和运行，适合训练、仿真、批处理等耗时任务。

```bash
sbatch train.sh
```

### srun：启动一个作业或作业步骤

`srun` 可以直接申请资源并执行命令，也经常写在 `sbatch` 脚本中，用来把进程启动到已分配的多个节点上。

```bash
srun --nodes=2 hostname
```

### salloc：先拿到资源，再交互操作

`salloc` 先申请一块资源，适合调试。获得资源后，可以继续用 `srun` 在这块资源里启动命令。

```bash
salloc --nodes=2 --time=00:20:00
srun --nodes=2 hostname
exit
```

简单记忆：

```text
sbatch：把整份作业交出去
salloc：先申请一块资源
srun  ：在资源上启动任务
```

## 常用命令

| 命令 | 用途 | 示例 |
| --- | --- | --- |
| `sinfo` | 查看分区和节点 | `sinfo -N -l` |
| `squeue` | 查看排队和运行中的作业 | `squeue -u $USER` |
| `sbatch` | 提交批处理脚本 | `sbatch job.sh` |
| `srun` | 申请资源或启动作业步骤 | `srun hostname` |
| `salloc` | 申请交互式资源 | `salloc -N 2` |
| `scancel` | 取消作业 | `scancel 123` |
| `scontrol` | 查看详细状态 | `scontrol show job 123` |
| `sacct` | 查看已完成作业记录 | `sacct -j 123` |

如果作业一直是 `pending`，先查看原因：

```bash
squeue -j 123 -o "%.18i %.9P %.20j %.2t %.10M %.6D %R"
```

最后一列可能显示：

- `Resources`：需要的资源暂时不足；
- `Priority`：前面还有优先级更高的作业；
- `Dependency`：依赖的作业还没有满足条件；
- `QOS...`：触发了服务质量或资源限制。

不要看到 `pending` 就反复提交相同作业，否则只会制造更多重复任务。

## 一个 cpu 作业脚本

假设程序使用 8 个线程：

```bash
#!/bin/bash
#SBATCH --job-name=cpu-demo
#SBATCH --partition=debug
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=16G
#SBATCH --time=00:30:00
#SBATCH --output=slurm-%j.out

export OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK
srun ./my-cpu-program
```

这是“一个任务使用多个 cpu”的场景。申请了 8 个 cpu，并不代表程序会自动变成 8 线程；程序本身也必须支持并行，并读取正确的线程配置。

## 一个 gpu 作业脚本

假设集群已经正确配置 gpu 资源：

```bash
#!/bin/bash
#SBATCH --job-name=gpu-demo
#SBATCH --partition=gpu
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --gres=gpu:1
#SBATCH --time=01:00:00
#SBATCH --output=slurm-%j.out

srun nvidia-smi
srun python train.py
```

`--gres=gpu:1` 表示申请 1 块 gpu。不同集群也可能使用 `--gpus`、`--gpus-per-node` 或带型号的资源名称，应以管理员公布的配置为准。

slurm 只负责分配 gpu，不会自动让普通 python 程序使用 gpu。程序、驱动和计算框架也必须配置正确。

## 用作业数组处理很多文件

假设有 100 个输入文件：

```bash
#!/bin/bash
#SBATCH --job-name=array-demo
#SBATCH --array=0-99%10
#SBATCH --cpus-per-task=1
#SBATCH --mem=2G
#SBATCH --time=00:10:00
#SBATCH --output=logs/%A_%a.out

python process.py "inputs/input-${SLURM_ARRAY_TASK_ID}.json"
```

这里的含义是：

- 创建编号 0 到 99 的 100 个数组任务；
- `%10` 表示最多同时运行 10 个；
- `%A` 是主作业编号，`%a` 是数组任务编号。

作业数组适合“同一个程序处理很多独立输入”的场景。它不是多节点并行程序，不需要任务之间互相通信。

## 多节点不等于程序自动并行

这是初学者最容易踩的坑。

假设只写：

```bash
#SBATCH --nodes=2
python train.py
```

虽然申请了两个节点，但脚本通常只会在分配到的第一个节点上执行一次。第二个节点可能被分配了资源，却没有真正参与计算。

要让多个节点一起工作，程序本身需要支持分布式运行，并使用合适的启动方式，例如：

- mpi 程序通过与 slurm 兼容的 mpi 启动；
- pytorch 分布式训练通过 `torchrun` 等方式启动；
- 普通独立任务通过 `srun` 在多个 task 中运行；
- 大量互不依赖的输入通过作业数组处理。

因此：

```text
申请多个节点
≠
程序自动使用多个节点
```

slurm 负责给你资源并启动进程，程序负责真正的并行计算和节点间通信。

## 数据放在哪里

多节点作业还要考虑数据是否能被每个节点看到。

假设脚本位于 `control` 的本地目录，但 `node01` 和 `node02` 没有这个文件，作业启动后就会报“文件不存在”。常见方案包括：

- 使用 nfs、lustre、beegfs 等共享文件系统；
- 在作业开始前把数据复制到计算节点本地盘；
- 使用容器或环境模块提供一致的软件环境；
- 在作业结束后把结果保存回持久存储。

共享文件系统使用方便，但大量任务同时读写也可能成为瓶颈。数据很大时，需要同时考虑计算、网络和存储，而不是只看 cpu 或 gpu 数量。

## 一个作业从提交到结束经历了什么

把前面的内容串起来，一个批处理作业大致经历：

```text
1. 用户用 sbatch 提交脚本
                ↓
2. slurmctld 读取资源请求并生成 job id
                ↓
3. 资源不足时，作业处于 pending
                ↓
4. 调度器选择 node01 和 node02
                ↓
5. 两个节点上的 slurmd 启动作业进程
                ↓
6. 用户通过 squeue 查看状态
                ↓
7. 程序结束，slurm 回收资源并记录结果
```

如果启用了作业记账，还可以通过 `sacct` 查看运行时间、退出状态和资源使用记录。

## 常见问题和排查顺序

### 节点显示 down 或 unknown

按下面的顺序检查：

1. 主机名是否与 `slurm.conf` 一致；
2. 时间是否同步；
3. munge 是否正常，密钥是否一致；
4. `slurmd` 是否运行；
5. 控制节点与计算节点端口是否可达；
6. `slurmd -C` 输出是否与节点配置一致；
7. 控制节点和计算节点日志里是否有明确错误。

### 作业一直排队

先用 `squeue` 或 `scontrol show job` 看等待原因，再检查：

- 请求的节点数是否超过分区规模；
- 请求的 cpu、内存或 gpu 是否真的存在；
- 时间限制是否超过分区允许值；
- 分区、账户和服务质量是否正确；
- 节点是否处于 `drain` 或 `down`。

### 作业很快失败

检查输出文件和退出码，同时确认：

- 脚本使用的是 linux 换行符；
- 程序和输入文件在计算节点可见；
- 软件环境在所有节点一致；
- 输出目录存在并且可写；
- 申请的内存是否足够；
- 多节点程序的启动命令是否正确。

## 从实验环境走向生产还缺什么

一个能运行 `hostname` 的三节点集群，只能证明基本调度链路已经连通。生产环境还需要继续考虑：

- 控制节点高可用和状态备份；
- slurmdbd、数据库和作业记账；
- cgroup 资源隔离；
- 用户、账户、分区、服务质量和公平共享；
- gpu、节点特征和拓扑感知；
- 共享存储、软件环境和容器；
- 日志、监控、告警和节点健康检查；
- 安全加固、升级、备份和故障恢复；
- 小作业回填、大作业等待时间和整体利用率之间的平衡。

不要把“能够提交作业”直接等同于“生产可用”。前者是功能连通，后者还包括可靠性、安全、性能、运维和容量治理。

## 推荐的学习顺序

如果和我一样是第一次接触，可以按下面的顺序练习：

1. 用 `sinfo` 看懂节点和分区状态；
2. 用 `srun` 在一个节点运行 `hostname`；
3. 用 `srun` 在两个节点各运行一个任务；
4. 用 `sbatch` 提交脚本，并通过 `squeue` 查看队列；
5. 修改节点数、task 数、cpu 和内存请求，观察调度结果；
6. 故意申请超过现有容量的资源，查看 `pending` 原因，然后取消作业；
7. 尝试一个 cpu 多线程程序；
8. 再学习 mpi、gpu、作业数组、记账和优先级。

先把“资源申请—排队—分配—运行—回收”这条主线弄明白，再学习复杂配置会轻松很多。

## 总结

以后再看到 slurm，可以先把它翻译成：

> 一个替多用户管理多台 linux 计算服务器的资源管理员和任务调度员。

用户不再关心应该手工登录哪台计算节点，而是通过作业脚本说明：

```text
我要多少节点
+
每个节点运行多少任务
+
每个任务使用多少 cpu、内存或 gpu
+
最长运行多久
+
最终执行什么程序
```

slurm 根据整个集群的状态决定何时运行、在哪里运行，并在结束后回收资源。

但一定要记住：slurm 可以分配多个节点，也可以在多个节点上启动任务，却不会把一个普通程序自动变成分布式程序。真正的多节点计算，还需要 mpi、分布式训练框架或程序自己的并行能力。

## 参考资料

- [slurm 官方概览](https://slurm.schedmd.com/overview.html)
- [slurm 管理员快速入门](https://slurm.schedmd.com/quickstart_admin.html)
- [slurm 用户快速入门](https://slurm.schedmd.com/quickstart.html)
- [slurm 网络配置说明](https://slurm.schedmd.com/network.html)
- [srun 官方文档](https://slurm.schedmd.com/srun.html)
