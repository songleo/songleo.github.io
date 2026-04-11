# 智算集群运维面试准备文档

AI训练作业故障排查与根因分析

---

## 一、训练作业故障分类

### 1. 训练作业失败的常见原因有哪些？

**参考答案：**

**故障分类树：**

```
训练作业故障
├── 资源问题 (40%)
│   ├── GPU OOM
│   ├── CPU/内存不足
│   ├── 存储 IO 瓶颈
│   └── 网络带宽不足
├── 软件问题 (30%)
│   ├── CUDA 错误
│   ├── 库版本不兼容
│   ├── 代码 Bug
│   └── 数据问题
├── 硬件问题 (20%)
│   ├── GPU 故障
│   ├── NVLink 错误
│   ├── IB/RDMA 故障
│   └── 节点宕机
└── 配置问题 (10%)
    ├── 超参数错误
    ├── 调度配置
    └── 环境变量
```

**快速诊断流程：**

```bash
#!/bin/bash
# quick-diagnose.sh - 训练作业快速诊断脚本

JOB_NAME=$1
NAMESPACE=${2:-default}

echo "=== 1. 检查 Pod 状态 ==="
kubectl get pod -n $NAMESPACE -l job-name=$JOB_NAME

echo -e "\n=== 2. 查看最近事件 ==="
kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -20

echo -e "\n=== 3. 检查日志 ==="
POD=$(kubectl get pod -n $NAMESPACE -l job-name=$JOB_NAME -o jsonpath='{.items[0].metadata.name}')
kubectl logs -n $NAMESPACE $POD --tail=100

echo -e "\n=== 4. 检查 GPU 状态 ==="
kubectl exec -n $NAMESPACE $POD -- nvidia-smi

echo -e "\n=== 5. 检查资源使用 ==="
kubectl top pod -n $NAMESPACE $POD
```

---

## 二、GPU OOM 排查

### 2. GPU OOM 如何快速定位和解决？

**排查步骤：**

**Step 1: 确认是 GPU OOM**
```bash
# 查看日志关键词
kubectl logs <pod> | grep -i "out of memory\|OOM\|CUDA"

# 常见错误信息
"""
CUDA out of memory. Tried to allocate 2.00 GiB
RuntimeError: CUDA error: out of memory
"""
```

**Step 2: 分析显存占用**
```python
# 在训练代码中添加显存监控
import torch

def print_gpu_memory():
    for i in range(torch.cuda.device_count()):
        allocated = torch.cuda.memory_allocated(i) / 1024**3
        reserved = torch.cuda.memory_reserved(i) / 1024**3
        print(f"GPU {i}: Allocated={allocated:.2f}GB, Reserved={reserved:.2f}GB")

# 训练循环中定期打印
for epoch in range(num_epochs):
    for batch in dataloader:
        loss = train_step(batch)
        
        if batch_idx % 100 == 0:
            print_gpu_memory()
```

**Step 3: 根因分析**

```python
# 常见原因及解决方案

# 1. Batch Size 过大
# 解决：减小 batch size 或使用梯度累积
batch_size = 32  # 改为 16
accumulation_steps = 2  # 等效 batch_size=32

# 2. 模型过大
# 解决：混合精度训练
from torch.cuda.amp import autocast, GradScaler
scaler = GradScaler()

with autocast():
    output = model(input)
    loss = criterion(output, target)

# 3. 显存泄漏
# 解决：及时释放不需要的tensor
loss = loss.item()  # 不要保存tensor
torch.cuda.empty_cache()  # 释放缓存

# 4. 激活值占用过多
# 解决：Activation Checkpointing
from torch.utils.checkpoint import checkpoint
output = checkpoint(layer, input)  # 重计算激活值
```

---

## 三、NCCL 通信故障

### 3. 分布式训练 NCCL 超时如何排查？

**常见错误：**
```
[E ProcessGroupNCCL.cpp:828] NCCL error: unhandled system error
NCCL timeout
```

