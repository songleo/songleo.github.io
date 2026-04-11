# AI基础设施面试准备 - 学习路线图

## 📚 文档总览

本系列文档从零基础开始，逐步深入到AI基础设施的各个方面，帮助你全面准备AI/ML基础设施相关的面试。

---

## 🎯 学习路径

### 阶段0：零基础入门（必读）

如果你是零基础，**必须先学习这三个文档**，否则后面的内容会看不懂：

| 文档 | 内容 | 预计学习时间 |
|------|------|-------------|
| `interview_prep_00_basics.md` | **Docker、Kubernetes、GPU、Linux基础** | 2-3天 |
| `interview_prep_01_deep_learning_basics.md` | **深度学习核心概念、训练流程** | 3-4天 |
| `interview_prep_02_python_basics.md` | **Python编程、NumPy、PyTorch基础** | 2-3天 |

**学习建议**：
- 边看边动手实践，所有代码都在电脑上运行一遍
- 完成每个文档的练习题
- 不要着急，基础打牢非常重要

**验收标准**：
- [ ] 能够独立运行一个Docker容器
- [ ] 能够创建和查看Kubernetes Pod
- [ ] 理解什么是梯度下降、反向传播
- [ ] 能够用PyTorch训练一个简单的神经网络
- [ ] 熟练使用NumPy进行数组操作

---

### 阶段1：初级 - GPU调度和基础训练（1-2周）

掌握基础后，开始学习GPU资源管理和AI训练：

| 文档 | 核心内容 | 重要程度 |
|------|---------|---------|
| `interview_prep_gpu_scheduling.md` | Device Plugin、GPU共享（MIG/vGPU）、GPU监控 | ⭐⭐⭐⭐⭐ |
| `interview_prep_ai_training.md` | 数据并行、模型并行、3D并行、MoE模型 | ⭐⭐⭐⭐⭐ |

**重点掌握**：
- GPU Device Plugin的工作原理
- DDP（数据并行）如何工作
- 如何使用`nvidia-smi`监控GPU
- NCCL的作用

**实践任务**：
- [ ] 在Kubernetes中部署一个GPU Pod
- [ ] 实现一个简单的DDP训练脚本
- [ ] 配置DCGM Exporter监控GPU

---

### 阶段2：中级 - 调度系统和推理服务（2-3周）

学习任务调度和模型推理：

| 文档 | 核心内容 | 重要程度 |
|------|---------|---------|
| `interview_prep_volcano_kueue.md` | Gang Scheduling、Queue管理、Volcano vs Kueue | ⭐⭐⭐⭐ |
| `interview_prep_llm_inference.md` | vLLM PagedAttention、SGLang、Prefill/Decode分离 | ⭐⭐⭐⭐⭐ |
| `interview_prep_ai_ops.md` | 训练故障排查、GPU OOM、NCCL调试 | ⭐⭐⭐⭐ |

**重点掌握**：
- Volcano的Gang Scheduling原理
- vLLM的PagedAttention机制
- 如何排查训练OOM问题
- NCCL通信故障的调试方法

**实践任务**：
- [ ] 部署Volcano调度器
- [ ] 使用vLLM部署一个推理服务
- [ ] 模拟一个OOM故障并排查

---

### 阶段3：高级 - 多集群和平台设计（2-3周）

学习大规模系统设计：

| 文档 | 核心内容 | 重要程度 |
|------|---------|---------|
| `interview_prep_karmada.md` | 多集群管理、PropagationPolicy、Failover | ⭐⭐⭐⭐ |
| `interview_prep_ai_agent.md` | ReAct模式、Tool系统、Multi-Agent | ⭐⭐⭐ |
| `interview_prep_openfuyao.md` | 智算平台架构、资源池化、租户管理、计费 | ⭐⭐⭐⭐⭐ |

**重点掌握**：
- Karmada如何实现多集群应用分发
- 资源池化和多租户隔离
- 计费系统设计
- AI Agent的工具调用机制

**实践任务**：
- [ ] 部署Karmada管理多集群
- [ ] 设计一个GPU资源池管理方案
- [ ] 实现一个简单的AI Agent

---

## 📖 按主题分类

### 基础设施层
- `interview_prep_00_basics.md` - Docker、K8s、GPU基础
- `interview_prep_gpu_scheduling.md` - GPU调度
- `interview_prep_karmada.md` - 多集群管理

### 调度层
- `interview_prep_volcano_kueue.md` - 批调度系统
- `interview_prep_openfuyao.md` - 智算平台（包含调度）

### 训练层
- `interview_prep_01_deep_learning_basics.md` - 深度学习基础
- `interview_prep_ai_training.md` - 分布式训练

### 推理层
- `interview_prep_llm_inference.md` - LLM推理

### 运维层
- `interview_prep_ai_ops.md` - 故障排查和运维

### 应用层
- `interview_prep_ai_agent.md` - AI Agent

