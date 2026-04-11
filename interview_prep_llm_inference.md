# LLM 推理框架面试准备文档

深入解析 vLLM 和 SGLang：PagedAttention、P/D 分离与推理优化

---

## 一、LLM 推理基础

### 1. LLM 推理面临哪些挑战？

**参考答案：**

**LLM 推理的独特性：**

```
训练 vs 推理对比

训练 (Training):
├─ 吞吐量优先 (Throughput)
├─ Batch Size 大 (1024+)
├─ 计算密集 (Compute-bound)
└─ 延迟容忍度高

推理 (Inference):
├─ 延迟优先 (Latency)
├─ Batch Size 小/动态
├─ 内存密集 (Memory-bound)
└─ 延迟敏感
```

**核心挑战：**

**挑战 1：内存墙 (Memory Wall)**

```python
# KV Cache 内存占用估算
def estimate_kv_cache_memory(
    batch_size,
    seq_len,
    num_layers,
    num_heads,
    head_dim,
    dtype_bytes=2  # FP16
):
    """
    KV Cache = 2 (K+V) * batch_size * seq_len * num_layers * num_heads * head_dim
    """
    kv_cache_size = (
        2 *  # K and V
        batch_size *
        seq_len *
        num_layers *
        num_heads *
        head_dim *
        dtype_bytes
    )
    return kv_cache_size / (1024**3)  # GB

# 示例: Llama 2 70B
params = {
    "batch_size": 32,
    "seq_len": 4096,
    "num_layers": 80,
    "num_heads": 64,
    "head_dim": 128,
}

kv_cache = estimate_kv_cache_memory(**params)
print(f"KV Cache: {kv_cache:.2f} GB")
# 输出: KV Cache: 327.68 GB

# A100 80GB 无法容纳！
```

**挑战 2：动态 Batch Size**

```
问题: 不同请求的输出长度不同

Request 1: 输入 10 tokens  → 输出 100 tokens  (短输入，长输出)
Request 2: 输入 1000 tokens → 输出 10 tokens  (长输入，短输出)
Request 3: 输入 500 tokens → 输出 500 tokens

传统方案: 静态 Batch
- Padding 到最大长度 → 浪费计算
- 完成的请求仍占用 batch slot → 吞吐量低

需要: 动态 Batch
- 请求完成后立即移除
- 新请求立即加入
```

**挑战 3：内存碎片化**

```
问题: KV Cache 预分配导致内存碎片

传统方案:
Request 1: 预分配 4096 tokens KV Cache
Request 2: 预分配 4096 tokens KV Cache
...

实际使用:
Request 1: 只生成 100 tokens → 浪费 96% 内存
Request 2: 只生成 50 tokens  → 浪费 98% 内存

结果: 内存利用率 < 20%
```

**挑战 4：计算模式不同**

```
自回归生成两阶段:

1. Prefill (Context Encoding):
   - 并行处理所有输入 tokens
   - 计算密集 (Compute-bound)
   - 生成初始 KV Cache
   
2. Decode (Token Generation):
   - 串行生成每个 token
   - 内存带宽密集 (Memory-bound)
   - 逐步扩展 KV Cache

问题: 两阶段性能特征完全不同
```

**挑战 5：长序列支持**

```
Transformer 注意力复杂度: O(n²)

序列长度 | 计算量 | KV Cache
---------|--------|----------
1K       | 1x     | 1x
4K       | 16x    | 4x
32K      | 1024x  | 32x
128K     | 16384x | 128x

长序列挑战:
- 计算量爆炸
- KV Cache 内存爆炸
- 延迟不可接受
```

**我的理解：**

LLM 推理优化的核心是解决**内存效率**问题：
1. **KV Cache 管理**：高效分配和复用
2. **Batch 管理**：动态调整，提高吞吐
3. **计算优化**：针对 Prefill 和 Decode 分别优化

---

## 二、vLLM 深入解析

### 2. vLLM 的 PagedAttention 是什么？如何工作？

**参考答案：**

**PagedAttention 核心思想：**

```
类比操作系统的虚拟内存管理

操作系统虚拟内存:
├─ 虚拟地址空间 (连续)
├─ 物理内存 (分页，非连续)
├─ 页表 (映射)
└─ 按需分配

PagedAttention:
├─ 逻辑 KV Cache (连续)
├─ 物理 KV Blocks (分页，非连续)
├─ Block Table (映射)
└─ 按需分配
```

**传统 KV Cache 管理：**

```
┌─────────────────────────────────────┐
│  传统方案: 预分配连续内存            │
├─────────────────────────────────────┤
│                                     │
│  Request 1:                         │
│  ┌────────────────────────────┐    │
│  │ KV Cache (预分配 4096)     │    │
│  │ [使用 100 | 空闲 3996]     │    │
│  └────────────────────────────┘    │
│                                     │
│  Request 2:                         │
│  ┌────────────────────────────┐    │
│  │ KV Cache (预分配 4096)     │    │
│  │ [使用 50 | 空闲 4046]      │    │
│  └────────────────────────────┘    │
│                                     │
│  问题:                              │
│  - 内存浪费严重 (> 90%)            │
│  - 无法支持更多并发请求             │
└─────────────────────────────────────┘
```

