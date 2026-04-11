# AI Agent框架面试准备 - Skill和Tools实现

## 1. AI Agent基础概念

### 1.1 什么是AI Agent？核心组件有哪些？

**回答要点：**

AI Agent是能够感知环境、做出决策并采取行动来实现目标的智能系统。现代LLM-based Agent的核心组件包括：

1. **Planning（规划）**
   - 将复杂任务分解为子任务
   - 使用Chain-of-Thought、ReAct等推理模式
   - 支持self-reflection和plan refinement

2. **Memory（记忆）**
   - Short-term memory：对话上下文
   - Long-term memory：向量数据库存储的知识
   - Working memory：任务执行过程中的中间状态

3. **Tools（工具）**
   - 外部API调用能力
   - 代码执行环境
   - 搜索引擎、数据库等资源访问

4. **Action（行动）**
   - 工具选择和参数生成
   - 执行结果的解析和验证
   - 错误处理和重试机制

**代码示例 - 简单Agent框架：**

```python
from typing import List, Dict, Any, Callable
import json

class Tool:
    """工具基类"""
    def __init__(self, name: str, description: str, func: Callable):
        self.name = name
        self.description = description
        self.func = func
    
    def run(self, **kwargs) -> Any:
        """执行工具"""
        return self.func(**kwargs)
    
    def to_schema(self) -> Dict:
        """转换为LLM可理解的schema"""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self._get_parameters()
        }
    
    def _get_parameters(self) -> Dict:
        """获取函数参数schema"""
        import inspect
        sig = inspect.signature(self.func)
        parameters = {}
        for name, param in sig.parameters.items():
            parameters[name] = {
                "type": "string",  # 简化处理
                "description": f"Parameter {name}"
            }
        return {
            "type": "object",
            "properties": parameters,
            "required": list(parameters.keys())
        }


class Agent:
    """基础Agent实现"""
    def __init__(self, llm_client, tools: List[Tool]):
        self.llm = llm_client
        self.tools = {tool.name: tool for tool in tools}
        self.memory = []  # 对话历史
        
    def run(self, task: str, max_iterations: int = 10) -> str:
        """执行任务的主循环"""
        self.memory.append({"role": "user", "content": task})
        
        for i in range(max_iterations):
            # 1. LLM推理：决定下一步行动
            response = self._llm_call()
            
            # 2. 解析响应
            if self._is_final_answer(response):
                return self._extract_answer(response)
            
            # 3. 执行工具调用
            tool_name, tool_args = self._parse_tool_call(response)
            if tool_name:
                result = self._execute_tool(tool_name, tool_args)
                self.memory.append({
                    "role": "assistant",
                    "content": f"Action: {tool_name}\nArgs: {tool_args}\nResult: {result}"
                })
            else:
                # 如果无法解析工具调用，让LLM继续思考
                self.memory.append({"role": "assistant", "content": response})
        
        return "Max iterations reached without final answer"
    
    def _llm_call(self) -> str:
        """调用LLM"""
        system_prompt = self._build_system_prompt()
        messages = [{"role": "system", "content": system_prompt}] + self.memory
        
        # 假设使用OpenAI格式的API
        response = self.llm.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0
        )
        return response.choices[0].message.content
    
    def _build_system_prompt(self) -> str:
        """构建系统提示词"""
        tools_desc = "\n".join([
            f"- {name}: {tool.description}"
            for name, tool in self.tools.items()
        ])
        
        return f"""You are an AI assistant with access to the following tools:

{tools_desc}

To use a tool, respond in this format:
Action: <tool_name>
Args: {{"arg1": "value1", "arg2": "value2"}}

When you have a final answer, respond:
Final Answer: <your answer>

Think step by step and use tools when needed.
"""
    
    def _is_final_answer(self, response: str) -> bool:
        """检查是否为最终答案"""
        return "Final Answer:" in response
    
    def _extract_answer(self, response: str) -> str:
        """提取最终答案"""
        return response.split("Final Answer:")[-1].strip()
    
    def _parse_tool_call(self, response: str) -> tuple:
        """解析工具调用"""
        if "Action:" not in response:
            return None, None
        
        try:
            lines = response.split("\n")
            tool_name = None
            tool_args = {}
            
            for line in lines:
                if line.startswith("Action:"):
                    tool_name = line.split("Action:")[-1].strip()
                elif line.startswith("Args:"):
                    args_str = line.split("Args:")[-1].strip()
                    tool_args = json.loads(args_str)
            
            return tool_name, tool_args
        except Exception as e:
            print(f"Error parsing tool call: {e}")
            return None, None
    
    def _execute_tool(self, tool_name: str, args: Dict) -> str:
        """执行工具"""
        if tool_name not in self.tools:
            return f"Error: Tool '{tool_name}' not found"
        
        try:
            result = self.tools[tool_name].run(**args)
            return str(result)
        except Exception as e:
            return f"Error executing tool: {str(e)}"
```

