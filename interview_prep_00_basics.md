# 零基础入门指南 - 从零开始理解AI基础设施

## 目录
1. 什么是容器和Docker
2. 什么是Kubernetes
3. 什么是GPU和为什么AI需要GPU
4. 什么是分布式训练
5. 基本Linux命令
6. 如何阅读YAML配置文件

---

## 1. 什么是容器和Docker

### 1.1 为什么需要容器？

**类比理解：容器就像一个集装箱**

想象你要寄送一些物品：
- **传统方式**：直接把东西放在卡车上，到了目的地可能会损坏、丢失、或者和其他货物混在一起
- **集装箱方式**：把东西装在标准化的集装箱里，无论用船运、卡车运还是火车运，都是同一个箱子，不会出问题

容器也是类似的概念：
- **传统方式部署应用**：在服务器上安装软件，可能会遇到"在我电脑上能运行，在服务器上就不行"的问题
- **容器化部署**：把应用和它需要的所有东西（代码、依赖库、配置）打包在一起，到哪里都能运行

### 1.2 Docker基本概念

**Docker镜像（Image）**：就像一个软件安装包
```bash
# 查看本地有哪些镜像
docker images

# 从网上下载一个镜像
docker pull ubuntu:20.04
```

**Docker容器（Container）**：镜像运行起来就变成容器
```bash
# 运行一个容器（基于ubuntu镜像）
docker run -it ubuntu:20.04 /bin/bash

# 解释：
# docker run  - 运行容器
# -it         - 交互式运行（可以输入命令）
# ubuntu:20.04 - 使用的镜像
# /bin/bash   - 启动后执行bash命令行
```

**实际例子：运行一个Python应用**

```dockerfile
# Dockerfile - 告诉Docker如何打包你的应用
FROM python:3.9                    # 基于Python 3.9镜像

WORKDIR /app                       # 设置工作目录

COPY requirements.txt .            # 复制依赖列表
RUN pip install -r requirements.txt # 安装依赖

COPY app.py .                      # 复制应用代码

CMD ["python", "app.py"]           # 容器启动时运行这个命令
```

```bash
# 构建镜像
docker build -t my-python-app:1.0 .

# 运行容器
docker run -p 8080:8080 my-python-app:1.0
# -p 8080:8080 表示把容器的8080端口映射到主机的8080端口
```

### 1.3 为什么容器对AI重要？

1. **环境一致性**：训练模型需要特定版本的PyTorch、CUDA等，容器保证环境完全一致
2. **快速部署**：模型训练好后，直接把容器部署到生产环境
3. **资源隔离**：多个训练任务可以在同一台机器上运行，互不干扰

---

## 2. 什么是Kubernetes (K8s)

### 2.1 为什么需要Kubernetes？

**类比理解：Kubernetes是一个自动化的容器管理员**

假设你开了一家餐厅（服务器），有很多厨师（容器）：
- 需要有人分配厨师到不同的厨房（调度）
- 如果某个厨师生病了，要找人替换（自愈）
- 客人多的时候要增加厨师，客人少的时候减少厨师（扩缩容）
- 要确保每个厨师有足够的食材（资源分配）

Kubernetes就是做这些事情的！

### 2.2 Kubernetes核心概念

#### Pod - 最小的部署单元

Pod是一组紧密关联的容器，通常一个Pod里运行一个主容器。

```yaml
# 一个简单的Pod定义
apiVersion: v1
kind: Pod
metadata:
  name: my-app-pod          # Pod的名字
spec:
  containers:
  - name: my-app            # 容器的名字
    image: my-python-app:1.0  # 使用的镜像
    ports:
    - containerPort: 8080   # 容器监听的端口
```

```bash
# 创建Pod
kubectl apply -f pod.yaml

# 查看Pod状态
kubectl get pods

# 查看Pod详细信息
kubectl describe pod my-app-pod

# 查看Pod日志
kubectl logs my-app-pod
```

#### Deployment - 管理多个相同的Pod

如果你需要运行3个相同的应用实例（实现高可用）：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-deployment
spec:
  replicas: 3              # 运行3个副本
  selector:
    matchLabels:
      app: my-app
  template:                # Pod模板
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-python-app:1.0
        ports:
        - containerPort: 8080
