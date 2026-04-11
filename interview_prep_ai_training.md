# AI 模型训练面试准备文档

深入解析大模型训练：3D 并行、MoE 架构与分布式训练优化

---

## 一、分布式训练基础

### 1. 为什么需要分布式训练？有哪些并行策略？

**参考答案：**

**分布式训练的必要性：**

**模型规模增长：**
```
GPT-2 (2019):      1.5B 参数
GPT-3 (2020):      175B 参数
GPT-4 (2023):      ~1.8T 参数
Llama 2 70B:       70B 参数
Llama 3 405B:      405B 参数
```

**单卡限制：**
```
NVIDIA A100 (80GB):
  - 混合精度 (FP16): 可训练 ~10B 参数模型
  - 全精度 (FP32): 可训练 ~5B 参数模型
  
NVIDIA H100 (80GB):
  - 混合精度: 可训练 ~13B 参数模型
```

**计算：**
```python
# 模型参数内存占用估算
def estimate_memory(params, precision="fp16"):
    bytes_per_param = {
        "fp32": 4,
        "fp16": 2,
        "bf16": 2,
        "int8": 1
    }
    
    # 模型参数
    model_memory = params * bytes_per_param[precision]
    
    # 梯度
    gradient_memory = params * bytes_per_param[precision]
    
    # 优化器状态（Adam：2个状态）
    optimizer_memory = params * 4 * 2  # FP32
    
    # 激活值（估算）
    activation_memory = model_memory * 0.5
    
    total = model_memory + gradient_memory + optimizer_memory + activation_memory
    return total / (1024**3)  # GB

# 示例
print(f"70B 模型训练需要: {estimate_memory(70e9):.2f} GB")
# 输出: 70B 模型训练需要: 560 GB
# 单卡 A100 80GB 无法容纳！
```

**并行策略分类：**

```
并行策略体系
├── 数据并行 (Data Parallelism, DP)
│   ├── DDP (Distributed Data Parallel)
│   └── FSDP (Fully Sharded Data Parallel)
├── 模型并行 (Model Parallelism, MP)
│   ├── 张量并行 (Tensor Parallelism, TP)
│   └── 流水线并行 (Pipeline Parallelism, PP)
├── 3D 并行 (DP + TP + PP)
└── 序列并行 (Sequence Parallelism, SP)
```

**并行策略对比：**

| 策略 | 切分维度 | 通信开销 | 适用场景 | 难度 |
|------|---------|---------|---------|------|
| DP | 数据 | 梯度同步 | 小模型 | ⭐ |
| TP | 模型层内 | AllReduce | 中等模型 | ⭐⭐⭐ |
| PP | 模型层间 | P2P | 大模型 | ⭐⭐⭐⭐ |
| 3D | 数据+模型 | 混合 | 超大模型 | ⭐⭐⭐⭐⭐ |

---

## 二、数据并行 (Data Parallelism)

### 2. 什么是数据并行？DDP 和 FSDP 有什么区别？

**参考答案：**

**数据并行原理：**

```
┌─────────────────────────────────────┐
│  数据并行 (Data Parallelism)        │
├─────────────────────────────────────┤
│                                     │
│  GPU 0: Model Replica 0             │
│  ├─ Batch 0 (data shard 0)          │
│  └─ 前向 → 反向 → 梯度              │
│                                     │
│  GPU 1: Model Replica 1             │
│  ├─ Batch 1 (data shard 1)          │
│  └─ 前向 → 反向 → 梯度              │
│                                     │
│  GPU 2: Model Replica 2             │
│  ├─ Batch 2 (data shard 2)          │
│  └─ 前向 → 反向 → 梯度              │
│                                     │
│  GPU 3: Model Replica 3             │
│  ├─ Batch 3 (data shard 3)          │
│  └─ 前向 → 反向 → 梯度              │
│                                     │
│  ┌───────────────────────┐          │
│  │  AllReduce 同步梯度    │          │
│  │  平均梯度 → 更新参数   │          │
│  └───────────────────────┘          │
└─────────────────────────────────────┘
```

**PyTorch DDP 实现：**

```python
import torch
import torch.distributed as dist
import torch.nn as nn
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler

def setup(rank, world_size):
    """初始化分布式环境"""
    # 设置环境变量
    os.environ['MASTER_ADDR'] = 'localhost'
    os.environ['MASTER_PORT'] = '12355'
    
    # 初始化进程组
    dist.init_process_group(
        backend='nccl',  # NVIDIA GPU 使用 nccl
        rank=rank,
        world_size=world_size
    )
    
    # 设置当前设备
    torch.cuda.set_device(rank)

def cleanup():
    """清理分布式环境"""
    dist.destroy_process_group()

def train(rank, world_size):
    print(f"Running DDP on rank {rank}")
    setup(rank, world_size)
    
    # 创建模型并移到 GPU
    model = nn.Linear(10, 10).to(rank)
    
    # 使用 DDP 包装模型
    ddp_model = DDP(model, device_ids=[rank])
    
    # 创建数据集和 DistributedSampler
    dataset = YourDataset()
    sampler = DistributedSampler(
        dataset,
        num_replicas=world_size,
        rank=rank,
        shuffle=True
    )
    
    dataloader = DataLoader(
        dataset,
        batch_size=32,
        sampler=sampler,
        num_workers=4,
        pin_memory=True
    )
    
    # 训练循环
    optimizer = torch.optim.Adam(ddp_model.parameters(), lr=0.001)
    loss_fn = nn.CrossEntropyLoss()
    
    for epoch in range(num_epochs):
        # 设置 epoch（重要！确保每个 epoch shuffle 不同）
        sampler.set_epoch(epoch)
        
        for batch_idx, (data, target) in enumerate(dataloader):
            data, target = data.to(rank), target.to(rank)
            
            # 前向传播
            output = ddp_model(data)
            loss = loss_fn(output, target)
            
            # 反向传播
            optimizer.zero_grad()
            loss.backward()  # DDP 自动同步梯度
            optimizer.step()
            
            if rank == 0 and batch_idx % 100 == 0:
                print(f"Epoch {epoch}, Batch {batch_idx}, Loss: {loss.item()}")
    
    cleanup()

# 启动多进程
if __name__ == "__main__":
    world_size = 4  # 4 个 GPU
    torch.multiprocessing.spawn(
        train,
        args=(world_size,),
        nprocs=world_size,
        join=True
    )
```