**实际使用示例：**

```python
# 定义工具函数
def search_web(query: str) -> str:
    """模拟搜索"""
    # 实际应该调用搜索API
    return f"Search results for '{query}': [模拟结果]"

def calculate(expression: str) -> str:
    """计算器"""
    try:
        result = eval(expression)  # 生产环境应使用安全的计算方式
        return str(result)
    except Exception as e:
        return f"Calculation error: {e}"

def get_weather(city: str) -> str:
    """获取天气"""
    # 实际应该调用天气API
    return f"Weather in {city}: Sunny, 25°C"

# 创建工具列表
tools = [
    Tool("search", "Search the web for information", search_web),
    Tool("calculate", "Perform mathematical calculations", calculate),
    Tool("weather", "Get weather information for a city", get_weather)
]

# 创建Agent
agent = Agent(llm_client=openai_client, tools=tools)

# 执行任务
result = agent.run("What is the weather in Beijing and how much is 123 * 456?")
print(result)
```

### 1.2 ReAct模式是什么？如何实现？

**回答要点：**

ReAct（Reasoning and Acting）是一种将推理（Reasoning）和行动（Acting）交织在一起的Agent模式，由Yao等人在2022年提出。

**核心思想：**
- Thought：思考下一步该做什么
- Action：执行具体的工具调用
- Observation：观察工具执行结果
- 循环上述过程直到得出最终答案

**实现代码：**

```python
class ReActAgent:
    """ReAct模式的Agent实现"""
    
    def __init__(self, llm_client, tools: List[Tool]):
        self.llm = llm_client
        self.tools = {tool.name: tool for tool in tools}
        self.trajectory = []  # 记录完整的推理轨迹
    
    def run(self, question: str, max_steps: int = 10) -> str:
        """执行ReAct循环"""
        self.trajectory = [f"Question: {question}"]
        
        for step in range(1, max_steps + 1):
            # 1. Thought: 让LLM思考
            thought = self._generate_thought(step)
            self.trajectory.append(f"Thought {step}: {thought}")
            
            # 检查是否完成
            if self._is_finished(thought):
                answer = self._extract_final_answer(thought)
                return answer
            
            # 2. Action: 决定使用什么工具
            action, action_input = self._generate_action(thought)
            self.trajectory.append(f"Action {step}: {action}")
            self.trajectory.append(f"Action Input {step}: {action_input}")
            
            # 3. Observation: 执行工具并观察结果
            observation = self._execute_action(action, action_input)
            self.trajectory.append(f"Observation {step}: {observation}")
        
        return "Failed to complete task within max steps"
    
    def _generate_thought(self, step: int) -> str:
        """生成思考"""
        prompt = self._build_react_prompt(step)
        response = self.llm.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            stop=["Observation:"]  # 停止在Observation之前
        )
        return response.choices[0].message.content.strip()
    
    def _build_react_prompt(self, step: int) -> str:
        """构建ReAct提示词"""
        tools_desc = "\n".join([
            f"{name}: {tool.description}"
            for name, tool in self.tools.items()
        ])
        
        trajectory_text = "\n".join(self.trajectory)
        
        return f"""Answer the following question by reasoning step by step.
You have access to the following tools:

{tools_desc}

Use this format:

Thought: Think about what to do next
Action: the tool to use (one of [{', '.join(self.tools.keys())}])
Action Input: the input to the tool
Observation: the result of the action
... (repeat Thought/Action/Action Input/Observation as needed)
Thought: I now know the final answer
Final Answer: the final answer to the question

Begin!

{trajectory_text}
Thought {step}:"""
    
    def _is_finished(self, thought: str) -> bool:
        """检查是否完成"""
        return "final answer" in thought.lower()
    
    def _extract_final_answer(self, thought: str) -> str:
        """提取最终答案"""
        if "Final Answer:" in thought:
            return thought.split("Final Answer:")[-1].strip()
        return thought
    
    def _generate_action(self, thought: str) -> tuple:
        """从思考中提取Action"""
        # 继续生成获取Action
        prompt = "\n".join(self.trajectory + [f"Thought: {thought}\nAction:"])
        
        response = self.llm.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            stop=["Observation:"]
        )
        
        text = response.choices[0].message.content.strip()
        
        # 解析Action和Action Input
        action = None
        action_input = None
        
        for line in text.split("\n"):
            if line.startswith("Action:"):
                action = line.split("Action:")[-1].strip()
            elif line.startswith("Action Input:"):
                action_input = line.split("Action Input:")[-1].strip()
        
        return action, action_input
    
    def _execute_action(self, action: str, action_input: str) -> str:
        """执行动作"""
        if action not in self.tools:
            return f"Error: Unknown tool '{action}'"
        
        try:
            # 根据工具的参数类型构造调用
            tool = self.tools[action]
            result = tool.run(query=action_input) if action == "search" else tool.run(expression=action_input)
            return str(result)
        except Exception as e:
            return f"Error: {str(e)}"


# 使用示例
react_agent = ReActAgent(llm_client=openai_client, tools=tools)
answer = react_agent.run("What is the capital of France and what's the population?")
print(answer)
print("\n=== Full Trajectory ===")
print("\n".join(react_agent.trajectory))
```