### 编程基础
- `interview_prep_02_python_basics.md` - Python和NumPy

---

## 🎓 针对不同岗位的学习重点

### GPU基础设施工程师
**必读**：
1. `interview_prep_00_basics.md`
2. `interview_prep_gpu_scheduling.md` ⭐⭐⭐⭐⭐
3. `interview_prep_ai_ops.md`
4. `interview_prep_openfuyao.md`

**重点掌握**：
- GPU Device Plugin
- GPU共享技术（MIG、vGPU、Time-Slicing）
- GPU故障排查
- GPU监控体系

---

### AI训练平台工程师
**必读**：
1. `interview_prep_01_deep_learning_basics.md`
2. `interview_prep_ai_training.md` ⭐⭐⭐⭐⭐
3. `interview_prep_volcano_kueue.md`
4. `interview_prep_ai_ops.md`
5. `interview_prep_openfuyao.md`

**重点掌握**：
- 3D并行训练
- Gang Scheduling
- Checkpoint管理
- 训练故障自动恢复

---

### AI推理平台工程师
**必读**：
1. `interview_prep_01_deep_learning_basics.md`
2. `interview_prep_llm_inference.md` ⭐⭐⭐⭐⭐
3. `interview_prep_gpu_scheduling.md`
4. `interview_prep_openfuyao.md`

**重点掌握**：
- vLLM/SGLang推理框架
- PagedAttention机制
- Prefill/Decode分离
- 推理优化技术

---

### Kubernetes调度工程师
**必读**：
1. `interview_prep_00_basics.md`
2. `interview_prep_volcano_kueue.md` ⭐⭐⭐⭐⭐
3. `interview_prep_gpu_scheduling.md`
4. `interview_prep_karmada.md`

**重点掌握**：
- Gang Scheduling
- Queue管理
- 多集群调度
- GPU亲和性调度

---

### AI平台架构师
**全部必读**，重点：
1. `interview_prep_openfuyao.md` ⭐⭐⭐⭐⭐
2. `interview_prep_karmada.md`
3. `interview_prep_ai_training.md`
4. `interview_prep_llm_inference.md`

**重点掌握**：
- 整体平台架构设计
- 多租户管理
- 资源配额和计费
- 全生命周期管理

---

## 💡 学习建议

### 1. 先理解概念，再看代码
- 每个文档都先看"原理"部分，理解为什么需要这个技术
- 再看代码实现，理解如何实现

### 2. 动手实践
- 所有代码示例都亲自运行一遍
- 尝试修改参数，观察结果变化
- 遇到报错不要怕，查文档解决

### 3. 画图帮助理解
- 分布式系统很抽象，画架构图帮助理解
- 数据流程图、时序图都很有用

### 4. 对比学习
- 比如Volcano vs Kueue，对比异同
- Data Parallelism vs Model Parallelism vs Pipeline Parallelism

### 5. 关联现实场景
- 每学一个技术，想想它解决什么问题
- 比如：为什么GPT-3需要模型并行？因为单卡放不下

---

## 📝 面试准备清单

### 基础概念（必须掌握）
- [ ] 什么是容器和镜像
- [ ] Kubernetes的Pod、Deployment、Service
- [ ] GPU的显存、CUDA、cuDNN
- [ ] 什么是梯度下降、反向传播
- [ ] 前向传播和反向传播的区别
- [ ] 什么是Epoch、Batch、Learning Rate

### GPU相关
- [ ] Device Plugin的工作原理
- [ ] GPU共享的三种方式（MIG、vGPU、Time-Slicing）
- [ ] 如何监控GPU利用率和显存
- [ ] GPU OOM如何排查
- [ ] NVIDIA-SMI的常用命令

### 分布式训练
- [ ] 数据并行（DDP）的原理
- [ ] 模型并行的原理
- [ ] Pipeline并行的原理
- [ ] 3D并行如何组合
- [ ] NCCL的作用和调优
- [ ] AllReduce的原理

### 调度系统
- [ ] Gang Scheduling是什么，为什么需要
- [ ] Volcano的核心组件
- [ ] Kueue和Volcano的区别
- [ ] 如何实现GPU亲和性调度
- [ ] 优先级和抢占的机制

### 推理系统
- [ ] PagedAttention的原理
- [ ] Continuous Batching是什么
- [ ] Prefill和Decode的区别
- [ ] KV Cache的作用
- [ ] 推理优化的常见方法

### 运维问题
- [ ] 训练任务一直Pending怎么办
- [ ] GPU OOM如何定位和解决
- [ ] NCCL timeout如何调试
- [ ] 如何实现训练自动恢复
- [ ] Checkpoint管理策略

### 系统设计
- [ ] 如何设计多租户GPU集群
- [ ] 如何实现资源配额和计费
- [ ] 如何保证训练任务的高可用
- [ ] 如何监控和告警
- [ ] 如何优化GPU利用率