**DDP 通信流程：**

```python
# 反向传播时的通信
"""
1. 每个 GPU 独立计算梯度
2. AllReduce 同步梯度（Ring-AllReduce）
   
   GPU 0 梯度: [g0_0, g0_1, g0_2, ...]
   GPU 1 梯度: [g1_0, g1_1, g1_2, ...]
   GPU 2 梯度: [g2_0, g2_1, g2_2, ...]
   GPU 3 梯度: [g3_0, g3_1, g3_2, ...]
   
   Ring-AllReduce:
   Round 1: GPU 0 → 1 → 2 → 3 → 0 (累加)
   Round 2: GPU 0 → 1 → 2 → 3 → 0 (广播)
   
   结果: 所有 GPU 获得平均梯度
   [(g0+g1+g2+g3)/4, ...]
   
3. 每个 GPU 用相同梯度更新参数
"""
```

**FSDP (Fully Sharded Data Parallel)：**

**FSDP 原理：**

```
DDP vs FSDP 内存占用对比

DDP (每个 GPU):
├─ 模型参数: 100%
├─ 梯度:     100%
└─ 优化器状态: 100%
总计: 300% 模型大小

FSDP (每个 GPU):
├─ 模型参数: 100% / N (分片)
├─ 梯度:     100% / N
└─ 优化器状态: 100% / N
总计: 300% / N 模型大小

示例 (70B 模型, 8 GPUs):
DDP:  每卡需要 560 GB (不可行)
FSDP: 每卡需要 70 GB (可行！)
```

**FSDP 实现：**

```python
from torch.distributed.fsdp import (
    FullyShardedDataParallel as FSDP,
    MixedPrecision,
    BackwardPrefetch,
    ShardingStrategy,
    CPUOffload,
)
from torch.distributed.fsdp.wrap import (
    size_based_auto_wrap_policy,
    transformer_auto_wrap_policy,
)

def setup_fsdp_model(model, rank):
    # 混合精度策略
    mixed_precision_policy = MixedPrecision(
        param_dtype=torch.bfloat16,  # 参数用 BF16
        reduce_dtype=torch.float32,  # 梯度规约用 FP32
        buffer_dtype=torch.bfloat16,
    )
    
    # 自动包装策略（按 Transformer 层）
    from transformers.models.llama.modeling_llama import LlamaDecoderLayer
    
    auto_wrap_policy = functools.partial(
        transformer_auto_wrap_policy,
        transformer_layer_cls={LlamaDecoderLayer},
    )
    
    # FSDP 配置
    fsdp_model = FSDP(
        model,
        auto_wrap_policy=auto_wrap_policy,
        mixed_precision=mixed_precision_policy,
        sharding_strategy=ShardingStrategy.FULL_SHARD,  # 完全分片
        backward_prefetch=BackwardPrefetch.BACKWARD_PRE,  # 预取优化
        cpu_offload=CPUOffload(offload_params=False),  # 可选 CPU offload
        device_id=rank,
    )
    
    return fsdp_model

# 训练循环（与 DDP 类似）
def train_fsdp(rank, world_size):
    setup(rank, world_size)
    
    model = LlamaForCausalLM.from_pretrained("meta-llama/Llama-2-70b-hf")
    fsdp_model = setup_fsdp_model(model, rank)
    
    optimizer = torch.optim.AdamW(fsdp_model.parameters(), lr=1e-5)
    
    for epoch in range(num_epochs):
        for batch in dataloader:
            input_ids = batch['input_ids'].to(rank)
            labels = batch['labels'].to(rank)
            
            # 前向传播
            outputs = fsdp_model(input_ids=input_ids, labels=labels)
            loss = outputs.loss
            
            # 反向传播
            loss.backward()
            optimizer.step()
            optimizer.zero_grad()
```

**FSDP 工作流程：**

```python
"""
FSDP 前向传播:
1. 每层计算前，AllGather 收集该层参数
2. 计算完成后，释放参数（仅保留本卡分片）
3. 保存激活值用于反向传播

FSDP 反向传播:
1. 每层计算前，AllGather 收集该层参数
2. 计算梯度
3. ReduceScatter 分片同步梯度
4. 释放参数，仅保留梯度分片
"""
```

**DDP vs FSDP 对比：**

| 特性 | DDP | FSDP |
|------|-----|------|
| 内存占用 | 每卡 100% 模型 | 每卡 100%/N 模型 |
| 通信量 | 梯度 (1x) | 参数+梯度 (2x) |
| 通信时机 | 反向后 | 前向+反向中 |
| 适用模型 | < 10B | 10B - 100B+ |
| 实现复杂度 | 简单 | 中等 |
| 峰值性能 | 高 | 中 |

**我的实践经验：**

**模型大小决策：**
```python
if model_params < 10e9:
    # < 10B 参数，用 DDP
    use_ddp()
elif model_params < 100e9:
    # 10B - 100B，用 FSDP
    use_fsdp()
else:
    # > 100B，用 3D 并行
    use_3d_parallelism()
```

**FSDP 优化技巧：**
1. **激活检查点**（Activation Checkpointing）：节省激活值内存
2. **CPU Offload**：参数或优化器状态卸载到 CPU
3. **混合精度**：BF16 训练，FP32 梯度累积