```

Deployment的好处：
- 如果某个Pod挂了，自动创建新的
- 可以轻松扩容：`kubectl scale deployment my-app-deployment --replicas=5`
- 可以滚动更新：更新镜像版本时，逐个替换Pod，不中断服务

#### Service - 让外部可以访问Pod

Pod的IP会变化，Service提供一个稳定的访问入口：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app            # 选择哪些Pod
  ports:
  - port: 80               # Service的端口
    targetPort: 8080       # Pod的端口
  type: LoadBalancer       # 类型：LoadBalancer表示对外暴露
```

访问方式：
- 集群内部：`http://my-app-service`
- 外部：通过LoadBalancer的IP访问

#### Namespace - 资源隔离

Namespace就像文件夹，用来组织和隔离资源：

```bash
# 创建一个namespace
kubectl create namespace dev
kubectl create namespace prod

# 在特定namespace创建资源
kubectl apply -f pod.yaml -n dev

# 查看特定namespace的资源
kubectl get pods -n dev
```

### 2.3 Kubernetes在AI中的应用

```yaml
# AI训练任务的Pod示例
apiVersion: v1
kind: Pod
metadata:
  name: training-job
spec:
  containers:
  - name: trainer
    image: pytorch/pytorch:2.0-cuda11.8
    command: ["python", "train.py"]
    resources:
      limits:
        nvidia.com/gpu: 1    # 请求1块GPU
        memory: 32Gi         # 请求32GB内存
        cpu: 8               # 请求8个CPU核心
    volumeMounts:
    - name: data
      mountPath: /data       # 挂载数据目录
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: training-data-pvc
```

---

## 3. 什么是GPU和为什么AI需要GPU

### 3.1 CPU vs GPU

**CPU（中央处理器）**：
- 像一个非常聪明的人，擅长处理复杂的任务
- 核心少（一般8-64核），但每个核心很强
- 适合：运行操作系统、处理逻辑、顺序执行任务

**GPU（图形处理器）**：
- 像一群普通工人，擅长同时做很多简单重复的工作
- 核心多（几千个），但每个核心相对简单
- 适合：图形渲染、矩阵运算、并行计算

### 3.2 为什么深度学习需要GPU？

深度学习的核心就是**大量的矩阵乘法运算**。

举例：一个简单的神经网络计算
```python
# 假设我们有：
# 输入数据 X: 1000个样本，每个样本512维 -> 矩阵大小 [1000, 512]
# 权重矩阵 W: [512, 256]
# 要计算 Y = X @ W  (矩阵乘法)

# CPU方式（伪代码）
for i in range(1000):      # 遍历每个样本
    for j in range(256):   # 遍历输出的每一维
        sum = 0
        for k in range(512):  # 遍历输入的每一维
            sum += X[i][k] * W[k][j]
        Y[i][j] = sum

# 需要 1000 * 256 * 512 = 1.3亿次乘法和加法
# CPU要一步步算，很慢

# GPU方式
# GPU可以同时计算所有的 1000*256 = 25.6万个结果
# 速度提升几十到上百倍！
```

### 3.3 GPU相关概念

**显存（GPU Memory）**：
- GPU有自己的内存，叫显存（VRAM）
- 训练大模型需要大显存，比如：
  - GPT-3（175B参数）需要几百GB显存
  - LLaMA-7B 需要约14GB显存（FP16格式）

**GPU型号**（常见的NVIDIA GPU）：
- **V100**: 16GB/32GB显存，上一代训练卡
- **A100**: 40GB/80GB显存，当前主流训练卡
- **H100**: 80GB显存，最新一代，性能是A100的2-3倍
- **T4**: 16GB显存，主要用于推理

**CUDA**：
- NVIDIA的GPU编程平台
- PyTorch、TensorFlow等框架都是基于CUDA
- 版本要匹配：PyTorch 2.0需要CUDA 11.7+

**查看GPU信息**：
```bash
# 查看GPU状态
nvidia-smi

# 输出示例：
# +-----------------------------------------------------------------------------+
# | NVIDIA-SMI 525.60.13    Driver Version: 525.60.13    CUDA Version: 12.0     |
# |-------------------------------+----------------------+----------------------+
# | GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
# | Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
# |===============================+======================+======================|
# |   0  NVIDIA A100-SXM...  On   | 00000000:00:04.0 Off |                    0 |
# | N/A   30C    P0    50W / 400W |      0MiB / 40960MiB |      0%      Default |
# +-------------------------------+----------------------+----------------------+

# 持续监控GPU
watch -n 1 nvidia-smi
```