## 2. 工具(Tools)系统设计

### 2.1 如何设计一个健壮的Tool系统？

**回答要点：**

一个生产级的Tool系统需要考虑：

1. **Schema定义**
   - 使用Pydantic进行参数验证
   - 支持OpenAPI/Function Calling格式
   - 自动生成文档

2. **错误处理**
   - 超时控制
   - 重试机制
   - 友好的错误消息

3. **安全性**
   - 输入验证和清洗
   - 权限控制
   - 速率限制

4. **可观测性**
   - 日志记录
   - 执行时间监控
   - 成功率统计

**完整实现：**

```python
from typing import Any, Callable, Optional, Dict, Type
from pydantic import BaseModel, Field, ValidationError
import time
import logging
from functools import wraps
from enum import Enum

logger = logging.getLogger(__name__)


class ToolCategory(Enum):
    """工具分类"""
    SEARCH = "search"
    CALCULATION = "calculation"
    DATA_ACCESS = "data_access"
    CODE_EXECUTION = "code_execution"
    COMMUNICATION = "communication"


class ToolMetrics:
    """工具执行指标"""
    def __init__(self):
        self.call_count = 0
        self.success_count = 0
        self.error_count = 0
        self.total_duration = 0.0
    
    def record_success(self, duration: float):
        self.call_count += 1
        self.success_count += 1
        self.total_duration += duration
    
    def record_error(self, duration: float):
        self.call_count += 1
        self.error_count += 1
        self.total_duration += duration
    
    def get_stats(self) -> Dict:
        avg_duration = self.total_duration / self.call_count if self.call_count > 0 else 0
        success_rate = self.success_count / self.call_count if self.call_count > 0 else 0
        return {
            "call_count": self.call_count,
            "success_rate": success_rate,
            "avg_duration_ms": avg_duration * 1000
        }


def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """重试装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        logger.warning(f"Attempt {attempt + 1} failed: {e}, retrying...")
                        time.sleep(delay)
            raise last_exception
        return wrapper
    return decorator


class BaseTool:
    """增强的工具基类"""
    
    def __init__(
        self,
        name: str,
        description: str,
        category: ToolCategory,
        parameters_model: Type[BaseModel],
        func: Callable,
        timeout: Optional[float] = 30.0,
        require_confirmation: bool = False
    ):
        self.name = name
        self.description = description
        self.category = category
        self.parameters_model = parameters_model
        self.func = func
        self.timeout = timeout
        self.require_confirmation = require_confirmation
        self.metrics = ToolMetrics()
    
    def to_openai_schema(self) -> Dict:
        """转换为OpenAI Function Calling格式"""
        schema = self.parameters_model.model_json_schema()
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": schema
            }
        }
    
    def run(self, **kwargs) -> Any:
        """执行工具（带验证和监控）"""
        start_time = time.time()
        
        try:
            # 1. 参数验证
            validated_params = self.parameters_model(**kwargs)
            
            # 2. 日志记录
            logger.info(f"Executing tool: {self.name} with params: {validated_params}")
            
            # 3. 执行工具
            result = self._execute_with_timeout(validated_params)
            
            # 4. 记录成功
            duration = time.time() - start_time
            self.metrics.record_success(duration)
            logger.info(f"Tool {self.name} completed in {duration:.2f}s")
            
            return result
            
        except ValidationError as e:
            duration = time.time() - start_time
            self.metrics.record_error(duration)
            error_msg = f"Parameter validation failed: {e}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        except TimeoutError as e:
            duration = time.time() - start_time
            self.metrics.record_error(duration)
            error_msg = f"Tool execution timeout after {self.timeout}s"
            logger.error(error_msg)
            raise TimeoutError(error_msg)
        
        except Exception as e:
            duration = time.time() - start_time
            self.metrics.record_error(duration)
            logger.error(f"Tool execution failed: {e}")
            raise
    
    def _execute_with_timeout(self, params: BaseModel) -> Any:
        """带超时的执行"""
        import signal
        
        def timeout_handler(signum, frame):
            raise TimeoutError()
        
        # 设置超时（仅Unix系统）
        if self.timeout and hasattr(signal, 'SIGALRM'):
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(int(self.timeout))
        
        try:
            result = self.func(**params.model_dump())
            return result
        finally:
            if self.timeout and hasattr(signal, 'SIGALRM'):
                signal.alarm(0)  # 取消超时
    
    def get_metrics(self) -> Dict:
        """获取工具执行统计"""
        return {
            "name": self.name,
            "category": self.category.value,
            **self.metrics.get_stats()
        }


# === 具体工具实现示例 ===

class SearchParams(BaseModel):
    """搜索工具参数"""
    query: str = Field(..., description="Search query string")
    max_results: int = Field(10, ge=1, le=100, description="Maximum number of results")
    
class CalculatorParams(BaseModel):
    """计算器参数"""
    expression: str = Field(..., description="Mathematical expression to evaluate")

class WeatherParams(BaseModel):
    """天气查询参数"""
    city: str = Field(..., description="City name")
    unit: str = Field("celsius", description="Temperature unit (celsius/fahrenheit)")


# 工具函数实现
@retry_on_failure(max_retries=3)
def search_function(query: str, max_results: int) -> str:
    """搜索实现"""
    # 实际应调用真实搜索API（如Google Search API、Bing API等）
    import requests
    
    # 示例：使用DuckDuckGo Instant Answer API
    url = "https://api.duckduckgo.com/"
    params = {"q": query, "format": "json"}
    
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    
    data = response.json()
    abstract = data.get("Abstract", "No results found")
    
    return f"Search results for '{query}':\n{abstract}"


def calculator_function(expression: str) -> str:
    """安全的计算器实现"""
    import ast
    import operator
    
    # 只允许安全的操作
    allowed_operators = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
    }
    
    def eval_expr(node):
        if isinstance(node, ast.Num):
            return node.n
        elif isinstance(node, ast.BinOp):
            op = allowed_operators.get(type(node.op))
            if op is None:
                raise ValueError(f"Operator {type(node.op)} not allowed")
            return op(eval_expr(node.left), eval_expr(node.right))
        elif isinstance(node, ast.UnaryOp):
            op = allowed_operators.get(type(node.op))
            if op is None:
                raise ValueError(f"Operator {type(node.op)} not allowed")
            return op(eval_expr(node.operand))
        else:
            raise ValueError(f"Invalid expression: {type(node)}")
    
    try:
        tree = ast.parse(expression, mode='eval')
        result = eval_expr(tree.body)
        return f"{expression} = {result}"
    except Exception as e:
        return f"Error evaluating expression: {e}"


# 创建工具实例
search_tool = BaseTool(
    name="search",
    description="Search the web for information",
    category=ToolCategory.SEARCH,
    parameters_model=SearchParams,
    func=search_function,
    timeout=15.0
)

calculator_tool = BaseTool(
    name="calculator",
    description="Perform mathematical calculations safely",
    category=ToolCategory.CALCULATION,
    parameters_model=CalculatorParams,
    func=calculator_function,
    timeout=5.0
)


# 工具管理器
class ToolRegistry:
    """工具注册中心"""
    
    def __init__(self):
        self.tools: Dict[str, BaseTool] = {}
    
    def register(self, tool: BaseTool):
        """注册工具"""
        self.tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")
    
    def get(self, name: str) -> Optional[BaseTool]:
        """获取工具"""
        return self.tools.get(name)
    
    def list_tools(self) -> List[Dict]:
        """列出所有工具"""
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "category": tool.category.value
            }
            for tool in self.tools.values()
        ]
    
    def to_openai_functions(self) -> List[Dict]:
        """导出为OpenAI Functions格式"""
        return [tool.to_openai_schema() for tool in self.tools.values()]
    
    def get_all_metrics(self) -> List[Dict]:
        """获取所有工具的统计信息"""
        return [tool.get_metrics() for tool in self.tools.values()]


# 使用示例
registry = ToolRegistry()
registry.register(search_tool)
registry.register(calculator_tool)

# 执行工具
try:
    result = calculator_tool.run(expression="(10 + 5) * 3")
    print(result)
    
    # 查看统计
    print(calculator_tool.get_metrics())
except Exception as e:
    print(f"Error: {e}")
```