**PagedAttention 方案：**

```
┌─────────────────────────────────────┐
│  PagedAttention: 分页管理           │
├─────────────────────────────────────┤
│                                     │
│  Physical KV Blocks (GPU Memory):  │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┐ │
│  │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ │
│  └───┴───┴───┴───┴───┴───┴───┴───┘ │
│                                     │
│  Request 1 (100 tokens):           │
│  Logical KV: [0...99]              │
│  Block Table: [0, 1, 2, 3, 4]      │
│    Block 0: tokens [0...15]        │
│    Block 1: tokens [16...31]       │
│    Block 2: tokens [32...47]       │
│    Block 3: tokens [48...63]       │
│    Block 4: tokens [64...99]       │
│                                     │
│  Request 2 (50 tokens):            │
│  Logical KV: [0...49]              │
│  Block Table: [5, 6, 7]            │
│    Block 5: tokens [0...15]        │
│    Block 6: tokens [16...31]       │
│    Block 7: tokens [32...49]       │
│                                     │
│  优势:                              │
│  - 按需分配 (只分配需要的 blocks)   │
│  - 内存利用率 > 80%                │
│  - 支持更多并发请求                 │
└─────────────────────────────────────┘
```

**PagedAttention 实现细节：**

**Block 结构：**

```python
class KVBlock:
    """KV Cache Block"""
    
    def __init__(self, block_size, num_heads, head_dim, dtype=torch.float16):
        self.block_size = block_size  # 16 tokens per block
        self.num_heads = num_heads
        self.head_dim = head_dim
        
        # K, V 缓存
        # Shape: [num_heads, block_size, head_dim]
        self.key_cache = torch.zeros(
            (num_heads, block_size, head_dim),
            dtype=dtype,
            device='cuda'
        )
        self.value_cache = torch.zeros(
            (num_heads, block_size, head_dim),
            dtype=dtype,
            device='cuda'
        )
    
    def write(self, slot_idx, key, value):
        """写入 KV 到指定 slot"""
        self.key_cache[:, slot_idx, :] = key
        self.value_cache[:, slot_idx, :] = value
    
    def read(self, slot_indices):
        """读取指定 slots 的 KV"""
        keys = self.key_cache[:, slot_indices, :]
        values = self.value_cache[:, slot_indices, :]
        return keys, values


class BlockTable:
    """Block Table for a single request"""
    
    def __init__(self):
        self.blocks = []  # List of physical block IDs
    
    def append_block(self, block_id):
        """分配新 block"""
        self.blocks.append(block_id)
    
    def get_physical_blocks(self):
        """获取物理 block 列表"""
        return self.blocks
    
    def num_tokens(self, block_size):
        """当前存储的 token 数量"""
        return len(self.blocks) * block_size
```

**Block Manager：**

```python
class BlockAllocator:
    """管理 KV Cache Blocks 的分配和释放"""
    
    def __init__(self, num_blocks, block_size):
        self.num_blocks = num_blocks
        self.block_size = block_size
        
        # 空闲 block 池
        self.free_blocks = list(range(num_blocks))
        
        # 每个请求的 block table
        self.request_to_blocks = {}
    
    def allocate(self, request_id, num_blocks_needed):
        """为请求分配 blocks"""
        if len(self.free_blocks) < num_blocks_needed:
            raise ValueError("Out of memory")
        
        # 分配 blocks
        allocated_blocks = [
            self.free_blocks.pop()
            for _ in range(num_blocks_needed)
        ]
        
        # 记录到 block table
        if request_id not in self.request_to_blocks:
            self.request_to_blocks[request_id] = []
        self.request_to_blocks[request_id].extend(allocated_blocks)
        
        return allocated_blocks
    
    def free(self, request_id):
        """释放请求的所有 blocks"""
        if request_id in self.request_to_blocks:
            blocks = self.request_to_blocks.pop(request_id)
            self.free_blocks.extend(blocks)
    
    def can_allocate(self, num_blocks):
        """检查是否有足够的 blocks"""
        return len(self.free_blocks) >= num_blocks
```

**PagedAttention Kernel：**

```cuda
// PagedAttention CUDA Kernel (简化版)
__global__ void paged_attention_kernel(
    const float* __restrict__ query,        // [num_heads, head_dim]
    const float* __restrict__ key_cache,    // [num_blocks, num_heads, block_size, head_dim]
    const float* __restrict__ value_cache,  // [num_blocks, num_heads, block_size, head_dim]
    const int* __restrict__ block_table,    // [num_blocks]
    float* __restrict__ output,             // [num_heads, head_dim]
    const int num_heads,
    const int head_dim,
    const int block_size,
    const int num_tokens
) {
    const int head_idx = blockIdx.x;
    const int thread_idx = threadIdx.x;
    
    // 遍历所有 KV tokens
    for (int token_idx = 0; token_idx < num_tokens; ++token_idx) {
        // 计算该 token 在哪个 block
        int block_idx = token_idx / block_size;
        int block_offset = token_idx % block_size;
        
        // 获取物理 block ID
        int physical_block_id = block_table[block_idx];
        
        // 读取 K, V
        const float* k = &key_cache[
            physical_block_id * num_heads * block_size * head_dim +
            head_idx * block_size * head_dim +
            block_offset * head_dim
        ];
        
        const float* v = &value_cache[
            physical_block_id * num_heads * block_size * head_dim +
            head_idx * block_size * head_dim +
            block_offset * head_dim
        ];
        
        // 计算 attention score
        float score = 0.0f;
        for (int i = thread_idx; i < head_dim; i += blockDim.x) {
            score += query[head_idx * head_dim + i] * k[i];
        }
        
        // ... (后续 softmax 和 attention 计算)
    }
}
```