---

## 4. 什么是分布式训练

### 4.1 为什么需要分布式训练？

**问题**：模型太大，单个GPU放不下，或者训练太慢

**例子**：
- GPT-3有175B（1750亿）参数
- 每个参数用2字节存储（FP16），参数就需要 175B * 2 = 350GB
- 一块A100只有80GB显存，单卡根本放不下！

### 4.2 分布式训练的基本思路

**方案1：数据并行（Data Parallelism）**

把数据分成多份，每个GPU处理一部分：

```
GPU 0: 处理样本 1-32    ┐
GPU 1: 处理样本 33-64   ├─> 每个GPU都有完整的模型
GPU 2: 处理样本 65-96   │
GPU 3: 处理样本 97-128  ┘

然后把梯度合并，更新模型
```

**简化代码示例**：
```python
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

# 初始化分布式环境
dist.init_process_group(backend="nccl")

# 创建模型
model = MyModel()
model = DDP(model)  # 包装成分布式模型

# 训练循环
for data, labels in dataloader:
    outputs = model(data)
    loss = criterion(outputs, labels)
    
    loss.backward()     # 计算梯度
    optimizer.step()    # DDP会自动同步梯度并更新
```

**方案2：模型并行（Model Parallelism）**

把模型分成多份，每个GPU负责一部分：

```
       输入数据
          ↓
    [第1-10层] → GPU 0
          ↓
   [第11-20层] → GPU 1
          ↓
   [第21-30层] → GPU 2
          ↓
       输出
```

### 4.3 通信是关键

多个GPU之间需要通信（交换梯度或激活值）：

**NCCL（NVIDIA Collective Communications Library）**：
- NVIDIA的高性能GPU通信库
- 自动选择最优的通信方式（PCIe、NVLink、网络）

```bash
# 查看NCCL通信是否正常
NCCL_DEBUG=INFO python train.py

# 常见的NCCL错误：
# - "NCCL error: unhandled system error" → 网络问题
# - "NCCL timeout" → 某个GPU卡住了
```

---

## 5. 基本Linux命令

AI工作中常用的Linux命令：

### 5.1 文件操作

```bash
# 查看当前目录
pwd

# 列出文件
ls          # 简单列出
ls -l       # 详细信息
ls -lh      # 人类可读的文件大小（K, M, G）

# 切换目录
cd /data/models      # 绝对路径
cd ../               # 上一级目录
cd ~                 # 回到家目录

# 创建目录
mkdir my_project
mkdir -p data/train/images  # -p 创建多级目录

# 复制文件
cp file1.py file2.py
cp -r dir1/ dir2/    # -r 复制目录

# 移动/重命名
mv old_name.py new_name.py
mv file.txt /data/

# 删除
rm file.txt
rm -r dir/           # 删除目录
rm -rf dir/          # 强制删除，小心使用！

# 查看文件内容
cat file.txt         # 显示全部内容
head -n 10 file.txt  # 前10行
tail -n 10 file.txt  # 后10行
tail -f log.txt      # 实时查看日志文件

# 搜索文件
find . -name "*.py"           # 查找所有.py文件
find . -name "train.py"       # 查找特定文件

# 搜索文件内容
grep "error" log.txt          # 在文件中搜索"error"
grep -r "TODO" .              # 在当前目录递归搜索
```

### 5.2 进程管理

```bash
# 查看进程
ps aux                # 所有进程
ps aux | grep python  # 查找python进程

# 实时监控
top                   # CPU、内存使用情况
htop                  # 更友好的界面（需要安装）
nvidia-smi            # GPU使用情况

# 后台运行
python train.py &     # 在后台运行
nohup python train.py > train.log 2>&1 &  # 后台运行，输出到日志

# 查看后台任务
jobs

# 杀死进程
kill 12345            # 根据进程ID杀死
kill -9 12345         # 强制杀死
pkill -f train.py     # 根据名称杀死
```

### 5.3 系统信息

```bash
# 查看磁盘使用
df -h                 # 磁盘空间
du -sh *              # 当前目录下每个文件/文件夹的大小
du -sh data/          # 特定目录的大小

# 查看内存
free -h               # 内存使用情况

# 查看CPU
lscpu                 # CPU详细信息

# 查看GPU
nvidia-smi
nvidia-smi -l 1       # 每秒刷新一次
```

### 5.4 网络