### 2.2 如何实现Function Calling与工具集成？

**回答要点：**

Function Calling是OpenAI等模型提供的能力，让LLM能够结构化地调用外部函数。

**实现流程：**
1. 将工具转换为Function schema
2. 在API调用时传入functions参数
3. 解析模型返回的function_call
4. 执行对应的工具
5. 将结果返回给模型继续对话

**完整实现：**

```python
import openai
import json
from typing import List, Optional

class FunctionCallingAgent:
    """使用OpenAI Function Calling的Agent"""
    
    def __init__(self, api_key: str, tools: List[BaseTool], model: str = "gpt-4"):
        self.client = openai.OpenAI(api_key=api_key)
        self.model = model
        self.registry = ToolRegistry()
        for tool in tools:
            self.registry.register(tool)
        self.messages = []
    
    def run(self, user_message: str) -> str:
        """执行对话"""
        self.messages.append({"role": "user", "content": user_message})
        
        while True:
            # 1. 调用LLM（传入可用的functions）
            response = self.client.chat.completions.create(
                model=self.model,
                messages=self.messages,
                functions=self.registry.to_openai_functions(),
                function_call="auto"  # 让模型自动决定是否调用函数
            )
            
            message = response.choices[0].message
            
            # 2. 检查是否要调用函数
            if message.function_call:
                # 3. 执行函数
                function_name = message.function_call.name
                function_args = json.loads(message.function_call.arguments)
                
                logger.info(f"LLM wants to call: {function_name}({function_args})")
                
                # 添加assistant消息（包含function_call）
                self.messages.append({
                    "role": "assistant",
                    "content": None,
                    "function_call": {
                        "name": function_name,
                        "arguments": message.function_call.arguments
                    }
                })
                
                # 执行工具
                tool = self.registry.get(function_name)
                if tool:
                    try:
                        result = tool.run(**function_args)
                        function_response = str(result)
                    except Exception as e:
                        function_response = f"Error: {str(e)}"
                else:
                    function_response = f"Error: Tool '{function_name}' not found"
                
                # 4. 将函数结果添加到消息
                self.messages.append({
                    "role": "function",
                    "name": function_name,
                    "content": function_response
                })
                
                # 继续循环，让LLM处理函数结果
                continue
            
            else:
                # 5. 没有函数调用，返回最终答案
                final_answer = message.content
                self.messages.append({"role": "assistant", "content": final_answer})
                return final_answer
    
    def reset(self):
        """重置对话"""
        self.messages = []


# 使用示例
agent = FunctionCallingAgent(
    api_key="your-api-key",
    tools=[search_tool, calculator_tool]
)

# 执行任务
response = agent.run("What is 15 * 234 + 567?")
print(response)

# 查看完整对话历史
print("\n=== Conversation History ===")
for msg in agent.messages:
    print(json.dumps(msg, indent=2, ensure_ascii=False))
```