**vLLM 整体架构：**

```
┌──────────────────────────────────────┐
│           vLLM 架构                  │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Frontend (API Server)         │ │
│  │  - FastAPI                     │ │
│  │  - OpenAI Compatible API       │ │
│  └──────────┬─────────────────────┘ │
│             │                        │
│  ┌──────────▼─────────────────────┐ │
│  │  LLM Engine                    │ │
│  │  ┌──────────────────────────┐  │ │
│  │  │  Scheduler               │  │ │
│  │  │  - Continuous Batching   │  │ │
│  │  │  - Request Queueing      │  │ │
│  │  └──────────────────────────┘  │ │
│  │  ┌──────────────────────────┐  │ │
│  │  │  Block Manager           │  │ │
│  │  │  - PagedAttention        │  │ │
│  │  │  - Memory Allocation     │  │ │
│  │  └──────────────────────────┘  │ │
│  │  ┌──────────────────────────┐  │ │
│  │  │  Model Executor          │  │ │
│  │  │  - Model Inference       │  │ │
│  │  │  - Kernel Execution      │  │ │
│  │  └──────────────────────────┘  │ │
│  └────────────────────────────────┘ │
│             │                        │
│  ┌──────────▼─────────────────────┐ │
│  │  KV Cache (GPU Memory)         │ │
│  │  - Paged KV Blocks             │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Continuous Batching：**

```python
"""
传统 Static Batching:
Batch 1: [Req1, Req2, Req3, Req4]
- 等待所有请求完成
- Req1 完成后仍占用 slot，等待 Req4

Continuous Batching (vLLM):
Step 1: [Req1, Req2, Req3, Req4]
Step 2: [Req1, Req2, Req3, Req4]  # Req1 生成 1 token
Step 3: [Req5, Req2, Req3, Req4]  # Req1 完成，立即替换为 Req5
Step 4: [Req5, Req2, Req6, Req4]  # Req3 完成，替换为 Req6

优势:
- 吞吐量提升 2-3x
- 延迟降低 50%
- GPU 利用率更高
"""
```

**vLLM 使用示例：**

```python
from vllm import LLM, SamplingParams

# 初始化 LLM
llm = LLM(
    model="meta-llama/Llama-2-70b-chat-hf",
    tensor_parallel_size=4,  # 4 GPUs
    dtype="float16",
    max_model_len=4096,
    gpu_memory_utilization=0.9,  # 使用 90% GPU 内存
    block_size=16,  # PagedAttention block size
    max_num_seqs=256,  # 最大并发请求数
    enforce_eager=False,  # 使用 CUDA Graph
)

# Sampling 参数
sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.9,
    max_tokens=512,
)

# 批量推理
prompts = [
    "What is the capital of France?",
    "Explain quantum computing in simple terms.",
    "Write a Python function to sort a list.",
]

# 生成
outputs = llm.generate(prompts, sampling_params)

for output in outputs:
    prompt = output.prompt
    generated_text = output.outputs[0].text
    print(f"Prompt: {prompt}")
    print(f"Generated: {generated_text}\n")
```

**vLLM 性能优化：**

**1. CUDA Graph：**
```python
# 捕获 CUDA Graph (消除 kernel launch overhead)
with torch.cuda.graph(self.cuda_graph):
    output = self.model.forward(...)

# 重放
self.cuda_graph.replay()
```

**2. Flash Attention：**
```python
# 使用 Flash Attention 2 加速
from flash_attn import flash_attn_func

attention_output = flash_attn_func(
    q, k, v,
    dropout_p=0.0,
    softmax_scale=1.0 / math.sqrt(head_dim),
    causal=True
)
```

**3. 量化 (INT8/FP8)：**
```python
llm = LLM(
    model="meta-llama/Llama-2-70b-chat-hf",
    quantization="awq",  # or "gptq", "squeezellm"
    dtype="float16"
)
```

**我的实践经验：**

**vLLM 调优技巧：**
1. **gpu_memory_utilization**：0.85-0.95 (太低浪费，太高 OOM)
2. **max_num_seqs**：根据模型大小调整 (70B: 64-128)
3. **block_size**：16-32 (较小减少内存浪费)
4. **tensor_parallel_size**：与 GPU 数量匹配

**性能对比：**
```
Llama 2 70B (A100 80GB x 4):
- HuggingFace Transformers: 10 tokens/s
- vLLM: 40-60 tokens/s (4-6x)
```

---

## 三、SGLang 与 RadixAttention

### 3. SGLang 的 RadixAttention 是什么？与 vLLM 有何不同？

**参考答案：**

**SGLang (Structured Generation Language)：**

SGLang 由 lmsys 开发，专注于**结构化生成**和**多轮对话**优化。

**核心创新：RadixAttention**

**问题：多轮对话中的 KV Cache 复用**

```
场景: 多轮对话