**排查流程：**

```bash
# 1. 启用 NCCL 调试
export NCCL_DEBUG=INFO
export NCCL_DEBUG_SUBSYS=ALL

# 2. 检查网络连通性
# Pod 间 ping
kubectl exec worker-0 -- ping worker-1

# 检查 RDMA/IB
kubectl exec worker-0 -- ibstatus
kubectl exec worker-0 -- ibv_devinfo

# 3. 测试 NCCL 通信
kubectl exec worker-0 -- /opt/nccl-tests/build/all_reduce_perf -b 8 -e 256M -f 2 -g 8

# 4. 检查防火墙
iptables -L -n | grep DROP

# 5. 检查 NCCL 配置
env | grep NCCL
```

**常见解决方案：**
```yaml
# NCCL 环境变量优化
env:
- name: NCCL_SOCKET_IFNAME
  value: "eth0"  # 指定网络接口
- name: NCCL_IB_DISABLE
  value: "0"     # 启用 InfiniBand
- name: NCCL_TIMEOUT
  value: "3600"  # 增加超时时间
- name: NCCL_IB_HCA
  value: "mlx5_0,mlx5_1"
- name: NCCL_DEBUG
  value: "INFO"
```

---

## 四、数据加载瓶颈

### 4. 训练速度慢，如何判断是否IO瓶颈？

**诊断方法：**

```python
import time

# 测量数据加载时间
data_times = []
compute_times = []

for batch in dataloader:
    t0 = time.time()
    data = batch.to('cuda')
    data_time = time.time() - t0
    
    t1 = time.time()
    loss = train_step(data)
    compute_time = time.time() - t1
    
    data_times.append(data_time)
    compute_times.append(compute_time)
    
    if len(data_times) % 100 == 0:
        print(f"Data loading: {np.mean(data_times[-100:]):.3f}s")
        print(f"Compute: {np.mean(compute_times[-100:]):.3f}s")
        
        if np.mean(data_times[-100:]) > np.mean(compute_times[-100:]):
            print("WARNING: IO bottleneck detected!")
```

**优化方案：**

```python
# 1. 增加 DataLoader workers
train_loader = DataLoader(
    dataset,
    batch_size=32,
    num_workers=8,  # 增加到 CPU核心数
    pin_memory=True,  # 加速 CPU->GPU 传输
    prefetch_factor=2,  # 预取2个batch
    persistent_workers=True  # 保持worker进程
)

# 2. 使用更快的存储
# - 本地 NVMe SSD
# - 分布式文件系统（Lustre, WekaFS）
# - 对象存储预热

# 3. 数据预处理优化
# 离线预处理，保存为 .pt 文件
torch.save(processed_data, 'data.pt')
# 训练时直接加载
data = torch.load('data.pt')

# 4. 使用 WebDataset (大规模训练)
import webdataset as wds

dataset = (
    wds.WebDataset(urls)
    .shuffle(1000)
    .decode("torchrgb")
    .to_tuple("jpg", "cls")
)
```

---

## 五、GPU 硬件故障

### 5. GPU 硬件故障如何检测和处理？

**检测方法：**

```bash
#!/bin/bash
# gpu-health-check.sh

echo "=== GPU 基础信息 ==="
nvidia-smi -L

echo -e "\n=== GPU 温度和功耗 ==="
nvidia-smi --query-gpu=index,temperature.gpu,power.draw --format=csv

echo -e "\n=== ECC 错误 ==="
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv

echo -e "\n=== Xid 错误 ==="
dmesg | grep -i "xid"

echo -e "\n=== GPU 拓扑 ==="
nvidia-smi topo -m

echo -e "\n=== NVLink 状态 ==="
nvidia-smi nvlink --status

echo -e "\n=== GPU 压测 ==="
nvidia-smi dcgm diag -r 3  # 运行诊断测试
```