## 3. Memory系统实现

### 3.1 如何实现Agent的长期记忆？

**回答要点：**

Agent的记忆系统通常分为：
1. **Short-term Memory**：当前对话的上下文窗口
2. **Long-term Memory**：持久化存储的知识和经验
3. **Episodic Memory**：特定任务执行的轨迹记录

长期记忆通常使用向量数据库实现：

```python
from typing import List, Dict
import numpy as np
from datetime import datetime
import chromadb
from chromadb.config import Settings

class VectorMemory:
    """基于向量数据库的长期记忆"""
    
    def __init__(self, collection_name: str = "agent_memory"):
        # 初始化ChromaDB
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory="./chroma_db"
        ))
        
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
    
    def store(self, text: str, metadata: Dict = None):
        """存储记忆"""
        doc_id = f"mem_{datetime.now().timestamp()}"
        
        self.collection.add(
            documents=[text],
            metadatas=[metadata or {}],
            ids=[doc_id]
        )
        
        return doc_id
    
    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """检索相关记忆"""
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )
        
        memories = []
        if results['documents']:
            for i, doc in enumerate(results['documents'][0]):
                memories.append({
                    "content": doc,
                    "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                    "distance": results['distances'][0][i] if results['distances'] else 0
                })
        
        return memories
    
    def clear(self):
        """清空记忆"""
        self.client.delete_collection(self.collection.name)


class MemoryEnhancedAgent:
    """带记忆的Agent"""
    
    def __init__(self, llm_client, tools: List[BaseTool]):
        self.llm = llm_client
        self.registry = ToolRegistry()
        for tool in tools:
            self.registry.register(tool)
        
        self.short_term_memory = []  # 当前对话
        self.long_term_memory = VectorMemory()
    
    def run(self, user_input: str) -> str:
        """执行任务（带记忆检索）"""
        # 1. 从长期记忆中检索相关内容
        relevant_memories = self.long_term_memory.retrieve(user_input, top_k=3)
        
        # 2. 构建包含记忆的prompt
        memory_context = "\n".join([
            f"- {mem['content']}"
            for mem in relevant_memories
        ])
        
        system_message = f"""You are an AI assistant with access to past experiences.

Relevant past experiences:
{memory_context if memory_context else "None"}

Use this context to inform your responses.
"""
        
        # 3. 执行对话
        messages = [{"role": "system", "content": system_message}]
        messages.extend(self.short_term_memory)
        messages.append({"role": "user", "content": user_input})
        
        response = self.llm.chat.completions.create(
            model="gpt-4",
            messages=messages
        )
        
        answer = response.choices[0].message.content
        
        # 4. 更新短期记忆
        self.short_term_memory.append({"role": "user", "content": user_input})
        self.short_term_memory.append({"role": "assistant", "content": answer})
        
        # 5. 重要信息存入长期记忆
        self._maybe_store_to_long_term(user_input, answer)
        
        return answer
    
    def _maybe_store_to_long_term(self, user_input: str, answer: str):
        """判断是否需要存入长期记忆"""
        # 简单策略：存储所有对话
        # 生产环境可以使用LLM判断重要性
        self.long_term_memory.store(
            text=f"Q: {user_input}\nA: {answer}",
            metadata={
                "timestamp": datetime.now().isoformat(),
                "type": "qa_pair"
            }
        )
```