Turn 1:
User: "Hello, tell me about Python."
Assistant: "Python is a high-level..."

Turn 2:
User: "What are its advantages?"
Assistant: "Python's advantages include..."

Turn 3:
User: "Show me an example."
Assistant: "Here's a Python example..."

问题:
- vLLM: 每轮对话都重新计算整个上下文的 KV Cache
- 上下文重复部分 (System Prompt + History) 反复计算
- 浪费计算和内存
```

**RadixAttention 原理：**

```
Radix Tree 存储 KV Cache

                    [System Prompt]
                           │
                    ┌──────┴──────┐
                    │             │
              [Turn 1 User]  [Turn 2 User]
                    │             │
              [Turn 1 Asst]  [Turn 2 Asst]
                    │             │
                    ...           ...

特点:
1. 共享前缀: System Prompt 只计算一次
2. 分支管理: 不同对话分支独立
3. LRU 淘汰: 内存不足时淘汰最久未使用的节点
```

**Radix Tree 实现：**

```python
class RadixTreeNode:
    """Radix Tree 节点"""
    
    def __init__(self, token_ids=None, kv_cache=None):
        self.token_ids = token_ids or []
        self.kv_cache = kv_cache  # KV Cache for these tokens
        self.children = {}  # token_id -> child node
        self.last_access_time = time.time()
        self.ref_count = 0  # 引用计数
    
    def insert(self, token_ids, kv_cache):
        """插入新序列"""
        if not token_ids:
            return self
        
        # 查找公共前缀
        common_prefix_len = 0
        for i in range(min(len(self.token_ids), len(token_ids))):
            if self.token_ids[i] == token_ids[i]:
                common_prefix_len += 1
            else:
                break
        
        if common_prefix_len == len(self.token_ids):
            # 当前节点是前缀
            remaining_tokens = token_ids[common_prefix_len:]
            if not remaining_tokens:
                # 完全匹配
                return self
            
            # 查找或创建子节点
            first_token = remaining_tokens[0]
            if first_token not in self.children:
                # 创建新子节点
                child = RadixTreeNode(remaining_tokens, kv_cache)
                self.children[first_token] = child
                return child
            else:
                # 递归插入到子节点
                return self.children[first_token].insert(remaining_tokens, kv_cache)
        else:
            # 需要分裂节点
            # ...
            pass
    
    def search(self, token_ids):
        """搜索最长匹配前缀"""
        if not token_ids:
            return self, []
        
        # 匹配当前节点
        common_prefix_len = 0
        for i in range(min(len(self.token_ids), len(token_ids))):
            if self.token_ids[i] == token_ids[i]:
                common_prefix_len += 1
            else:
                break
        
        if common_prefix_len < len(self.token_ids):
            # 部分匹配
            return self, token_ids
        
        # 完全匹配当前节点，继续搜索子节点
        remaining_tokens = token_ids[common_prefix_len:]
        if not remaining_tokens:
            return self, []
        
        first_token = remaining_tokens[0]
        if first_token in self.children:
            return self.children[first_token].search(remaining_tokens)
        else:
            return self, remaining_tokens
    
    def evict_lru(self):
        """LRU 淘汰"""
        # 找到最久未使用的叶子节点
        # ...
        pass


class RadixAttentionCache:
    """RadixAttention KV Cache 管理"""
    
    def __init__(self, max_memory):
        self.root = RadixTreeNode()
        self.max_memory = max_memory
        self.current_memory = 0
    
    def match_prefix(self, token_ids):
        """匹配前缀，返回可复用的 KV Cache"""
        matched_node, remaining_tokens = self.root.search(token_ids)
        
        # 返回匹配的 token 数量和 KV Cache
        matched_len = len(token_ids) - len(remaining_tokens)
        return matched_len, matched_node.kv_cache, remaining_tokens
    
    def insert(self, token_ids, kv_cache):
        """插入新的 KV Cache"""
        self.root.insert(token_ids, kv_cache)
        self.current_memory += self._estimate_memory(kv_cache)
        
        # 内存超限，执行 LRU 淘汰
        while self.current_memory > self.max_memory:
            self.root.evict_lru()
```

**SGLang 多轮对话示例：**

```python
import sglang as sgl

@sgl.function
def multi_turn_chat(s, user_messages):
    # System prompt (只计算一次)
    s += sgl.system("You are a helpful AI assistant.")
    
    for user_msg in user_messages:
        # User message
        s += sgl.user(user_msg)
        
        # Assistant response
        s += sgl.assistant(sgl.gen("response", max_tokens=256))

# 使用
state = multi_turn_chat.run(
    user_messages=[
        "Hello, tell me about Python.",
        "What are its advantages?",
        "Show me an example."
    ],
    backend="sglang-runtime",
)