```bash
# 下载文件
wget https://example.com/model.pth
curl -O https://example.com/model.pth

# 查看网络连接
netstat -tunlp        # 查看监听的端口
ss -tulpn             # 更快的替代命令

# 测试网络
ping google.com
```

---

## 6. 如何阅读YAML配置文件

YAML是一种人类可读的配置文件格式，在Kubernetes和AI项目中广泛使用。

### 6.1 基本语法

```yaml
# 这是注释

# 键值对（冒号后面要有空格）
name: my-app
version: 1.0

# 数字和布尔值
replicas: 3
enabled: true

# 字符串（可以不用引号）
description: This is a training job

# 列表（用短横线）
fruits:
  - apple
  - banana
  - orange

# 或者用方括号
fruits: [apple, banana, orange]

# 嵌套结构（用缩进，通常2个空格）
person:
  name: Zhang San
  age: 30
  address:
    city: Beijing
    street: Zhongguancun

# 相当于：
# person.name = "Zhang San"
# person.age = 30
# person.address.city = "Beijing"
```

### 6.2 Kubernetes YAML示例详解

```yaml
# API版本（告诉K8s用哪个API）
apiVersion: apps/v1

# 资源类型
kind: Deployment

# 元数据（名字、标签等）
metadata:
  name: training-job          # 这个Deployment的名字
  namespace: ml-team          # 所属的命名空间
  labels:                     # 标签（用于分类和选择）
    app: training
    team: ml-team-1

# 规格（期望的状态）
spec:
  replicas: 4                 # 要运行4个Pod
  
  selector:                   # 选择器：管理哪些Pod
    matchLabels:
      app: training
  
  template:                   # Pod模板
    metadata:
      labels:
        app: training         # Pod的标签
    
    spec:                     # Pod的规格
      containers:             # 容器列表
      - name: trainer         # 容器名
        image: pytorch/pytorch:2.0  # 镜像
        
        command:              # 启动命令
          - python
          - train.py
          - --epochs
          - "100"
        
        resources:            # 资源请求和限制
          limits:             # 最大使用量
            nvidia.com/gpu: 1
            memory: 32Gi
            cpu: 8
          requests:           # 最小保证
            nvidia.com/gpu: 1
            memory: 32Gi
            cpu: 8
        
        env:                  # 环境变量
          - name: BATCH_SIZE
            value: "64"
          - name: LEARNING_RATE
            value: "0.001"
        
        volumeMounts:         # 挂载的卷
          - name: data        # 卷的名字（对应下面的volumes）
            mountPath: /data  # 挂载到容器的哪个路径
          - name: output
            mountPath: /output
      
      volumes:                # 卷的定义
        - name: data
          persistentVolumeClaim:
            claimName: training-data-pvc  # 使用的存储卷
        - name: output
          emptyDir: {}        # 临时目录
```

### 6.3 常见的错误

```yaml
# ❌ 错误：冒号后面没有空格
name:my-app

# ✅ 正确
name: my-app

# ❌ 错误：缩进不一致（混用空格和Tab）
spec:
  replicas: 3
    selector:     # 这里缩进不对

# ✅ 正确：使用一致的缩进（2个空格）
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app

# ❌ 错误：字符串中有特殊字符没加引号
description: It's a great app!  # 单引号会导致解析错误

# ✅ 正确
description: "It's a great app!"
```

---

## 7. 快速上手练习

### 练习1：运行第一个容器

```bash
# 1. 拉取镜像
docker pull ubuntu:20.04

# 2. 运行容器
docker run -it ubuntu:20.04 /bin/bash

# 3. 在容器内执行命令
root@xxx:/# ls
root@xxx:/# echo "Hello from container"
root@xxx:/# exit

# 4. 查看容器
docker ps -a
```

### 练习2：创建一个简单的Pod

创建文件 `first-pod.yaml`：
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-first-pod
spec:
  containers:
  - name: nginx
    image: nginx:latest
    ports:
    - containerPort: 80
```

运行：
```bash
# 创建Pod
kubectl apply -f first-pod.yaml

# 查看Pod
kubectl get pods

# 查看详细信息
kubectl describe pod my-first-pod

# 查看日志
kubectl logs my-first-pod

# 进入Pod
kubectl exec -it my-first-pod -- /bin/bash