**常见 Xid 错误：**
```
Xid 13: Graphics Engine Exception
Xid 31: GPU Memory Page Fault
Xid 43: GPU stopped responding
Xid 48: Double Bit ECC Error
Xid 63: GPU has fallen off the bus
Xid 79: GPU has fallen off the bus (permanent)
```

**处理流程：**
```bash
# 1. 软重置
nvidia-smi -r -i 0

# 2. 隔离故障 GPU
kubectl cordon gpu-node-1
kubectl drain gpu-node-1 --ignore-daemonsets

# 3. 重启节点
systemctl reboot

# 4. 更换 GPU (硬件故障)
# 5. 恢复节点
kubectl uncordon gpu-node-1
```

---

## 六、训练卡住（Hang）

### 6. 训练进程卡住不动如何排查？

**症状：**
- GPU 利用率 0%
- 日志无输出
- 进程存活但无响应

**排查步骤：**

```bash
# 1. 检查进程状态
ps aux | grep python
top -p <pid>

# 2. 查看进程堆栈
py-spy dump --pid <pid>
# 或
gdb -p <pid>
(gdb) thread apply all bt

# 3. 检查是否死锁
# Python 代码加入超时检测
import signal
import functools

def timeout(seconds):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            def handler(signum, frame):
                raise TimeoutError(f"Function {func.__name__} timed out")
            
            signal.signal(signal.SIGALRM, handler)
            signal.alarm(seconds)
            try:
                result = func(*args, **kwargs)
            finally:
                signal.alarm(0)
            return result
        return wrapper
    return decorator

@timeout(300)  # 5分钟超时
def train_step(batch):
    ...
```

**常见原因：**
```python
# 1. 死锁 (多进程/多线程)
# 解决：使用 timeout 或 watchdog

# 2. 等待数据
# 检查 DataLoader
# 增加 timeout
train_loader = DataLoader(..., timeout=60)

# 3. NCCL 卡住
# 增加 NCCL_TIMEOUT
export NCCL_ASYNC_ERROR_HANDLING=1

# 4. Checkpoint 保存卡住
# 异步保存
import threading

def save_checkpoint_async(state, path):
    t = threading.Thread(target=lambda: torch.save(state, path))
    t.start()
```

---

## 七、日志收集与分析

### 7. 如何高效收集和分析训练日志？

**日志收集架构：**

```
┌───────────────────────────┐
│  Training Pods            │
│  - stdout/stderr → JSON   │
└──────────┬────────────────┘
           │
┌──────────▼────────────────┐
│  Fluent Bit (DaemonSet)   │
│  - 收集容器日志            │
│  - 解析 JSON               │
│  - 过滤和转换              │
└──────────┬────────────────┘
           │
┌──────────▼────────────────┐
│  Kafka / Fluentd          │
│  - 日志聚合                │
│  - 缓冲                    │
└──────────┬────────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐    ┌────▼─────┐
│ Loki  │    │ Splunk   │
│       │    │          │
└───┬───┘    └────┬─────┘
    │             │
┌───▼─────────────▼────┐
│  Grafana / Kibana    │
│  - 日志查询和可视化   │
└──────────────────────┘
```

**结构化日志：**

```python
import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "job_name": os.getenv("JOB_NAME"),
            "rank": int(os.getenv("RANK", "0")),
        }
        
        # 添加额外字段
        if hasattr(record, "loss"):
            log_data["loss"] = record.loss
        if hasattr(record, "lr"):
            log_data["lr"] = record.lr
        
        return json.dumps(log_data)

# 配置
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger = logging.getLogger()
logger.addHandler(handler)

# 使用
logger.info("Training step completed", extra={"loss": 0.5, "lr": 1e-4})
```

**关键指标提取：**