## 4. 实战案例：构建一个代码助手Agent

### 4.1 完整实现一个能够读写代码的Agent

```python
import os
import subprocess
from pathlib import Path

# === 工具定义 ===

class ReadFileParams(BaseModel):
    file_path: str = Field(..., description="Path to the file to read")

class WriteFileParams(BaseModel):
    file_path: str = Field(..., description="Path to the file to write")
    content: str = Field(..., description="Content to write to the file")

class RunCommandParams(BaseModel):
    command: str = Field(..., description="Shell command to execute")
    workdir: str = Field(".", description="Working directory")

class SearchCodeParams(BaseModel):
    pattern: str = Field(..., description="Regex pattern to search")
    directory: str = Field(".", description="Directory to search in")


# === 工具函数实现 ===

def read_file_func(file_path: str) -> str:
    """读取文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return f"File content of {file_path}:\n```\n{content}\n```"
    except Exception as e:
        return f"Error reading file: {e}"

def write_file_func(file_path: str, content: str) -> str:
    """写入文件"""
    try:
        # 确保目录存在
        Path(file_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"Successfully wrote to {file_path}"
    except Exception as e:
        return f"Error writing file: {e}"

def run_command_func(command: str, workdir: str = ".") -> str:
    """执行shell命令"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=workdir,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        output = f"Exit code: {result.returncode}\n"
        if result.stdout:
            output += f"STDOUT:\n{result.stdout}\n"
        if result.stderr:
            output += f"STDERR:\n{result.stderr}\n"
        
        return output
    except subprocess.TimeoutExpired:
        return "Command timed out after 30 seconds"
    except Exception as e:
        return f"Error executing command: {e}"

def search_code_func(pattern: str, directory: str = ".") -> str:
    """搜索代码"""
    try:
        result = subprocess.run(
            ["grep", "-r", "-n", pattern, directory],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.stdout:
            return f"Search results:\n{result.stdout}"
        else:
            return "No matches found"
    except Exception as e:
        return f"Error searching: {e}"


# === 创建代码助手工具 ===

code_tools = [
    BaseTool(
        name="read_file",
        description="Read the contents of a file",
        category=ToolCategory.DATA_ACCESS,
        parameters_model=ReadFileParams,
        func=read_file_func
    ),
    BaseTool(
        name="write_file",
        description="Write content to a file",
        category=ToolCategory.DATA_ACCESS,
        parameters_model=WriteFileParams,
        func=write_file_func,
        require_confirmation=True  # 需要确认
    ),
    BaseTool(
        name="run_command",
        description="Execute a shell command",
        category=ToolCategory.CODE_EXECUTION,
        parameters_model=RunCommandParams,
        func=run_command_func,
        require_confirmation=True
    ),
    BaseTool(
        name="search_code",
        description="Search for a pattern in code files",
        category=ToolCategory.SEARCH,
        parameters_model=SearchCodeParams,
        func=search_code_func
    )
]


# === 代码助手Agent ===

class CodeAssistantAgent(FunctionCallingAgent):
    """代码助手Agent"""
    
    def __init__(self, api_key: str):
        super().__init__(api_key, code_tools, model="gpt-4")
        
        # 添加系统提示
        self.messages = [{
            "role": "system",
            "content": """You are a code assistant that can read, write, and execute code.

When helping with coding tasks:
1. First understand the requirement
2. Read existing code if needed
3. Write clean, well-commented code
4. Test the code when possible
5. Explain what you did

Always think step by step."""
        }]


# === 使用示例 ===

if __name__ == "__main__":
    assistant = CodeAssistantAgent(api_key="your-api-key")
    
    # 任务1：创建一个Python脚本
    response = assistant.run("""
    Create a Python script called 'hello.py' that:
    1. Defines a function to greet a user
    2. Takes command line arguments
    3. Prints a personalized greeting
    """)
    print(response)
    
    # 任务2：运行并测试
    response = assistant.run("Now run the script with argument 'World'")
    print(response)
    
    # 任务3：搜索代码
    response = assistant.run("Search for all Python files that contain 'def '")
    print(response)
```