---

## 三、张量并行 (Tensor Parallelism)

### 3. 什么是张量并行？如何实现？

**参考答案：**

**张量并行原理：**

```
┌─────────────────────────────────────────┐
│  张量并行 (Tensor Parallelism)          │
├─────────────────────────────────────────┤
│                                         │
│  将单层的参数矩阵切分到多个 GPU         │
│                                         │
│  示例: Linear Layer (H=4096, 4 GPUs)    │
│                                         │
│  输入: [B, H] = [32, 4096]              │
│  权重: [H, H] = [4096, 4096]            │
│                                         │
│  切分权重 (列切分):                     │
│  GPU 0: W[:, 0:1024]                    │
│  GPU 1: W[:, 1024:2048]                 │
│  GPU 2: W[:, 2048:3072]                 │
│  GPU 3: W[:, 3072:4096]                 │
│                                         │
│  计算:                                  │
│  GPU 0: Y0 = X @ W0  (输出 [32, 1024]) │
│  GPU 1: Y1 = X @ W1                     │
│  GPU 2: Y2 = X @ W2                     │
│  GPU 3: Y3 = X @ W3                     │
│                                         │
│  AllGather 合并:                        │
│  Y = [Y0, Y1, Y2, Y3] (输出 [32, 4096]) │
└─────────────────────────────────────────┘
```

**Megatron-LM 张量并行实现：**

**列并行 (Column Parallel Linear)：**

```python
import torch
import torch.nn as nn
import torch.distributed as dist

class ColumnParallelLinear(nn.Module):
    """列并行线性层"""
    
    def __init__(self, in_features, out_features, bias=True, 
                 gather_output=True, init_method=nn.init.xavier_normal_):
        super().__init__()
        
        # 获取张量并行组信息
        self.world_size = dist.get_world_size()
        self.rank = dist.get_rank()
        
        # 输出特征切分
        assert out_features % self.world_size == 0
        self.output_size_per_partition = out_features // self.world_size
        
        # 创建权重（每个 GPU 只保存一部分）
        self.weight = nn.Parameter(torch.empty(
            out_features // self.world_size,
            in_features
        ))
        
        if bias:
            self.bias = nn.Parameter(torch.empty(
                out_features // self.world_size
            ))
        else:
            self.register_parameter('bias', None)
        
        # 初始化
        init_method(self.weight)
        if bias:
            nn.init.zeros_(self.bias)
        
        self.gather_output = gather_output
    
    def forward(self, input):
        # input: [B, in_features]
        
        # 每个 GPU 计算部分输出
        output_parallel = F.linear(input, self.weight, self.bias)
        # output_parallel: [B, out_features/world_size]
        
        if self.gather_output:
            # AllGather 收集所有 GPU 的输出
            output = self._gather(output_parallel)
            # output: [B, out_features]
        else:
            output = output_parallel
        
        return output
    
    def _gather(self, input):
        """AllGather 操作"""
        # 收集所有 GPU 的输出并拼接
        tensor_list = [torch.empty_like(input) for _ in range(self.world_size)]
        tensor_list[self.rank] = input
        dist.all_gather(tensor_list, input)
        output = torch.cat(tensor_list, dim=-1)
        return output
```

**行并行 (Row Parallel Linear)：**

```python
class RowParallelLinear(nn.Module):
    """行并行线性层"""
    
    def __init__(self, in_features, out_features, bias=True,
                 input_is_parallel=False, init_method=nn.init.xavier_normal_):
        super().__init__()
        
        self.world_size = dist.get_world_size()
        self.rank = dist.get_rank()
        
        # 输入特征切分
        assert in_features % self.world_size == 0
        self.input_size_per_partition = in_features // self.world_size
        
        # 创建权重
        self.weight = nn.Parameter(torch.empty(
            out_features,
            in_features // self.world_size
        ))
        
        if bias:
            self.bias = nn.Parameter(torch.empty(out_features))
        else:
            self.register_parameter('bias', None)
        
        init_method(self.weight)
        if bias:
            nn.init.zeros_(self.bias)
        
        self.input_is_parallel = input_is_parallel
    
    def forward(self, input):
        # input: [B, in_features] 或 [B, in_features/world_size] (如果已切分)
        
        if not self.input_is_parallel:
            # 需要先切分输入
            input_parallel = self._split(input)
        else:
            input_parallel = input
        # input_parallel: [B, in_features/world_size]
        
        # 每个 GPU 计算部分结果
        output_parallel = F.linear(input_parallel, self.weight)
        # output_parallel: [B, out_features]
        
        # AllReduce 求和所有 GPU 的输出
        output = self._reduce(output_parallel)
        
        if self.bias is not None:
            output = output + self.bias
        
        return output
    
    def _split(self, input):
        """切分输入"""
        # 获取当前 GPU 对应的分片
        dim_size = input.size(-1) // self.world_size
        start_idx = self.rank * dim_size
        end_idx = (self.rank + 1) * dim_size
        return input[..., start_idx:end_idx]
    
    def _reduce(self, input):
        """AllReduce 求和"""
        dist.all_reduce(input, op=dist.ReduceOp.SUM)
        return input
```

**Transformer 层的张量并行：**