```python
import re

# 从日志提取训练指标
def parse_training_log(log_line):
    patterns = {
        "loss": r"loss[:\s]+([0-9.]+)",
        "accuracy": r"acc[uracy]*[:\s]+([0-9.]+)",
        "lr": r"lr[:\s]+([0-9.e-]+)",
        "throughput": r"([0-9.]+)\s+samples/sec",
    }
    
    metrics = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, log_line, re.IGNORECASE)
        if match:
            metrics[key] = float(match.group(1))
    
    return metrics

# Prometheus 导出
from prometheus_client import Gauge

loss_gauge = Gauge('training_loss', 'Training loss')
acc_gauge = Gauge('training_accuracy', 'Training accuracy')

for line in log_stream:
    metrics = parse_training_log(line)
    if "loss" in metrics:
        loss_gauge.set(metrics["loss"])
    if "accuracy" in metrics:
        acc_gauge.set(metrics["accuracy"])
```

---

## 八、故障自愈

### 8. 如何实现训练作业的自动恢复？

**Checkpoint 策略：**

```python
import torch
import os
from pathlib import Path

class CheckpointManager:
    def __init__(self, checkpoint_dir, keep_last_n=3):
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.keep_last_n = keep_last_n
    
    def save(self, model, optimizer, epoch, loss, metrics=None):
        """保存 checkpoint"""
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'loss': loss,
            'metrics': metrics or {},
        }
        
        # 保存到本地
        local_path = self.checkpoint_dir / f"checkpoint_epoch_{epoch}.pt"
        torch.save(checkpoint, local_path)
        
        # 上传到对象存储（持久化）
        s3_path = f"s3://training-checkpoints/{os.getenv('JOB_NAME')}/epoch_{epoch}.pt"
        self.upload_to_s3(local_path, s3_path)
        
        # 清理旧 checkpoint
        self.cleanup_old_checkpoints()
    
    def load_latest(self):
        """加载最新 checkpoint"""
        checkpoints = sorted(self.checkpoint_dir.glob("checkpoint_*.pt"))
        if not checkpoints:
            return None
        
        latest = checkpoints[-1]
        return torch.load(latest)
    
    def cleanup_old_checkpoints(self):
        """保留最近N个checkpoint"""
        checkpoints = sorted(self.checkpoint_dir.glob("checkpoint_*.pt"))
        for ckpt in checkpoints[:-self.keep_last_n]:
            ckpt.unlink()

# 使用
ckpt_mgr = CheckpointManager("./checkpoints")

# 训练循环
start_epoch = 0
if os.path.exists("./checkpoints"):
    ckpt = ckpt_mgr.load_latest()
    if ckpt:
        model.load_state_dict(ckpt['model_state_dict'])
        optimizer.load_state_dict(ckpt['optimizer_state_dict'])
        start_epoch = ckpt['epoch'] + 1
        print(f"Resumed from epoch {start_epoch}")

for epoch in range(start_epoch, num_epochs):
    loss = train_epoch(model, optimizer, train_loader)
    
    # 定期保存
    if (epoch + 1) % 10 == 0:
        ckpt_mgr.save(model, optimizer, epoch, loss)
```

**作业级别自愈：**

```yaml
# Kubernetes Job with restart policy
apiVersion: batch/v1
kind: Job
metadata:
  name: training-job
spec:
  backoffLimit: 3  # 最多重试3次
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: trainer
        image: pytorch/pytorch:2.0.0
        command: ["python", "train.py"]
        args: ["--resume-from-checkpoint"]  # 自动恢复
        env:
        - name: CHECKPOINT_DIR
          value: "/checkpoints"
        volumeMounts:
        - name: checkpoints
          mountPath: /checkpoints
      volumes:
      - name: checkpoints
        persistentVolumeClaim:
          claimName: training-ckpt
```

---

## 九、监控最佳实践

### 9. 训练作业应该监控哪些指标？

**监控层次：**

```
监控金字塔
├── 业务指标 (最重要)
│   ├── Loss下降速度
│   ├── Accuracy 提升
│   └── 训练完成时间
├── 性能指标
│   ├── Throughput (samples/sec)
│   ├── GPU 利用率
│   └── 内存使用率
├── 资源指标
│   ├── GPU 温度/功耗
│   ├── Network 带宽
│   └── Storage IO
└── 基础设施
    ├── 节点健康
    ├── Pod 状态
    └── 集群资源
```