## 5. 高级话题

### 5.1 Multi-Agent协作如何实现？

**回答要点：**

多Agent系统中，不同Agent负责不同的专业领域，通过协作完成复杂任务。

**实现方式：**
1. **层级式**：Manager Agent分配任务给Worker Agents
2. **对等式**：Agents之间直接通信协商
3. **市场式**：Agents通过竞标获取任务

**简单实现：**

```python
class MultiAgentSystem:
    """多Agent系统"""
    
    def __init__(self, manager_llm, worker_llms: Dict[str, Any]):
        self.manager = ManagerAgent(manager_llm)
        self.workers = {
            name: WorkerAgent(name, llm, tools)
            for name, (llm, tools) in worker_llms.items()
        }
    
    def solve(self, task: str) -> str:
        """解决任务"""
        # 1. Manager分解任务
        plan = self.manager.create_plan(task, list(self.workers.keys()))
        
        results = {}
        # 2. 分配给Workers执行
        for step in plan['steps']:
            worker_name = step['assigned_to']
            subtask = step['task']
            
            worker = self.workers[worker_name]
            result = worker.execute(subtask, context=results)
            results[step['id']] = result
        
        # 3. Manager综合结果
        final_answer = self.manager.synthesize(task, results)
        return final_answer


class ManagerAgent:
    """管理Agent"""
    def create_plan(self, task: str, available_workers: List[str]) -> Dict:
        """创建执行计划"""
        # 使用LLM分解任务并分配
        pass
    
    def synthesize(self, task: str, results: Dict) -> str:
        """综合结果"""
        # 使用LLM整合各Worker的结果
        pass


class WorkerAgent:
    """工作Agent"""
    def __init__(self, name: str, llm, tools: List):
        self.name = name
        self.llm = llm
        self.tools = tools
    
    def execute(self, task: str, context: Dict) -> str:
        """执行子任务"""
        # 执行分配的任务
        pass
```