```python
class ParallelTransformerLayer(nn.Module):
    """张量并行的 Transformer 层"""
    
    def __init__(self, hidden_size, num_attention_heads, ffn_hidden_size):
        super().__init__()
        
        # Self-Attention (列并行 QKV，行并行 Output)
        self.attention = ParallelSelfAttention(
            hidden_size,
            num_attention_heads
        )
        
        # Feed-Forward Network (列并行 FC1，行并行 FC2)
        self.mlp = ParallelMLP(
            hidden_size,
            ffn_hidden_size
        )
        
        self.norm1 = nn.LayerNorm(hidden_size)
        self.norm2 = nn.LayerNorm(hidden_size)
    
    def forward(self, x):
        # Self-Attention
        residual = x
        x = self.norm1(x)
        x = self.attention(x)
        x = x + residual
        
        # Feed-Forward
        residual = x
        x = self.norm2(x)
        x = self.mlp(x)
        x = x + residual
        
        return x

class ParallelSelfAttention(nn.Module):
    def __init__(self, hidden_size, num_attention_heads):
        super().__init__()
        
        self.num_attention_heads = num_attention_heads
        self.hidden_size_per_attention_head = hidden_size // num_attention_heads
        
        # QKV 列并行（输出切分）
        self.query_key_value = ColumnParallelLinear(
            hidden_size,
            3 * hidden_size,
            gather_output=False  # 不收集，保持切分状态
        )
        
        # Output 行并行（输入已切分）
        self.dense = RowParallelLinear(
            hidden_size,
            hidden_size,
            input_is_parallel=True
        )
    
    def forward(self, x):
        # x: [B, S, H]
        
        # QKV 投影（列并行）
        qkv = self.query_key_value(x)
        # qkv: [B, S, 3H/world_size]
        
        # 拆分 Q, K, V
        q, k, v = torch.chunk(qkv, 3, dim=-1)
        
        # Reshape 到多头
        # q: [B, S, num_heads/world_size, head_dim]
        q = q.view(*q.shape[:-1], -1, self.hidden_size_per_attention_head)
        k = k.view(*k.shape[:-1], -1, self.hidden_size_per_attention_head)
        v = v.view(*v.shape[:-1], -1, self.hidden_size_per_attention_head)
        
        # 注意力计算
        attention_scores = torch.matmul(q, k.transpose(-1, -2))
        attention_scores = attention_scores / math.sqrt(self.hidden_size_per_attention_head)
        attention_probs = F.softmax(attention_scores, dim=-1)
        
        context = torch.matmul(attention_probs, v)
        # context: [B, S, num_heads/world_size, head_dim]
        
        # Reshape 回去
        context = context.view(*context.shape[:-2], -1)
        # context: [B, S, H/world_size] (仍然是切分的)
        
        # Output 投影（行并行，会自动 AllReduce）
        output = self.dense(context)
        # output: [B, S, H]
        
        return output

class ParallelMLP(nn.Module):
    def __init__(self, hidden_size, ffn_hidden_size):
        super().__init__()
        
        # FC1: 列并行（扩展维度）
        self.dense_h_to_4h = ColumnParallelLinear(
            hidden_size,
            ffn_hidden_size,
            gather_output=False
        )
        
        # FC2: 行并行（恢复维度）
        self.dense_4h_to_h = RowParallelLinear(
            ffn_hidden_size,
            hidden_size,
            input_is_parallel=True
        )
        
        self.activation = nn.GELU()
    
    def forward(self, x):
        # x: [B, S, H]
        
        # FC1 (列并行)
        x = self.dense_h_to_4h(x)
        # x: [B, S, 4H/world_size]
        
        x = self.activation(x)
        
        # FC2 (行并行)
        x = self.dense_4h_to_h(x)
        # x: [B, S, H]
        
        return x
```

**张量并行通信分析：**

```python
"""
通信量分析（每层）:

列并行 Linear:
- 前向: AllGather (输出) - 通信量 = output_size
- 反向: ReduceScatter (梯度) - 通信量 = output_size

行并行 Linear:
- 前向: AllReduce (输出) - 通信量 = output_size
- 反向: AllGather (输入梯度) - 通信量 = input_size

总通信量 (每个 Transformer 层):
- 前向: 2 * hidden_size (QKV AllGather + Output AllReduce + MLP)
- 反向: 2 * hidden_size

对于 Llama 70B (hidden_size=8192):
- 每层通信: ~32 KB
- 80 层: 2.5 MB
- 每个 iteration: 前向+反向 = 5 MB
"""
```

**张量并行优化：**

**1. 序列并行 (Sequence Parallelism)：**

```python
"""
问题: 张量并行中，LayerNorm 和 Dropout 在所有 GPU 上重复计算

解决: 序列并行 - 沿序列维度切分

标准张量并行:
GPU 0: [B, S, H/4]  LayerNorm 计算整个 [B, S, H]
GPU 1: [B, S, H/4]  LayerNorm 计算整个 [B, S, H]
GPU 2: [B, S, H/4]  LayerNorm 计算整个 [B, S, H]
GPU 3: [B, S, H/4]  LayerNorm 计算整个 [B, S, H]

序列并行:
GPU 0: [B, S/4, H/4]  LayerNorm 只计算 [B, S/4, H]
GPU 1: [B, S/4, H/4]
GPU 2: [B, S/4, H/4]
GPU 3: [B, S/4, H/4]
"""
```

**2. 1D → 2D → 3D 张量并行：**

```python
"""
1D 张量并行: 沿 1 个维度切分
2D 张量并行: 沿 2 个维度切分（如 SUMMA 算法）
3D 张量并行: 同时使用 TP + PP + DP
"""
```

**我的实践经验：**

**张量并行规模选择：**
```python
# 经验法则
tp_size = min(8, num_gpus_per_node)

# 原因：
# 1. 张量并行通信密集，适合节点内（NVLink）
# 2. 跨节点通信慢，不适合大 TP
# 3. 单节点 8 GPU 是典型配置 (DGX A100/H100)

# 示例配置
if num_gpus == 8:
    tp_size = 8, pp_size = 1, dp_size = 1
elif num_gpus == 64:
    tp_size = 8, pp_size = 4, dp_size = 2  # 3D 并行
```