# 删除Pod
kubectl delete pod my-first-pod
```

### 练习3：运行一个简单的PyTorch训练

创建文件 `simple_train.py`：
```python
import torch
import torch.nn as nn

# 检查GPU
if torch.cuda.is_available():
    device = torch.device("cuda")
    print(f"Using GPU: {torch.cuda.get_device_name(0)}")
else:
    device = torch.device("cpu")
    print("Using CPU")

# 简单的模型
model = nn.Linear(10, 1).to(device)

# 创建一些随机数据
X = torch.randn(100, 10).to(device)
y = torch.randn(100, 1).to(device)

# 训练
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)
criterion = nn.MSELoss()

for epoch in range(100):
    optimizer.zero_grad()
    outputs = model(X)
    loss = criterion(outputs, y)
    loss.backward()
    optimizer.step()
    
    if (epoch + 1) % 10 == 0:
        print(f'Epoch [{epoch+1}/100], Loss: {loss.item():.4f}')

print("Training completed!")
```

在容器中运行：
```bash
docker run --gpus all -v $(pwd):/workspace \
  pytorch/pytorch:2.0-cuda11.8 \
  python /workspace/simple_train.py
```

---

## 8. 常见术语表

| 术语 | 解释 | 举例 |
|------|------|------|
| **镜像（Image）** | 应用的安装包 | pytorch/pytorch:2.0 |
| **容器（Container）** | 镜像运行起来的实例 | 正在运行的训练任务 |
| **Pod** | Kubernetes中最小的部署单元 | 包含一个训练容器的Pod |
| **Deployment** | 管理多个相同的Pod | 3个副本的推理服务 |
| **Service** | 提供稳定的网络访问 | 推理API的入口 |
| **Namespace** | 资源隔离的命名空间 | dev, prod |
| **YAML** | 配置文件格式 | Kubernetes配置 |
| **CUDA** | NVIDIA的GPU编程平台 | CUDA 11.8 |
| **显存（VRAM）** | GPU的内存 | A100 80GB显存 |
| **分布式训练** | 多GPU/多机器协同训练 | 8卡训练GPT |
| **DDP** | PyTorch的数据并行 | DistributedDataParallel |
| **NCCL** | GPU间通信库 | 梯度同步 |
| **节点（Node）** | Kubernetes集群中的机器 | 8卡GPU服务器 |
| **调度（Scheduling）** | 决定Pod运行在哪个节点 | GPU调度 |

---

## 9. 下一步学习路径

现在你已经有了基础知识，可以按这个顺序学习其他文档：

**初级**：
1. ✅ 本文档（基础概念）
2. `interview_prep_gpu_scheduling.md` - 理解GPU如何调度
3. `interview_prep_ai_training.md` - 学习训练的基本概念

**中级**：
4. `interview_prep_volcano_kueue.md` - 任务调度系统
5. `interview_prep_llm_inference.md` - 推理系统
6. `interview_prep_ai_ops.md` - 运维和故障处理

**高级**：
7. `interview_prep_karmada.md` - 多集群管理
8. `interview_prep_ai_agent.md` - AI Agent
9. `interview_prep_openfuyao.md` - 完整平台方案

---

## 10. 遇到问题怎么办？

### 常见问题排查思路

**问题：Pod一直处于Pending状态**
```bash
# 1. 查看Pod详情
kubectl describe pod <pod-name>

# 2. 看Events部分，常见原因：
#    - Insufficient GPU: GPU资源不够
#    - Insufficient memory: 内存不够
#    - Node not ready: 节点有问题
```

**问题：训练很慢或者GPU利用率低**
```bash
# 1. 查看GPU使用
nvidia-smi

# 2. 可能的原因：
#    - 数据加载太慢（IO瓶颈）
#    - batch size太小
#    - 没有正确使用GPU
```

**问题：Out of Memory (OOM)**
```bash
# 1. 减少batch size
# 2. 使用梯度累积
# 3. 使用混合精度训练（FP16）
# 4. 使用梯度检查点
```

### 学习资源

- **Kubernetes官方教程**：https://kubernetes.io/docs/tutorials/
- **Docker官方文档**：https://docs.docker.com/get-started/
- **PyTorch教程**：https://pytorch.org/tutorials/
- **NVIDIA深度学习教程**：https://www.nvidia.com/zh-cn/training/

---

**记住**：每个专家都是从零开始的。不要害怕犯错，多动手实践，遇到问题多查文档、多问问题。祝你学习顺利！