### 5.2 如何评估Agent的性能？

**评估维度：**

1. **任务完成率**：成功解决任务的比例
2. **效率**：完成任务所需的步骤数和时间
3. **成本**：Token消耗、API调用次数
4. **质量**：输出结果的准确性和完整性

**评估框架：**

```python
class AgentEvaluator:
    """Agent评估器"""
    
    def __init__(self):
        self.results = []
    
    def evaluate_task(self, agent, task: str, expected_output: str = None) -> Dict:
        """评估单个任务"""
        start_time = time.time()
        
        try:
            output = agent.run(task)
            success = True
            error = None
        except Exception as e:
            output = None
            success = False
            error = str(e)
        
        duration = time.time() - start_time
        
        # 计算质量分数（如果有期望输出）
        quality_score = None
        if expected_output and output:
            quality_score = self._calculate_similarity(output, expected_output)
        
        result = {
            "task": task,
            "success": success,
            "duration": duration,
            "output": output,
            "quality_score": quality_score,
            "error": error,
            "tool_calls": len(agent.trajectory) if hasattr(agent, 'trajectory') else 0
        }
        
        self.results.append(result)
        return result
    
    def _calculate_similarity(self, output: str, expected: str) -> float:
        """计算相似度（简化版）"""
        # 实际应使用更复杂的评估指标
        from difflib import SequenceMatcher
        return SequenceMatcher(None, output, expected).ratio()
    
    def get_summary(self) -> Dict:
        """获取评估摘要"""
        if not self.results:
            return {}
        
        success_count = sum(1 for r in self.results if r['success'])
        avg_duration = sum(r['duration'] for r in self.results) / len(self.results)
        avg_quality = sum(r['quality_score'] for r in self.results if r['quality_score']) / \
                     len([r for r in self.results if r['quality_score']])
        
        return {
            "total_tasks": len(self.results),
            "success_rate": success_count / len(self.results),
            "avg_duration": avg_duration,
            "avg_quality_score": avg_quality
        }


# 使用示例
evaluator = AgentEvaluator()

test_cases = [
    ("Calculate 123 * 456", "56088"),
    ("What is the capital of France?", "Paris"),
    # 更多测试用例...
]

for task, expected in test_cases:
    result = evaluator.evaluate_task(agent, task, expected)
    print(f"Task: {task}")
    print(f"Success: {result['success']}, Duration: {result['duration']:.2f}s")

print("\n=== Summary ===")
print(evaluator.get_summary())
```

## 6. 面试常见问题

**Q1: ReAct和Chain-of-Thought有什么区别？**

A: CoT只有推理过程，没有行动；ReAct交织了推理(Thought)和行动(Action)，可以通过工具调用获取外部信息。

**Q2: 如何防止Agent进入无限循环？**

A: 
1. 设置最大迭代次数
2. 检测重复的Action序列
3. 使用self-reflection让Agent评估进展
4. 设置超时机制

**Q3: Function Calling vs Prompt-based工具调用的优缺点？**

A:
- Function Calling: 结构化、可靠性高、但依赖模型支持
- Prompt-based: 灵活、模型无关、但解析可能不稳定

**Q4: 如何处理工具调用失败？**

A:
1. 返回友好的错误消息给LLM
2. 让LLM选择重试或换工具
3. 实现自动重试机制
4. 记录失败日志用于优化

**Q5: Long-term Memory如何避免检索不相关内容？**

A:
1. 使用更好的Embedding模型
2. 添加Metadata过滤
3. 使用Hybrid Search（向量+关键词）
4. 定期清理过期记忆
5. 使用Re-ranking模型

## 总结

构建生产级AI Agent需要考虑：
1. **健壮的工具系统**：参数验证、错误处理、监控
2. **合理的推理模式**：ReAct、CoT、Plan-and-Execute
3. **有效的记忆管理**：短期+长期记忆结合
4. **安全性**：输入验证、权限控制、沙箱执行
5. **可观测性**：日志、指标、链路追踪