**张量并行 vs FSDP：**
- **TP**：适合单节点内，通信快
- **FSDP**：适合跨节点，扩展性好
- **混合**：TP (节点内) + FSDP (节点间)

---

## 四、流水线并行 (Pipeline Parallelism)

### 4. 什么是流水线并行？如何解决气泡问题？

**参考答案：**

**流水线并行原理：**

```
┌──────────────────────────────────────┐
│  流水线并行 (Pipeline Parallelism)   │
├──────────────────────────────────────┤
│                                      │
│  将模型按层切分到多个 GPU (Stage)     │
│                                      │
│  GPU 0: Layers 0-19   (Stage 0)      │
│  GPU 1: Layers 20-39  (Stage 1)      │
│  GPU 2: Layers 40-59  (Stage 2)      │
│  GPU 3: Layers 60-79  (Stage 3)      │
│                                      │
│  前向传播流水线:                      │
│                                      │
│  Micro-batch 1 → GPU 0 → GPU 1 → GPU 2 → GPU 3
│  Micro-batch 2 →    GPU 0 → GPU 1 → GPU 2 → GPU 3
│  Micro-batch 3 →       GPU 0 → GPU 1 → GPU 2 → GPU 3
│  Micro-batch 4 →          GPU 0 → GPU 1 → GPU 2 → GPU 3
│                                      │
│  反向传播流水线:                      │
│  GPU 3 → GPU 2 → GPU 1 → GPU 0       │
└──────────────────────────────────────┘
```

**GPipe (Naive Pipeline Parallelism)：**

```python
"""
GPipe 时间线 (4 GPUs, 4 Micro-batches):

时间 →
─────────────────────────────────────
GPU 0: F0  F1  F2  F3  B3  B2  B1  B0
GPU 1: │   F0  F1  F2  F3  B3  B2  B1  B0
GPU 2: │   │   F0  F1  F2  F3  B3  B2  B1  B0
GPU 3: │   │   │   F0  F1  F2  F3  B3  B2  B1  B0

F: Forward  B: Backward
数字: Micro-batch ID

问题: 气泡 (Bubble) - GPU 空闲时间
气泡率 = (P-1) / (M+P-1)
P = Pipeline stages (4)
M = Micro-batches (4)
气泡率 = 3/7 = 43% (严重！)
"""
```

**PipeDream (1F1B Schedule)：**

```python
"""
1F1B (One Forward, One Backward) 策略:

时间 →
─────────────────────────────────────
GPU 0: F0  F1  F2  F3  B0  F4  B1  F5  B2  F6  B3  B4  B5  B6
GPU 1: │   F0  F1  F2  F3  B0  F4  B1  F5  B2  B3  B4  B5  B6
GPU 2: │   │   F0  F1  F2  F3  B0  B1  B2  B3  B4  B5  B6
GPU 3: │   │   │   F0  F1  F2  F3  B0  B1  B2  B3  B4  B5  B6

特点:
1. 热身阶段 (Warmup): 填充流水线
2. 稳定阶段 (Steady): 1F1B 交替
3. 冷却阶段 (Cooldown): 清空流水线

优势:
- 减少气泡
- 降低激活值内存（只需保存 P 个 micro-batch）
"""
```

**Megatron-LM Pipeline Implementation：**

```python
import torch
import torch.distributed as dist

class PipelineParallel:
    def __init__(self, model, num_stages, num_microbatches):
        self.num_stages = num_stages
        self.num_microbatches = num_microbatches
        self.stage_id = dist.get_rank()  # 当前 stage ID
        
        # 将模型切分到当前 stage
        self.model_chunk = self.split_model(model)
    
    def split_model(self, model):
        """将模型切分，返回当前 stage 的部分"""
        layers_per_stage = len(model.layers) // self.num_stages
        start = self.stage_id * layers_per_stage
        end = (self.stage_id + 1) * layers_per_stage
        return model.layers[start:end]
    
    def forward_backward_pipelining_with_interleaving(self, inputs):
        """
        Interleaved 1F1B Pipeline Schedule
        """
        num_microbatches = self.num_microbatches
        
        # 分割输入为 micro-batches
        micro_batches = torch.chunk(inputs, num_microbatches, dim=0)
        
        # 存储激活值和梯度
        activations = []
        gradients = []
        
        # === Warmup 阶段 ===
        # 填充流水线
        for i in range(self.num_stages):
            if i < len(micro_batches):
                micro_batch = micro_batches[i]
                
                # 接收来自上游的输入
                if self.stage_id > 0:
                    micro_batch = self.recv_forward(i)
                
                # 前向传播
                activation = self.forward(micro_batch)
                activations.append(activation)
                
                # 发送到下游
                if self.stage_id < self.num_stages - 1:
                    self.send_forward(activation, i)
        
        # === Steady 阶段 ===
        # 1F1B 交替
        num_warmup_microbatches = self.num_stages
        for i in range(num_warmup_microbatches, num_microbatches):
            # 1 Forward
            micro_batch = micro_batches[i]
            if self.stage_id > 0:
                micro_batch = self.recv_forward(i)
            
            activation = self.forward(micro_batch)
            activations.append(activation)
            
            if self.stage_id < self.num_stages - 1:
                self.send_forward(activation, i)
            
            # 1 Backward
            if self.stage_id == self.num_stages - 1:
                # 最后一个 stage 计算损失
                loss = self.compute_loss(activation)
                grad = torch.autograd.grad(loss, activation)[0]
            else:
                # 接收来自下游的梯度
                grad = self.recv_backward(i - num_warmup_microbatches)
            
            # 反向传播
            activation_to_backward = activations[i - num_warmup_microbatches]
            input_grad = self.backward(activation_to_backward, grad)
            gradients.append(input_grad)
            
            # 发送梯度到上游
            if self.stage_id > 0:
                self.send_backward(input_grad, i - num_warmup_microbatches)
        
        # === Cooldown 阶段 ===
        # 清空流水线
        for i in range(num_warmup_microbatches):
            if self.stage_id == self.num_stages - 1:
                activation = activations[i + num_microbatches - num_warmup_microbatches]
                loss = self.compute_loss(activation)
                grad = torch.autograd.grad(loss, activation)[0]
            else:
                grad = self.recv_backward(i + num_microbatches - num_warmup_microbatches)
            
            activation_to_backward = activations[i + num_microbatches - num_warmup_microbatches]
            input_grad = self.backward(activation_to_backward, grad)
            
            if self.stage_id > 0:
                self.send_backward(input_grad, i + num_microbatches - num_warmup_microbatches)
        
        return gradients
    
    def forward(self, input):
        """前向传播当前 stage"""
        for layer in self.model_chunk:
            input = layer(input)
        return input
    
    def backward(self, activation, grad_output):
        """反向传播当前 stage"""
        return torch.autograd.grad(activation, inputs, grad_output)[0]
    
    def send_forward(self, tensor, microbatch_id):
        """发送激活值到下一个 stage"""
        next_rank = self.stage_id + 1
        dist.send(tensor, dst=next_rank, tag=microbatch_id)
    
    def recv_forward(self, microbatch_id):
        """接收来自上一个 stage 的激活值"""
        prev_rank = self.stage_id - 1
        tensor = torch.empty_like(...)  # 需要知道 shape
        dist.recv(tensor, src=prev_rank, tag=microbatch_id)
        return tensor
    
    def send_backward(self, tensor, microbatch_id):
        """发送梯度到上一个 stage"""
        prev_rank = self.stage_id - 1
        dist.send(tensor, dst=prev_rank, tag=microbatch_id + 10000)
    
    def recv_backward(self, microbatch_id):
        """接收来自下一个 stage 的梯度"""
        next_rank = self.stage_id + 1
        tensor = torch.empty_like(...)
        dist.recv(tensor, src=next_rank, tag=microbatch_id + 10000)
        return tensor
```