# RadixAttention 自动复用:
# - System prompt KV Cache (复用 3 次)
# - Turn 1 KV Cache (复用 2 次)
# - Turn 2 KV Cache (复用 1 次)
```

**SGLang 其他特性：**

**1. Constrained Generation (约束生成)：**

```python
@sgl.function
def structured_output(s, topic):
    s += "Generate a JSON object about " + topic + ":\n"
    
    # 约束生成 JSON
    s += "{\n"
    s += '  "name": ' + sgl.gen("name", regex=r'"[^"]*"') + ",\n"
    s += '  "age": ' + sgl.gen("age", regex=r"\d+") + ",\n"
    s += '  "email": ' + sgl.gen("email", regex=r'"[^@]+@[^@]+\.[^@]+"') + "\n"
    s += "}"

# 生成
state = structured_output.run(topic="a person")
# 输出保证是合法的 JSON
```

**2. Parallel Sampling：**

```python
@sgl.function
def parallel_sampling(s, prompt):
    s += prompt
    
    # 并行采样多个候选
    forks = s.fork(4)  # 4 个候选
    for i, fork in enumerate(forks):
        fork += sgl.gen(f"candidate_{i}", temperature=0.8, max_tokens=100)
    
    # 合并结果
    s.join()
    
    # 选择最佳候选 (可根据 reward model 评分)
    best = s.select_best(forks, criteria="length")

state = parallel_sampling.run(prompt="Write a poem:")
```

**vLLM vs SGLang 对比：**

| 特性 | vLLM | SGLang |
|------|------|--------|
| **KV Cache 管理** | PagedAttention (按需分配) | RadixAttention (前缀复用) |
| **适用场景** | 单次推理、批量推理 | 多轮对话、结构化生成 |
| **吞吐量** | 高 (Continuous Batching) | 中 |
| **延迟** | 中 | 低 (复用 KV Cache) |
| **内存效率** | 高 (分页) | 极高 (前缀共享) |
| **API** | OpenAI Compatible | SGLang DSL |
| **适合任务** | Chat、Code、Translation | Agent、RAG、Multi-turn |

**我的实践经验：**

**选择建议：**
```python
if workload == "single_turn_inference":
    # 单次推理、批量推理
    use_vllm()
elif workload == "multi_turn_chat":
    # 多轮对话、Agent
    use_sglang()
elif workload == "structured_generation":
    # JSON、代码生成、约束生成
    use_sglang()
else:
    # 通用场景
    use_vllm()  # 更成熟稳定
```

**性能数据：**
```
Llama 2 70B 多轮对话 (10轮):
- vLLM: 每轮计算所有上下文 → 10x 计算量
- SGLang: 前缀复用 → 1.5x 计算量
加速比: 6-7x
```

---

## 四、Prefill/Decode 分离 (P/D Separation)

### 4. 什么是 Prefill/Decode 分离？如何实现？

**参考答案：**

**P/D 分离动机：**

```
Prefill vs Decode 特性对比

Prefill (上下文编码):
├─ 输入: 完整 prompt (100-1000 tokens)
├─ 并行计算: 所有 tokens 同时处理
├─ 计算密集: Compute-bound
├─ 吞吐优先: Batch size 可以大
└─ 延迟容忍: 可以慢一点

Decode (逐 token 生成):
├─ 输入: 单个 token
├─ 串行计算: 每次生成 1 个 token
├─ 内存密集: Memory-bound
├─ 延迟敏感: 需要快速响应
└─ 吞吐次要: Batch size 受限

问题: 混合处理导致资源浪费
- Prefill 占用大量计算，阻塞 Decode (延迟上升)
- Decode 低利用率，浪费 GPU (吞吐下降)
```

**分离方案：**

```
┌─────────────────────────────────────┐
│  P/D 分离架构                       │
├─────────────────────────────────────┤
│                                     │
│  Prefill Cluster (计算密集):       │
│  ┌──────────────────────────┐      │
│  │  GPU 0-3 (A100)          │      │
│  │  - Large Batch Size      │      │
│  │  - FP16/BF16             │      │
│  │  - 并行处理多个请求       │      │
│  └──────────┬───────────────┘      │
│             │                       │
│         KV Cache                    │
│             │                       │
│  ┌──────────▼───────────────┐      │
│  │  Decode Cluster (延迟敏感):│     │
│  │  GPU 4-7 (A100)          │      │
│  │  - Small Batch Size      │      │
│  │  - INT8/FP8 量化          │      │
│  │  - 逐 token 生成          │      │
│  └──────────────────────────┘      │
└─────────────────────────────────────┘
```

**实现方式：**

**方式 1：物理分离（不同 GPU 集群）**

```python
# Prefill Server
prefill_server = LLM(
    model="meta-llama/Llama-2-70b-chat-hf",
    tensor_parallel_size=4,
    max_num_seqs=64,  # Large batch
    mode="prefill",
)

# Decode Server
decode_server = LLM(
    model="meta-llama/Llama-2-70b-chat-hf",
    tensor_parallel_size=4,
    max_num_seqs=256,  # Small batch per request
    mode="decode",
    quantization="fp8",  # 量化加速
)