---

## 🔧 实践环境搭建

### 最小化环境（本地学习）
```bash
# 1. 安装Docker
# 2. 安装Minikube（本地Kubernetes）
minikube start --driver=docker

# 3. 安装Python和PyTorch
pip install torch torchvision numpy pandas matplotlib

# 4. 运行第一个示例
python -c "import torch; print(torch.__version__)"
```

### 完整环境（如果有GPU）
```bash
# 1. 安装NVIDIA驱动
# 2. 安装CUDA Toolkit
# 3. 安装Docker + NVIDIA Container Toolkit
# 4. 安装Kubernetes（kubeadm或k3s）
# 5. 安装GPU Operator
# 6. 部署Volcano/Kueue调度器
```

---

## 📅 30天学习计划

### 第1周：基础打底
- Day 1-2: `interview_prep_00_basics.md`
- Day 3-4: `interview_prep_02_python_basics.md`
- Day 5-7: `interview_prep_01_deep_learning_basics.md`

### 第2周：GPU和训练
- Day 8-10: `interview_prep_gpu_scheduling.md`
- Day 11-14: `interview_prep_ai_training.md`

### 第3周：调度和推理
- Day 15-17: `interview_prep_volcano_kueue.md`
- Day 18-21: `interview_prep_llm_inference.md`

### 第4周：高级和运维
- Day 22-24: `interview_prep_ai_ops.md`
- Day 25-26: `interview_prep_karmada.md`
- Day 27-28: `interview_prep_openfuyao.md`
- Day 29-30: 复习和模拟面试

---

## 🎤 模拟面试问题

### 基础问题
1. 请解释什么是容器，为什么AI训练需要容器化？
2. Kubernetes中Pod和Container的区别是什么？
3. 为什么深度学习需要GPU而不是CPU？
4. 什么是反向传播？请简单解释梯度下降的过程。

### 中级问题
1. 请解释GPU Device Plugin是如何工作的？
2. 数据并行和模型并行有什么区别？各适用于什么场景？
3. Gang Scheduling解决了什么问题？Volcano是如何实现的？
4. vLLM的PagedAttention是如何优化显存使用的？

### 高级问题
1. 如何设计一个支持多租户的GPU集群？需要考虑哪些方面？
2. 训练一个175B参数的大模型，如何规划GPU资源和并行策略？
3. 如果GPU利用率只有30%，你会从哪些方面排查问题？
4. 设计一个LLM推理系统，如何保证低延迟和高吞吐？

### 系统设计问题
1. 设计一个支持1000个用户、100块GPU的AI训练平台
2. 如何实现训练任务的自动重启和Checkpoint管理？
3. 设计一个计费系统，按GPU使用时长计费
4. 如何监控和告警GPU故障、训练任务失败？

---

## 📚 推荐的补充资源

### 官方文档
- Kubernetes: https://kubernetes.io/docs/
- PyTorch: https://pytorch.org/docs/
- NVIDIA CUDA: https://docs.nvidia.com/cuda/
- Volcano: https://volcano.sh/
- Karmada: https://karmada.io/

### 论文阅读
- Attention Is All You Need (Transformer)
- Megatron-LM: Training Multi-Billion Parameter Language Models
- vLLM: Efficient Memory Management for Large Language Model Serving
- DeepSpeed: System Optimizations Enable Training Deep Learning Models

### 开源项目
- DeepSpeed: https://github.com/microsoft/DeepSpeed
- Megatron-LM: https://github.com/NVIDIA/Megatron-LM
- vLLM: https://github.com/vllm-project/vllm
- Ray: https://github.com/ray-project/ray

---

## ✅ 学完所有文档后，你将掌握：

1. **基础能力**
   - 熟练使用Docker和Kubernetes
   - 理解深度学习的核心原理
   - 能够编写PyTorch训练代码

2. **专业技能**
   - GPU资源管理和调度
   - 分布式训练（DDP、Pipeline、3D并行）
   - LLM推理优化
   - 故障排查和运维

3. **架构能力**
   - 多租户集群设计
   - 资源配额和计费
   - 高可用性设计
   - 监控告警体系

4. **面试能力**
   - 回答常见面试问题
   - 解决实际问题的能力
   - 系统设计思维

---

## 🚀 开始学习

**零基础的同学从这里开始**：
1. 打开 `interview_prep_00_basics.md`
2. 准备一台电脑（有Linux更好）
3. 边看边实践，运行每一段代码
4. 完成练习题
5. 遇到问题先Google，再问人

**有基础的同学**：
- 直接跳到你感兴趣的主题
- 建议按学习路径顺序阅读
- 重点看代码实现和系统设计部分

**祝你学习顺利！记住：实践是最好的老师！** 💪

---

## 📧 文档更新

本系列文档会持续更新，添加新的技术和实践案例。

最后更新：2024年

祝面试成功！🎉