**虚拟流水线 (Virtual Pipeline / Interleaved Pipeline)：**

```python
"""
问题: 标准流水线气泡仍然较大

解决: Interleaved Pipeline - 每个 GPU 负责多个非连续的 stage

标准流水线 (4 GPUs):
GPU 0: Layers 0-19
GPU 1: Layers 20-39
GPU 2: Layers 40-59
GPU 3: Layers 60-79

虚拟流水线 (4 GPUs, 2 chunks):
GPU 0: Layers 0-9, 40-49
GPU 1: Layers 10-19, 50-59
GPU 2: Layers 20-29, 60-69
GPU 3: Layers 30-39, 70-79

时间线:
GPU 0: F00 F01 F10 F11 F20 F21 B21 B20 B11 B10 B01 B00
GPU 1: │   F00 F01 F10 F11 F20 F21 B21 B20 B11 B10 B01 B00
GPU 2: │   │   F00 F01 F10 F11 F20 F21 B21 B20 B11 B10 B01 B00
GPU 3: │   │   │   F00 F01 F10 F11 F20 F21 B21 B20 B11 B10 B01 B00

Fij: Forward, i=chunk id, j=microbatch id

优势:
- 气泡率降低: (P-1) / (M+P-1) → (P/V-1) / (M+P/V-1)
- V = Virtual stages per GPU
- 示例: P=4, M=8, V=2
  - 标准: 3/11 = 27%
  - 虚拟: 1/9 = 11%
"""
```

**我的实践经验：**

**流水线并行配置：**
```python
# 超参数选择
num_microbatches = num_pipeline_stages * 4  # 经验值

# 示例: 64 层模型, 8 个 GPU
pp_size = 4  # 4 个 pipeline stages
num_microbatches = 16  # 4 * 4
layers_per_stage = 64 // 4 = 16

# 虚拟流水线
virtual_chunks = 2
layers_per_chunk = 16 // 2 = 8
```

**流水线并行的挑战：**
1. **负载不均衡**：某些层计算量大（如 MLP），导致某个 stage 成为瓶颈
2. **激活值内存**：需要保存多个 micro-batch 的激活值
3. **通信延迟**：跨节点 P2P 通信

---

## 五、3D 并行与 MoE 模型

### 5. 什么是 3D 并行？如何训练 MoE 模型？

**参考答案：**

**3D 并行 (DP + TP + PP)：**

```
┌────────────────────────────────────────┐
│  3D 并行示例 (64 GPUs, Llama 70B)     │
├────────────────────────────────────────┤
│                                        │
│  Tensor Parallel (TP) = 8             │
│  Pipeline Parallel (PP) = 4           │
│  Data Parallel (DP) = 2               │
│  Total GPUs = 8 * 4 * 2 = 64          │
│                                        │
│  拓扑结构:                             │
│                                        │
│  Data Parallel Group 0:               │
│  ├─ Pipeline Stage 0                  │
│  │  └─ TP Group [GPU 0-7]             │
│  ├─ Pipeline Stage 1                  │
│  │  └─ TP Group [GPU 8-15]            │
│  ├─ Pipeline Stage 2                  │
│  │  └─ TP Group [GPU 16-23]           │
│  └─ Pipeline Stage 3                  │
│     └─ TP Group [GPU 24-31]           │
│                                        │
│  Data Parallel Group 1:               │
│  ├─ Pipeline Stage 0                  │
│  │  └─ TP Group [GPU 32-39]           │
│  ├─ Pipeline Stage 1                  │
│  │  └─ TP Group [GPU 40-47]           │
│  ├─ Pipeline Stage 2                  │
│  │  └─ TP Group [GPU 48-55]           │
│  └─ Pipeline Stage 3                  │
│     └─ TP Group [GPU 56-63]           │
└────────────────────────────────────────┘
```