# Coordinator
class PDCoordinator:
    def __init__(self, prefill_server, decode_server):
        self.prefill_server = prefill_server
        self.decode_server = decode_server
    
    async def generate(self, prompt):
        # 1. Prefill 阶段
        kv_cache = await self.prefill_server.prefill(prompt)
        
        # 2. 传输 KV Cache 到 Decode Server
        await self.transfer_kv_cache(kv_cache)
        
        # 3. Decode 阶段
        output = await self.decode_server.decode(kv_cache)
        
        return output
```

**方式 2：时间分离（同一 GPU，调度分离）**

```python
class TemporalPDSeparation:
    """时间分离: 在同一 GPU 上分时执行 Prefill 和 Decode"""
    
    def __init__(self, model):
        self.model = model
        self.prefill_queue = Queue()
        self.decode_queue = Queue()
    
    async def schedule_loop(self):
        while True:
            # 动态调度策略
            if self.should_run_prefill():
                # Prefill 阶段: Batch 多个请求
                batch = self.prefill_queue.get_batch(max_size=32)
                kv_caches = await self.run_prefill_batch(batch)
                
                # 将 KV Cache 加入 Decode queue
                for kv_cache in kv_caches:
                    self.decode_queue.put(kv_cache)
            
            # Decode 阶段: 生成下一个 token
            decode_batch = self.decode_queue.get_all()
            next_tokens = await self.run_decode_batch(decode_batch)
            
            # 完成的请求移除，未完成的继续
            for req, token in zip(decode_batch, next_tokens):
                if not req.is_finished():
                    self.decode_queue.put(req)
    
    def should_run_prefill(self):
        """决定是否执行 Prefill"""
        # 策略 1: Decode queue 不满时优先 Prefill
        if len(self.decode_queue) < 128:
            return True
        
        # 策略 2: Prefill queue 积压过多
        if len(self.prefill_queue) > 16:
            return True
        
        return False
```

**KV Cache 传输优化：**

```python
"""
问题: Prefill → Decode 传输 KV Cache 开销大

KV Cache 大小:
- Llama 2 70B: ~300 MB per request (4K context)
- 100 RPS: 30 GB/s 带宽需求

优化方案:

1. 共享内存 (同节点):
   - 使用 GPU Direct RDMA
   - 避免 CPU 中转

2. 压缩传输 (跨节点):
   - INT8 量化 KV Cache
   - 减少 50% 传输量

3. 异步传输:
   - Prefill 完成后立即传输
   - Decode 边传输边生成

4. KV Cache 卸载:
   - 将 KV Cache 存储到 CPU/NVMe
   - Decode 时按需加载
"""

# 示例: GPU Direct RDMA
import cupy as cp

def transfer_kv_cache_gpu_direct(src_gpu, dst_gpu, kv_cache):
    """GPU 间直接传输 (无 CPU 中转)"""
    with cp.cuda.Device(src_gpu):
        src_array = cp.asarray(kv_cache)
    
    with cp.cuda.Device(dst_gpu):
        # 直接 DMA 传输
        dst_array = cp.empty_like(src_array)
        dst_array[:] = src_array  # GPU-to-GPU copy
    
    return dst_array
```

**Splitwise (Meta)：**

Meta 提出的 Prefill/Decode 分离方案。

```
Splitwise 核心思想:

1. Prefill Instance (高吞吐):
   - 大 Batch Size (128+)
   - 计算优化 (Flash Attention)
   - 生成 KV Cache

2. Decode Instance (低延迟):
   - 小 Batch Size (16-32)
   - 内存优化 (PagedAttention)
   - 消费 KV Cache

3. KV Cache 池:
   - 分布式 KV Cache 存储
   - LRU 缓存策略
   - 异步传输

性能提升:
- 吞吐量: 2-3x
- P99 延迟: 降低 50%
```

**Sarathi (Microsoft)：**

微软提出的统一调度方案。

```
Sarathi 特点:

1. Chunked Prefill:
   - 将长 Prefill 切分为多个 chunk
   - 每个 chunk 与 Decode 交替执行
   - 避免 Prefill 阻塞 Decode

2. 动态 Batch Size:
   - Prefill: Batch=32
   - Decode: Batch=256
   - 根据队列长度调整

3. 虚拟 Token:
   - Padding 到固定长度
   - 减少 kernel launch 开销

性能:
- 吞吐量: 1.5x
- 延迟: 降低 30%
```

**P/D 分离的挑战：**

**1. KV Cache 传输开销：**
```
传输带宽需求:
- 100 RPS, 300 MB/req
- 30 GB/s

优化:
- GPU Direct RDMA: 200 GB/s
- 压缩: 15 GB/s
```

**2. 负载不均衡：**
```
问题: Prefill 和 Decode 负载不一致
- 突发 Prefill 请求 → Prefill 过载
- Decode 完成后闲置

解决: 动态资源分配
- 弹性调整 Prefill/Decode 实例数
- 自动伸缩
```

**3. 状态管理复杂：**
```
需要管理:
- KV Cache 生命周期
- 请求路由
- 故障恢复
```

**我的实践经验：**

**适用场景：**
```python
if avg_prefill_len > 1000 and qps > 100:
    # 长上下文 + 高 QPS
    use_pd_separation()