**告警规则：**

```yaml
groups:
- name: training
  rules:
  # 训练停滞
  - alert: TrainingStalled
    expr: rate(training_samples_total[5m]) == 0
    for: 10m
    labels:
      severity: critical
    annotations:
      summary: "Training not progressing"
  
  # GPU 高温
  - alert: GPUHighTemperature
    expr: DCGM_FI_DEV_GPU_TEMP > 85
    for: 5m
    labels:
      severity: warning
  
  # Loss 异常
  - alert: LossDiverging
    expr: training_loss > 100 or training_loss != training_loss  # NaN
    labels:
      severity: critical
  
  # 吞吐量下降
  - alert: ThroughputDrop
    expr: |
      (rate(training_samples_total[5m]) 
       / rate(training_samples_total[5m] offset 1h)) < 0.5
    for: 10m
    labels:
      severity: warning
```

---

## 十、故障排查清单

### 10. 标准故障排查流程？

**5分钟快速诊断：**

```bash
#!/bin/bash
# 5-minute-diagnosis.sh

set -e

JOB_NAME=$1

echo "=== 1. Job 状态 ===" 
kubectl get job $JOB_NAME -o wide

echo -e "\n=== 2. Pod 状态 ==="
kubectl get pod -l job-name=$JOB_NAME -o wide

echo -e "\n=== 3. 最近事件 ==="
kubectl get events --field-selector involvedObject.name=$JOB_NAME --sort-by='.lastTimestamp' | tail -10

echo -e "\n=== 4. 日志尾部 ==="
POD=$(kubectl get pod -l job-name=$JOB_NAME -o jsonpath='{.items[0].metadata.name}')
kubectl logs $POD --tail=50

echo -e "\n=== 5. GPU 状态 ==="
kubectl exec $POD -- nvidia-smi --query-gpu=index,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv

echo -e "\n=== 6. NCCL 测试 ==="
kubectl exec $POD -- env | grep NCCL

echo -e "\n=== 7. 资源使用 ==="
kubectl top pod $POD
```

**完整排查清单：**

```markdown
## 训练作业故障排查清单

### 基础检查
- [ ] 查看 Pod 状态 (Running/Failed/Pending)
- [ ] 检查最近事件 (kubectl get events)
- [ ] 查看日志 (kubectl logs)
- [ ] 检查 Pod 资源请求是否合理

### GPU 相关
- [ ] GPU 可见性 (nvidia-smi)
- [ ] GPU 内存使用 (nvidia-smi)
- [ ] GPU 温度/功耗
- [ ] ECC 错误
- [ ] Xid 错误 (dmesg)
- [ ] NVLink 状态

### 网络相关
- [ ] Pod 间连通性 (ping)
- [ ] NCCL 配置 (环境变量)
- [ ] IB/RDMA 状态 (ibstatus)
- [ ] 防火墙规则
- [ ] 网络带宽

### 存储相关
- [ ] PVC 绑定状态
- [ ] 磁盘空间
- [ ] IO 延迟 (iostat)
- [ ] 数据加载时间

### 代码相关
- [ ] 代码版本
- [ ] 依赖版本 (torch, cuda)
- [ ] 配置文件
- [ ] Checkpoint 路径

### 分布式训练
- [ ] 所有 Worker 状态
- [ ] Rank/World Size
- [ ] Master 地址和端口
- [ ] Backend (nccl/gloo)
```

---

## 致谢

本文档介绍了智算集群运维中训练作业故障排查的核心方法和经验，涵盖了从快速诊断到根因分析的完整流程。

**延伸阅读：**
- [NVIDIA DCGM](https://docs.nvidia.com/datacenter/dcgm/)
- [NCCL Troubleshooting](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/troubleshooting.html)
- [PyTorch Distributed](https://pytorch.org/tutorials/beginner/dist_overview.html)