**Megatron-DeepSpeed 3D 并行配置：**

```python
# DeepSpeed config.json
{
  "train_batch_size": 512,
  "train_micro_batch_size_per_gpu": 1,
  "gradient_accumulation_steps": 64,
  
  "fp16": {
    "enabled": true,
    "loss_scale": 0,
    "initial_scale_power": 16,
    "loss_scale_window": 1000,
    "hysteresis": 2,
    "min_loss_scale": 1
  },
  
  "zero_optimization": {
    "stage": 1,  # 配合 TP+PP 使用 ZeRO-1
    "reduce_bucket_size": 5e8,
    "allgather_bucket_size": 5e8
  },
  
  "optimizer": {
    "type": "AdamW",
    "params": {
      "lr": 1.5e-4,
      "betas": [0.9, 0.95],
      "eps": 1e-8,
      "weight_decay": 0.1
    }
  },
  
  "scheduler": {
    "type": "WarmupDecayLR",
    "params": {
      "warmup_min_lr": 0,
      "warmup_max_lr": 1.5e-4,
      "warmup_num_steps": 2000,
      "total_num_steps": 100000
    }
  },
  
  "gradient_clipping": 1.0,
  "prescale_gradients": false,
  "wall_clock_breakdown": false
}
```

```bash
# 启动脚本
deepspeed --num_gpus=64 \
  --num_nodes=8 \
  --master_addr=$MASTER_ADDR \
  --master_port=29500 \
  pretrain_gpt.py \
  --tensor-model-parallel-size 8 \
  --pipeline-model-parallel-size 4 \
  --num-layers 80 \
  --hidden-size 8192 \
  --num-attention-heads 64 \
  --seq-length 4096 \
  --max-position-embeddings 4096 \
  --micro-batch-size 1 \
  --global-batch-size 512 \
  --train-iters 100000 \
  --lr 1.5e-4 \
  --min-lr 1.5e-5 \
  --lr-decay-style cosine \
  --lr-warmup-iters 2000 \
  --weight-decay 0.1 \
  --clip-grad 1.0 \
  --fp16 \
  --zero-stage 1 \
  --deepspeed \
  --deepspeed_config ds_config.json
```

**MoE (Mixture of Experts) 模型：**

**MoE 架构：**

```
┌──────────────────────────────────────┐
│  Transformer with MoE Layer          │
├──────────────────────────────────────┤
│                                      │
│  Input: [B, S, H]                    │
│     ↓                                │
│  ┌────────────────┐                  │
│  │ Self-Attention │                  │
│  └────────┬───────┘                  │
│           ↓                          │
│  ┌────────────────┐                  │
│  │ MoE Layer      │                  │
│  │                │                  │
│  │ ┌────────────┐ │                  │
│  │ │   Router   │ │ (选择 Expert)    │
│  │ └─────┬──────┘ │                  │
│  │       │        │                  │
│  │   ┌───┴────┐   │                  │
│  │   │ Expert │   │ (Top-2 routing)  │
│  │   │ 0, 1   │   │                  │
│  │   └────────┘   │                  │
│  │                │                  │
│  │ ┌──────────┐   │ (8 Experts)      │
│  │ │ Expert 2 │   │                  │
│  │ └──────────┘   │                  │
│  │ ...            │                  │
│  │ ┌──────────┐   │                  │
│  │ │ Expert 7 │   │                  │
│  │ └──────────┘   │                  │
│  └────────────────┘                  │
│     ↓                                │
│  Output: [B, S, H]                   │
└──────────────────────────────────────┘
```

**MoE 代码实现：**

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MoELayer(nn.Module):
    def __init__(self, hidden_size, num_experts=8, expert_capacity_factor=1.25,
                 top_k=2, expert_hidden_size=None):
        super().__init__()
        
        self.hidden_size = hidden_size
        self.num_experts = num_experts
        self.top_k = top_k
        self.expert_capacity_factor = expert_capacity_factor
        
        if expert_hidden_size is None:
            expert_hidden_size = hidden_size * 4
        
        # Router (Gate Network)
        self.router = nn.Linear(hidden_size, num_experts, bias=False)
        
        # Experts (每个 Expert 是一个 FFN)
        self.experts = nn.ModuleList([
            nn.Sequential(
                nn.Linear(hidden_size, expert_hidden_size),
                nn.GELU(),
                nn.Linear(expert_hidden_size, hidden_size)
            )
            for _ in range(num_experts)
        ])
    
    def forward(self, x):
        # x: [B, S, H]
        batch_size, seq_len, hidden_size = x.shape
        
        # Router 预测每个 token 的 expert 分布
        router_logits = self.router(x)  # [B, S, num_experts]
        router_probs = F.softmax(router_logits, dim=-1)  # [B, S, num_experts]
        
        # Top-K routing
        top_k_probs, top_k_indices = torch.topk(router_probs, self.top_k, dim=-1)
        # top_k_probs: [B, S, top_k]
        # top_k_indices: [B, S, top_k]
        
        # 归一化 top-k 概率
        top_k_probs = top_k_probs / top_k_probs.sum(dim=-1, keepdim=True)
        
        # Expert capacity (防止负载不均衡)
        capacity = int((batch_size * seq_len * self.top_k / self.num_experts) 
                       * self.expert_capacity_factor)
        
        # 初始化输出
        output = torch.zeros_like(x)
        
        # 为每个 expert 分配 tokens
        for expert_id in range(self.num_experts):
            # 找到分配给该 expert 的 tokens
            expert_mask = (top_k_indices == expert_id).any(dim=-1)  # [B, S]
            expert_tokens = x[expert_mask]  # [N, H]
            
            if expert_tokens.numel() == 0:
                continue
            
            # Capacity 限制
            if expert_tokens.shape[0] > capacity:
                expert_tokens = expert_tokens[:capacity]
                expert_mask_limited = expert_mask.clone()
                # 更新 mask（只保留前 capacity 个）
            
            # Expert 计算
            expert_output = self.experts[expert_id](expert_tokens)  # [N, H]
            
            # 获取该 expert 的权重
            expert_weights = top_k_probs[expert_mask]  # [N, top_k]
            expert_weight = expert_weights[top_k_indices[expert_mask] == expert_id]
            
            # 加权输出
            output[expert_mask] += expert_output * expert_weight.unsqueeze(-1)
        
        return output