elif prefill_latency_sensitive:
    # Prefill 延迟敏感（实时对话）
    use_unified()  # 不分离
else:
    # 通用场景
    use_unified()  # vLLM
```

**性能数据：**
```
场景: Llama 2 70B, 2K context, 100 RPS

Unified (vLLM):
- P99 Latency: 500ms
- Throughput: 100 tokens/s

P/D Separation:
- P99 Latency: 200ms (↓60%)
- Throughput: 250 tokens/s (↑150%)
```

---

## 五、推理优化技术

### 5. LLM 推理还有哪些优化技术？

**参考答案：**

**优化技术分类：**

```
推理优化技术
├── 模型优化
│   ├── 量化 (Quantization)
│   ├── 剪枝 (Pruning)
│   ├── 蒸馏 (Distillation)
│   └── 架构优化 (MQA/GQA)
├── 算子优化
│   ├── Kernel Fusion
│   ├── Flash Attention
│   └── CUDA Graph
├── 系统优化
│   ├── Continuous Batching
│   ├── KV Cache 管理
│   └── Speculative Decoding
└── 硬件优化
    ├── Tensor Core
    ├── FP8/INT4
    └── Custom ASIC
```

**1. 量化 (Quantization)：**

**GPTQ (Post-Training Quantization)：**
```python
from transformers import AutoModelForCausalLM, GPTQConfig

# GPTQ 4-bit 量化
quantization_config = GPTQConfig(
    bits=4,
    dataset="c4",
    tokenizer=tokenizer,
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-70b-hf",
    quantization_config=quantization_config,
    device_map="auto"
)

# 内存占用: 70B * 4 bits = 35 GB (vs 140 GB FP16)
```

**AWQ (Activation-aware Weight Quantization)：**
```python
# AWQ: 保护重要权重不量化
from awq import AutoAWQForCausalLM

model = AutoAWQForCausalLM.from_pretrained(
    "meta-llama/Llama-2-70b-hf"
)
model.quantize(
    tokenizer,
    quant_config={"zero_point": True, "q_group_size": 128}
)

# 精度损失: < 1% (vs GPTQ 2-3%)
```

**SmoothQuant (Smooth Activation Quantization)：**
```python
# SmoothQuant: 平滑激活值分布
# 适合激活值量化 (W8A8)

# 内存: 70B * 1 byte = 70 GB
# 速度: 2x vs FP16
```

**2. Speculative Decoding (投机解码)：**

```python
"""
原理: 用小模型快速生成候选，大模型验证

传统 Autoregressive Decoding:
Step 1: 大模型生成 token 1 (100ms)
Step 2: 大模型生成 token 2 (100ms)
Step 3: 大模型生成 token 3 (100ms)
总计: 300ms for 3 tokens

Speculative Decoding:
Step 1: 小模型快速生成 3 个候选 tokens (30ms)
Step 2: 大模型并行验证 3 个 tokens (100ms)
总计: 130ms for 3 tokens (2.3x 加速)
"""

class SpeculativeDecoding:
    def __init__(self, draft_model, target_model):
        self.draft_model = draft_model  # 小模型 (e.g., 7B)
        self.target_model = target_model  # 大模型 (e.g., 70B)
    
    def generate(self, prompt, max_tokens=100, k=4):
        """
        k: 投机步数 (每次生成 k 个候选)
        """
        tokens = self.tokenize(prompt)
        
        while len(tokens) < max_tokens:
            # 1. Draft 模型生成 k 个候选
            draft_tokens = self.draft_model.generate(
                tokens,
                max_new_tokens=k,
                do_sample=True
            )
            
            # 2. Target 模型并行验证
            # 计算每个候选的概率
            target_probs = self.target_model.forward(
                torch.cat([tokens, draft_tokens])
            )
            
            # 3. 接受或拒绝
            accepted = 0
            for i, draft_token in enumerate(draft_tokens):
                target_prob = target_probs[len(tokens) + i]
                draft_prob = self.draft_model.get_prob(draft_token)
                
                # 接受概率
                accept_prob = min(1, target_prob / draft_prob)
                
                if random.random() < accept_prob:
                    tokens.append(draft_token)
                    accepted += 1
                else:
                    # 拒绝，从 target 分布重新采样
                    token = self.sample_from_adjusted_dist(
                        target_prob, draft_prob
                    )
                    tokens.append(token)
                    break  # 停止接受
            
            if accepted == 0:
                # 全部拒绝，fallback 到普通生成
                token = self.target_model.generate_one(tokens)
                tokens.append(token)
        
        return tokens
```

**3. Multi-Query Attention (MQA) / Grouped-Query Attention (GQA)：**

```python
"""
标准 Multi-Head Attention:
- Q, K, V 都有多个 head
- KV Cache = num_heads * seq_len * head_dim

Multi-Query Attention (MQA):
- Q 多个 head，K/V 单个 head
- KV Cache = 1 * seq_len * head_dim
- 减少 KV Cache 内存 num_heads 倍 (e.g., 64x)

Grouped-Query Attention (GQA):
- Q 多个 head，K/V 分组 (e.g., 8 groups)
- KV Cache = 8 * seq_len * head_dim
- 平衡性能和内存

模型示例:
- Llama 2 70B: MHA (64 heads)
- Llama 3 8B: GQA (8 groups)
- PaLM: MQA (1 group)
"""