class SwitchTransformer(nn.Module):
    """Switch Transformer (Google, Top-1 routing)"""
    
    def __init__(self, hidden_size, num_experts=8):
        super().__init__()
        
        self.router = nn.Linear(hidden_size, num_experts, bias=False)
        self.experts = nn.ModuleList([
            FeedForward(hidden_size)
            for _ in range(num_experts)
        ])
        
        # Load balancing loss weight
        self.load_balancing_loss_weight = 0.01
    
    def forward(self, x):
        # x: [B, S, H]
        batch_size, seq_len, hidden_size = x.shape
        
        # Router
        router_logits = self.router(x)  # [B, S, num_experts]
        router_probs = F.softmax(router_logits, dim=-1)
        
        # Top-1 routing
        expert_indices = torch.argmax(router_probs, dim=-1)  # [B, S]
        expert_probs = torch.gather(router_probs, -1, expert_indices.unsqueeze(-1))
        
        # Expert computation
        output = torch.zeros_like(x)
        for expert_id in range(len(self.experts)):
            mask = (expert_indices == expert_id)
            if mask.any():
                expert_input = x[mask]
                expert_output = self.experts[expert_id](expert_input)
                output[mask] = expert_output * expert_probs[mask]
        
        # Load balancing loss
        # 目标：每个 expert 处理相同数量的 tokens
        expert_counts = torch.bincount(expert_indices.flatten(), 
                                        minlength=len(self.experts))
        expert_fraction = expert_counts / (batch_size * seq_len)
        
        # Aux loss: 鼓励均匀分布
        avg_prob_per_expert = router_probs.mean(dim=[0, 1])  # [num_experts]
        load_balancing_loss = (expert_fraction * avg_prob_per_expert).sum() * len(self.experts)
        
        return output, load_balancing_loss * self.load_balancing_loss_weight
```

**MoE 分布式训练（Expert Parallelism）：**

```python
"""
Expert Parallelism: 将 Experts 分布到不同 GPU

示例: 8 Experts, 4 GPUs
GPU 0: Expert 0, 1
GPU 1: Expert 2, 3
GPU 2: Expert 4, 5
GPU 3: Expert 6, 7

通信模式 (All-to-All):
1. 每个 GPU 根据 routing 决策，将 tokens 发送到对应的 expert 所在 GPU
2. Expert 计算完成后，将结果发送回原 GPU
3. 通信量: O(tokens * hidden_size)

优化:
- Capacity Factor: 限制每个 expert 处理的最大 token 数
- Top-K routing: 减少激活的 expert 数量
- Expert 重复: 同一 expert 在多个 GPU 上，减少通信
"""
```

**DeepSpeed-MoE 实现：**

```python
# DeepSpeed MoE 配置
deepspeed_config = {
    "moe": {
        "enabled": true,
        "num_experts": 128,
        "ep_size": 8,  # Expert Parallel Size
        "use_residual": false,
        "expert_init_type": "normal",
        "moe_expert_count": 1,
        "moe_min_capacity": 4,
        "moe_loss_coeff": 0.1
    }
}

# 使用 DeepSpeed MoE
from deepspeed.moe.layer import MoE

moe_layer = MoE(
    hidden_size=4096,
    expert=Expert(4096, 16384),  # FFN
    num_experts=128,
    ep_size=8,
    k=1,  # Top-1
    use_residual=False
)
```

**MoE 训练挑战：**

1. **负载不均衡**：某些 expert 处理大量 tokens，其他闲置
   - 解决：Auxiliary loss 鼓励均匀分布
   - Capacity factor 限制

2. **通信开销**：All-to-All 通信量大
   - 解决：Expert 复制、Token dropping

3. **训练不稳定**：Router 崩溃（所有 tokens 路由到少数 expert）
   - 解决：Z-loss、Router dropout

**我的实践经验：**

**3D 并行配置经验：**
```python
# 单节点 (8 GPUs A100)
tp_size = 8
pp_size = 1
dp_size = 1

# 多节点 (64 GPUs, 8 nodes)
tp_size = 8  # 节点内
pp_size = 4  # 跨节点
dp_size = 2  # 数据并行

# 超大模型 (512 GPUs, 64 nodes)
tp_size = 8
pp_size = 8
dp_size = 8
```

**MoE vs Dense 模型：**
| 特性 | Dense (70B) | MoE (8x7B experts, Top-2) |
|------|-------------|---------------------------|
| 总参数 | 70B | 56B (每次激活 14B) |
| 激活参数 | 70B | 14B |
| 训练成本 | 高 | 中 (5x faster) |
| 推理成本 | 中 | 中 (2x faster) |
| 适用场景 | 通用 | 多任务、多领域 |

---

## 致谢

本文档深入介绍了大模型分布式训练的核心技术，包括数据并行、张量并行、流水线并行、3D 并行和 MoE 架构。这些技术是训练超大规模语言模型的基础。

**延伸阅读：**
- [Megatron-LM Paper](https://arxiv.org/abs/1909.08053)
- [DeepSpeed ZeRO](https://arxiv.org/abs/1910.02054)
- [Switch Transformers](https://arxiv.org/abs/2101.03961)
- [GPipe](https://arxiv.org/abs/1811.06965)