class GroupedQueryAttention(nn.Module):
    def __init__(self, hidden_size, num_q_heads=64, num_kv_heads=8):
        super().__init__()
        
        self.num_q_heads = num_q_heads
        self.num_kv_heads = num_kv_heads
        self.num_q_per_kv = num_q_heads // num_kv_heads
        self.head_dim = hidden_size // num_q_heads
        
        # Q: 64 heads
        self.q_proj = nn.Linear(hidden_size, hidden_size)
        
        # K, V: 8 heads (8x smaller)
        self.k_proj = nn.Linear(hidden_size, num_kv_heads * self.head_dim)
        self.v_proj = nn.Linear(hidden_size, num_kv_heads * self.head_dim)
        
        self.o_proj = nn.Linear(hidden_size, hidden_size)
    
    def forward(self, x):
        B, S, H = x.shape
        
        # Q: [B, S, 64, head_dim]
        q = self.q_proj(x).view(B, S, self.num_q_heads, self.head_dim)
        
        # K, V: [B, S, 8, head_dim]
        k = self.k_proj(x).view(B, S, self.num_kv_heads, self.head_dim)
        v = self.v_proj(x).view(B, S, self.num_kv_heads, self.head_dim)
        
        # 复制 K, V 到匹配 Q 的 head 数
        # [B, S, 8, head_dim] → [B, S, 64, head_dim]
        k = k.repeat_interleave(self.num_q_per_kv, dim=2)
        v = v.repeat_interleave(self.num_q_per_kv, dim=2)
        
        # 标准 Attention
        attn_output = F.scaled_dot_product_attention(q, k, v)
        
        # Output projection
        output = self.o_proj(attn_output.reshape(B, S, H))
        return output

# KV Cache 内存节省: 64 heads → 8 heads = 8x
```

**4. Flash Decoding：**

```python
"""
Flash Decoding 优化 Decode 阶段

标准 Decode Attention:
for each query token:
    for each KV token:
        score = Q @ K^T
        attn = softmax(score) @ V
    
问题: 逐 token 加载 KV Cache，内存带宽瓶颈

Flash Decoding:
- 并行化 KV tokens 维度
- 减少内存访问
- 加速 2-3x
"""
```

**5. Continuous Batching 调度策略：**

```python
class ContinuousBatchScheduler:
    """高级调度策略"""
    
    def __init__(self, max_batch_size=256):
        self.max_batch_size = max_batch_size
        self.running_requests = []
        self.waiting_requests = Queue()
    
    def schedule(self):
        # 移除已完成的请求
        self.running_requests = [
            req for req in self.running_requests
            if not req.is_finished()
        ]
        
        # 添加新请求 (直到达到 max_batch_size)
        while len(self.running_requests) < self.max_batch_size:
            if self.waiting_requests.empty():
                break
            
            new_req = self.waiting_requests.get()
            
            # 检查是否有足够内存
            if self.can_allocate_kv_cache(new_req):
                self.running_requests.append(new_req)
            else:
                # 内存不足，等待
                self.waiting_requests.put(new_req)
                break
        
        return self.running_requests
    
    def can_allocate_kv_cache(self, request):
        """检查 KV Cache 内存"""
        required_blocks = (request.max_tokens + block_size - 1) // block_size
        return block_allocator.can_allocate(required_blocks)
```

**我的优化经验总结：**

**优化优先级：**
```python
# 1. PagedAttention (vLLM) - 必选
memory_efficiency = 3x

# 2. Continuous Batching - 必选
throughput = 2-3x

# 3. Flash Attention - 推荐
prefill_speedup = 2x

# 4. INT8 量化 (SmoothQuant) - 可选
memory = 0.5x, speed = 1.5x

# 5. Speculative Decoding - 可选
decode_speedup = 2x (需要 draft model)

# 总加速: 10-20x vs 原生 HuggingFace
```

**成本优化：**
```
Llama 2 70B 推理成本:

原生 HuggingFace:
- 硬件: 4x A100 80GB
- 吞吐: 10 tokens/s
- 成本: $8/hour

vLLM + INT8:
- 硬件: 2x A100 80GB
- 吞吐: 80 tokens/s
- 成本: $4/hour
- 性价比: 16x
```

---

## 致谢

本文档深入介绍了 LLM 推理优化的核心技术，包括 vLLM 的 PagedAttention、SGLang 的 RadixAttention、Prefill/Decode 分离等前沿方案。这些技术是构建高效 LLM 服务的基础。

**延伸阅读：**
- [vLLM Paper](https://arxiv.org/abs/2309.06180)
- [SGLang](https://github.com/sgl-project/sglang)
- [Flash Attention](https://arxiv.org/abs/2205.14135)
- [Speculative Decoding](https://arxiv.org/abs/2211.17192)
