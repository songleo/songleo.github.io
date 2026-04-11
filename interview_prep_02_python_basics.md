# Python编程基础 - AI开发必备技能

## 目录
1. Python基础语法
2. 数据结构（列表、字典、元组）
3. 函数和类
4. NumPy数组操作
5. 文件操作
6. 常用库简介

---

## 1. Python基础语法

### 1.1 变量和数据类型

```python
# 数字
age = 25                  # 整数 (int)
height = 1.75             # 浮点数 (float)
price = 99.99

# 字符串
name = "张三"             # 双引号
city = '北京'             # 单引号都可以
message = """这是
多行字符串"""              # 三引号可以换行

# 布尔值
is_student = True
has_gpu = False

# 查看类型
print(type(age))          # <class 'int'>
print(type(name))         # <class 'str'>

# 类型转换
x = "123"
y = int(x)                # 字符串转整数
z = float(x)              # 字符串转浮点数
s = str(456)              # 数字转字符串

print(y, type(y))         # 123 <class 'int'>
```

### 1.2 基本运算

```python
# 算术运算
a = 10
b = 3

print(a + b)              # 13 加法
print(a - b)              # 7 减法
print(a * b)              # 30 乘法
print(a / b)              # 3.333... 除法
print(a // b)             # 3 整除
print(a % b)              # 1 取余
print(a ** b)             # 1000 幂运算

# 比较运算
print(a > b)              # True
print(a == b)             # False
print(a != b)             # True

# 逻辑运算
print(True and False)     # False
print(True or False)      # True
print(not True)           # False
```

### 1.3 字符串操作

```python
s = "Hello World"

# 索引和切片
print(s[0])               # 'H' 第一个字符
print(s[-1])              # 'd' 最后一个字符
print(s[0:5])             # 'Hello' 切片 [开始:结束)
print(s[:5])              # 'Hello' 省略开始，从0开始
print(s[6:])              # 'World' 省略结束，到最后
print(s[::2])             # 'HloWrd' 每隔一个取一个

# 常用方法
print(s.lower())          # 'hello world' 转小写
print(s.upper())          # 'HELLO WORLD' 转大写
print(s.replace('World', 'Python'))  # 'Hello Python' 替换
print(s.split())          # ['Hello', 'World'] 分割成列表
print(len(s))             # 11 长度

# 字符串格式化
name = "李明"
age = 20
# 方法1：f-string (推荐)
msg = f"我叫{name}，今年{age}岁"
print(msg)                # '我叫李明，今年20岁'

# 方法2：format
msg = "我叫{}，今年{}岁".format(name, age)

# 方法3：百分号（旧式）
msg = "我叫%s，今年%d岁" % (name, age)

# 更复杂的格式化
pi = 3.14159
print(f"π ≈ {pi:.2f}")    # 'π ≈ 3.14' 保留2位小数
num = 1234567
print(f"{num:,}")         # '1,234,567' 千位分隔符
```

### 1.4 条件语句

```python
score = 85

if score >= 90:
    print("优秀")
elif score >= 80:
    print("良好")            # 这个会执行
elif score >= 60:
    print("及格")
else:
    print("不及格")

# 三元表达式
result = "及格" if score >= 60 else "不及格"

# 多条件判断
age = 25
is_student = True

if age > 18 and is_student:
    print("成年学生")

# 判断是否在列表中
if score in [85, 90, 95]:
    print("分数在列表中")
```

### 1.5 循环

```python
# for循环
for i in range(5):        # 0, 1, 2, 3, 4
    print(i)

for i in range(1, 10, 2): # 1, 3, 5, 7, 9 (开始, 结束, 步长)
    print(i)

# 遍历列表
fruits = ["苹果", "香蕉", "橙子"]
for fruit in fruits:
    print(fruit)

# enumerate - 同时获取索引和值
for i, fruit in enumerate(fruits):
    print(f"{i}: {fruit}")
# 0: 苹果
# 1: 香蕉
# 2: 橙子

# while循环
count = 0
while count < 5:
    print(count)
    count += 1

# break和continue
for i in range(10):
    if i == 3:
        continue          # 跳过3
    if i == 7:
        break             # 遇到7就停止
    print(i)              # 输出：0, 1, 2, 4, 5, 6
```

---

## 2. 数据结构

### 2.1 列表 (List)

列表是**可变的**有序集合。

```python
# 创建列表
numbers = [1, 2, 3, 4, 5]
mixed = [1, "hello", 3.14, True]  # 可以混合类型
empty = []

# 访问元素
print(numbers[0])         # 1
print(numbers[-1])        # 5 最后一个元素
print(numbers[1:3])       # [2, 3] 切片

# 修改元素
numbers[0] = 10
print(numbers)            # [10, 2, 3, 4, 5]

# 添加元素
numbers.append(6)         # 末尾添加
print(numbers)            # [10, 2, 3, 4, 5, 6]

numbers.insert(0, 0)      # 在索引0插入
print(numbers)            # [0, 10, 2, 3, 4, 5, 6]

numbers.extend([7, 8])    # 添加多个元素
print(numbers)            # [0, 10, 2, 3, 4, 5, 6, 7, 8]

# 删除元素
numbers.remove(10)        # 删除值为10的元素
print(numbers)            # [0, 2, 3, 4, 5, 6, 7, 8]

popped = numbers.pop()    # 删除并返回最后一个元素
print(popped)             # 8
print(numbers)            # [0, 2, 3, 4, 5, 6, 7]

del numbers[0]            # 删除索引0的元素
print(numbers)            # [2, 3, 4, 5, 6, 7]

# 其他操作
print(len(numbers))       # 6 长度
print(max(numbers))       # 7 最大值
print(min(numbers))       # 2 最小值
print(sum(numbers))       # 27 求和

numbers.sort()            # 排序（修改原列表）
print(numbers)            # [2, 3, 4, 5, 6, 7]

numbers.reverse()         # 反转
print(numbers)            # [7, 6, 5, 4, 3, 2]

# 列表推导式（重要！）
squares = [x**2 for x in range(10)]
print(squares)            # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

even_squares = [x**2 for x in range(10) if x % 2 == 0]
print(even_squares)       # [0, 4, 16, 36, 64]
```

### 2.2 字典 (Dictionary)

字典存储**键值对**。

```python
# 创建字典
person = {
    "name": "张三",
    "age": 25,
    "city": "北京"
}

# 访问值
print(person["name"])     # '张三'
print(person.get("age"))  # 25
print(person.get("job", "未知"))  # '未知' (如果key不存在，返回默认值)

# 修改值
person["age"] = 26
print(person["age"])      # 26

# 添加键值对
person["job"] = "工程师"
print(person)

# 删除键值对
del person["city"]
print(person)

# 遍历字典
for key in person:
    print(f"{key}: {person[key]}")

# 更好的方式
for key, value in person.items():
    print(f"{key}: {value}")

# 只遍历键
for key in person.keys():
    print(key)

# 只遍历值
for value in person.values():
    print(value)

# 字典推导式
squared_dict = {x: x**2 for x in range(5)}
print(squared_dict)       # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

# 常用方法
print(person.keys())      # dict_keys(['name', 'age', 'job'])
print(person.values())    # dict_values(['张三', 26, '工程师'])
print(len(person))        # 3
```

### 2.3 元组 (Tuple)

元组是**不可变的**有序集合。

```python
# 创建元组
coordinates = (10, 20)
single = (1,)             # 单元素元组需要逗号
rgb = (255, 128, 0)

# 访问元素（和列表一样）
print(coordinates[0])     # 10
print(coordinates[-1])    # 20

# 不能修改！
# coordinates[0] = 5      # 会报错 TypeError

# 解包
x, y = coordinates
print(x, y)               # 10 20

r, g, b = rgb
print(f"RGB: {r}, {g}, {b}")

# 交换变量（利用元组解包）
a, b = 1, 2
a, b = b, a               # 交换
print(a, b)               # 2 1

# 函数返回多个值（实际返回元组）
def get_user():
    return "张三", 25, "北京"

name, age, city = get_user()
print(name, age, city)
```

### 2.4 集合 (Set)

集合是**无序的**、**不重复的**元素集合。

```python
# 创建集合
fruits = {"苹果", "香蕉", "橙子"}
numbers = {1, 2, 3, 3, 3}  # 重复元素会被去除
print(numbers)            # {1, 2, 3}

# 添加元素
fruits.add("葡萄")
print(fruits)

# 删除元素
fruits.remove("香蕉")     # 如果不存在会报错
fruits.discard("西瓜")    # 如果不存在不报错

# 集合操作
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)              # {1, 2, 3, 4, 5, 6} 并集
print(a & b)              # {3, 4} 交集
print(a - b)              # {1, 2} 差集
print(a ^ b)              # {1, 2, 5, 6} 对称差集

# 去重
numbers = [1, 2, 2, 3, 3, 3, 4]
unique = list(set(numbers))
print(unique)             # [1, 2, 3, 4]
```

---

## 3. 函数和类

### 3.1 函数

```python
# 定义函数
def greet(name):
    """打招呼的函数"""  # 文档字符串
    return f"你好, {name}!"

# 调用函数
message = greet("张三")
print(message)            # '你好, 张三!'

# 默认参数
def power(x, n=2):
    """计算x的n次方，默认是平方"""
    return x ** n

print(power(3))           # 9 (使用默认n=2)
print(power(3, 3))        # 27

# 可变参数
def add(*args):
    """可以接受任意数量的参数"""
    return sum(args)

print(add(1, 2))          # 3
print(add(1, 2, 3, 4, 5)) # 15

# 关键字参数
def create_user(**kwargs):
    """接受任意关键字参数"""
    return kwargs

user = create_user(name="李四", age=30, city="上海")
print(user)               # {'name': '李四', 'age': 30, 'city': '上海'}

# Lambda函数（匿名函数）
square = lambda x: x ** 2
print(square(5))          # 25

# 常用于排序
students = [
    {"name": "张三", "score": 85},
    {"name": "李四", "score": 92},
    {"name": "王五", "score": 78}
]
students.sort(key=lambda s: s["score"], reverse=True)
for s in students:
    print(f"{s['name']}: {s['score']}")
```

### 3.2 类和对象

```python
# 定义类
class Dog:
    """狗类"""
    
    # 类变量（所有实例共享）
    species = "犬科"
    
    # 初始化方法
    def __init__(self, name, age):
        # 实例变量（每个实例独有）
        self.name = name
        self.age = age
    
    # 实例方法
    def bark(self):
        return f"{self.name}说：汪汪！"
    
    def get_info(self):
        return f"{self.name}，{self.age}岁，{self.species}"
    
    # 类方法
    @classmethod
    def from_birth_year(cls, name, birth_year):
        age = 2024 - birth_year
        return cls(name, age)
    
    # 静态方法
    @staticmethod
    def is_adult(age):
        return age >= 2

# 创建对象
dog1 = Dog("旺财", 3)
dog2 = Dog("小黑", 1)

# 调用方法
print(dog1.bark())        # '旺财说：汪汪！'
print(dog2.get_info())    # '小黑，1岁，犬科'

# 使用类方法创建对象
dog3 = Dog.from_birth_year("大黄", 2022)
print(dog3.age)           # 2

# 使用静态方法
print(Dog.is_adult(3))    # True

# 继承
class GuideDog(Dog):
    """导盲犬类，继承自Dog"""
    
    def __init__(self, name, age, training_hours):
        super().__init__(name, age)  # 调用父类初始化
        self.training_hours = training_hours
    
    def guide(self):
        return f"{self.name}正在导盲"
    
    # 重写父类方法
    def bark(self):
        return f"{self.name}轻声说：汪"

guide_dog = GuideDog("导导", 4, 500)
print(guide_dog.bark())   # '导导轻声说：汪'
print(guide_dog.guide())  # '导导正在导盲'
print(guide_dog.get_info())  # 继承的方法
```

---

## 4. NumPy数组操作

NumPy是**科学计算**的基础库，AI中大量使用。

```python
import numpy as np

# === 创建数组 ===
# 从列表创建
arr1 = np.array([1, 2, 3, 4, 5])
print(arr1)               # [1 2 3 4 5]
print(type(arr1))         # <class 'numpy.ndarray'>

# 创建2D数组
arr2 = np.array([[1, 2, 3],
                 [4, 5, 6]])
print(arr2)
# [[1 2 3]
#  [4 5 6]]

# 特殊数组
zeros = np.zeros((3, 4))  # 3x4的全0数组
ones = np.ones((2, 3))    # 2x3的全1数组
full = np.full((2, 2), 7) # 2x2的全7数组
eye = np.eye(3)           # 3x3单位矩阵

# 范围数组
range_arr = np.arange(0, 10, 2)  # [0 2 4 6 8]
linspace = np.linspace(0, 1, 5)  # [0.   0.25 0.5  0.75 1.  ]

# 随机数组
random_arr = np.random.rand(3, 3)      # [0, 1)的均匀分布
normal_arr = np.random.randn(3, 3)     # 标准正态分布
randint_arr = np.random.randint(0, 10, (3, 3))  # [0, 10)的整数

# === 数组属性 ===
arr = np.array([[1, 2, 3, 4],
                [5, 6, 7, 8],
                [9, 10, 11, 12]])

print(arr.shape)          # (3, 4) 形状
print(arr.ndim)           # 2 维度
print(arr.size)           # 12 元素总数
print(arr.dtype)          # dtype('int64') 数据类型

# === 索引和切片 ===
print(arr[0])             # [1 2 3 4] 第一行
print(arr[:, 0])          # [1 5 9] 第一列
print(arr[0, 2])          # 3 第一行第三列
print(arr[0:2, 1:3])      # [[2 3]
                          #  [6 7]]

# 布尔索引
print(arr[arr > 5])       # [ 6  7  8  9 10 11 12]

# === 数组运算 ===
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

# 逐元素运算
print(a + b)              # [5 7 9]
print(a * b)              # [4 10 18]
print(a ** 2)             # [1 4 9]

# 标量运算
print(a + 10)             # [11 12 13]
print(a * 2)              # [2 4 6]

# 矩阵运算
A = np.array([[1, 2],
              [3, 4]])
B = np.array([[5, 6],
              [7, 8]])

print(A.dot(B))           # 矩阵乘法
# [[19 22]
#  [43 50]]

print(A @ B)              # 矩阵乘法的另一种写法（Python 3.5+）

# === 聚合函数 ===
arr = np.array([[1, 2, 3],
                [4, 5, 6]])

print(arr.sum())          # 21 所有元素求和
print(arr.sum(axis=0))    # [5 7 9] 按列求和
print(arr.sum(axis=1))    # [6 15] 按行求和

print(arr.mean())         # 3.5 平均值
print(arr.max())          # 6 最大值
print(arr.min())          # 1 最小值
print(arr.std())          # 标准差

# === 形状操作 ===
arr = np.arange(12)       # [0 1 2 3 4 5 6 7 8 9 10 11]

reshaped = arr.reshape(3, 4)
print(reshaped)
# [[ 0  1  2  3]
#  [ 4  5  6  7]
#  [ 8  9 10 11]]

flattened = reshaped.flatten()
print(flattened)          # [0 1 2 3 4 5 6 7 8 9 10 11]

transposed = reshaped.T   # 转置
print(transposed)
# [[ 0  4  8]
#  [ 1  5  9]
#  [ 2  6 10]
#  [ 3  7 11]]

# === 拼接和分割 ===
a = np.array([[1, 2],
              [3, 4]])
b = np.array([[5, 6],
              [7, 8]])

# 垂直拼接
v = np.vstack([a, b])
print(v)
# [[1 2]
#  [3 4]
#  [5 6]
#  [7 8]]

# 水平拼接
h = np.hstack([a, b])
print(h)
# [[1 2 5 6]
#  [3 4 7 8]]

# === 实用技巧 ===
# 1. 向量化操作（比Python循环快很多）
arr = np.arange(1000000)

# 慢（Python循环）
# result = []
# for x in arr:
#     result.append(x ** 2)

# 快（NumPy向量化）
result = arr ** 2

# 2. 广播机制
a = np.array([[1, 2, 3]])  # shape (1, 3)
b = np.array([[10],
              [20],
              [30]])       # shape (3, 1)

print(a + b)  # 广播后变成 (3, 3)
# [[11 12 13]
#  [21 22 23]
#  [31 32 33]]
```

**NumPy在AI中的应用**：
```python
# 图像处理
image = np.random.randint(0, 256, (224, 224, 3))  # 224x224的RGB图片
print(image.shape)        # (224, 224, 3)

# 归一化到[0, 1]
normalized = image / 255.0

# 批量数据
batch = np.random.randn(32, 3, 224, 224)  # 32张图片，3通道，224x224
print(batch.shape)        # (32, 3, 224, 224)

# 计算均值和标准差
mean = batch.mean(axis=(0, 2, 3))  # 按通道计算
std = batch.std(axis=(0, 2, 3))
print(mean.shape)         # (3,)
```

---

## 5. 文件操作

```python
# === 读取文本文件 ===
# 方法1：手动关闭
file = open("data.txt", "r", encoding="utf-8")
content = file.read()
file.close()

# 方法2：with语句（推荐，自动关闭）
with open("data.txt", "r", encoding="utf-8") as f:
    content = f.read()
    print(content)

# 按行读取
with open("data.txt", "r") as f:
    for line in f:
        print(line.strip())  # strip()去除换行符

# 读取所有行到列表
with open("data.txt", "r") as f:
    lines = f.readlines()

# === 写入文件 ===
# 写入（覆盖）
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("第一行\n")
    f.write("第二行\n")

# 追加
with open("output.txt", "a", encoding="utf-8") as f:
    f.write("追加的内容\n")

# 写入列表
lines = ["行1\n", "行2\n", "行3\n"]
with open("output.txt", "w") as f:
    f.writelines(lines)

# === JSON文件 ===
import json

# 保存JSON
data = {
    "name": "张三",
    "age": 25,
    "scores": [85, 90, 88]
}

with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# 读取JSON
with open("data.json", "r", encoding="utf-8") as f:
    loaded_data = json.load(f)
    print(loaded_data)

# === CSV文件 ===
import csv

# 写入CSV
data = [
    ["姓名", "年龄", "城市"],
    ["张三", 25, "北京"],
    ["李四", 30, "上海"]
]

with open("data.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerows(data)

# 读取CSV
with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)

# 使用字典读写CSV
data = [
    {"name": "张三", "age": 25, "city": "北京"},
    {"name": "李四", "age": 30, "city": "上海"}
]

with open("data.csv", "w", newline="", encoding="utf-8") as f:
    fieldnames = ["name", "age", "city"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(data)

# === 路径操作 ===
import os
from pathlib import Path

# 检查文件是否存在
if os.path.exists("data.txt"):
    print("文件存在")

# 创建目录
os.makedirs("data/train/images", exist_ok=True)

# 列出目录内容
files = os.listdir(".")
for file in files:
    print(file)

# 使用pathlib（更现代）
path = Path("data/train/images")
path.mkdir(parents=True, exist_ok=True)

# 遍历目录
for file in path.glob("*.jpg"):
    print(file)
```

---

## 6. 常用库简介

### 6.1 PyTorch基础

```python
import torch

# === 创建张量 ===
# 从列表创建
t1 = torch.tensor([1, 2, 3])
t2 = torch.tensor([[1, 2], [3, 4]])

# 特殊张量
zeros = torch.zeros(3, 4)
ones = torch.ones(2, 3)
rand = torch.rand(3, 3)    # [0, 1)均匀分布
randn = torch.randn(3, 3)  # 标准正态分布

# === 张量运算 ===
a = torch.tensor([1.0, 2.0, 3.0])
b = torch.tensor([4.0, 5.0, 6.0])

print(a + b)               # tensor([5., 7., 9.])
print(a * b)               # tensor([ 4., 10., 18.])
print(torch.dot(a, b))     # tensor(32.) 点积

# === GPU加速 ===
if torch.cuda.is_available():
    device = torch.device("cuda")
    t_gpu = torch.tensor([1, 2, 3]).to(device)
    print(t_gpu.device)    # cuda:0
else:
    device = torch.device("cpu")

# === 自动求导 ===
x = torch.tensor(2.0, requires_grad=True)
y = x ** 2 + 3 * x + 1

y.backward()  # 计算梯度
print(x.grad)              # tensor(7.) dy/dx = 2*2 + 3 = 7
```

### 6.2 Pandas数据处理

```python
import pandas as pd

# === 创建DataFrame ===
data = {
    '姓名': ['张三', '李四', '王五'],
    '年龄': [25, 30, 35],
    '城市': ['北京', '上海', '深圳']
}
df = pd.DataFrame(data)
print(df)

# === 读取数据 ===
df = pd.read_csv('data.csv')
df = pd.read_excel('data.xlsx')
df = pd.read_json('data.json')

# === 查看数据 ===
print(df.head())           # 前5行
print(df.tail())           # 后5行
print(df.info())           # 数据信息
print(df.describe())       # 统计描述

# === 选择数据 ===
print(df['姓名'])          # 选择列
print(df[['姓名', '年龄']]) # 选择多列
print(df.iloc[0])          # 第一行
print(df.loc[0, '姓名'])   # 特定位置

# === 过滤数据 ===
adults = df[df['年龄'] >= 30]
print(adults)

# === 添加列 ===
df['工资'] = [10000, 15000, 20000]

# === 保存数据 ===
df.to_csv('output.csv', index=False)
df.to_excel('output.xlsx', index=False)
```

### 6.3 Matplotlib可视化

```python
import matplotlib.pyplot as plt
import numpy as np

# === 折线图 ===
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, label='sin(x)')
plt.xlabel('x')
plt.ylabel('y')
plt.title('正弦曲线')
plt.legend()
plt.grid(True)
plt.show()

# === 散点图 ===
x = np.random.randn(100)
y = np.random.randn(100)

plt.scatter(x, y, alpha=0.5)
plt.xlabel('x')
plt.ylabel('y')
plt.title('散点图')
plt.show()

# === 柱状图 ===
categories = ['A', 'B', 'C', 'D']
values = [23, 45, 56, 78]

plt.bar(categories, values)
plt.xlabel('类别')
plt.ylabel('值')
plt.title('柱状图')
plt.show()

# === 子图 ===
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

axes[0, 0].plot(x, y)
axes[0, 0].set_title('图1')

axes[0, 1].scatter(x, y)
axes[0, 1].set_title('图2')

plt.tight_layout()
plt.show()
```

---

## 7. 常见错误和调试

### 7.1 常见错误

```python
# 1. IndentationError: 缩进错误
# ❌ 错误
def hello():
print("Hello")  # 缩进不对

# ✅ 正确
def hello():
    print("Hello")

# 2. NameError: 使用未定义的变量
# ❌ 错误
print(x)  # x未定义

# ✅ 正确
x = 10
print(x)

# 3. TypeError: 类型错误
# ❌ 错误
x = "5" + 3  # 字符串和整数不能直接相加

# ✅ 正确
x = int("5") + 3

# 4. IndexError: 索引越界
# ❌ 错误
arr = [1, 2, 3]
print(arr[10])  # 索引超出范围

# ✅ 正确
if len(arr) > 10:
    print(arr[10])

# 5. KeyError: 字典键不存在
# ❌ 错误
d = {"name": "张三"}
print(d["age"])  # age键不存在

# ✅ 正确
print(d.get("age", "未知"))
```

### 7.2 调试技巧

```python
# 1. print调试
def calculate(a, b):
    print(f"输入: a={a}, b={b}")  # 打印输入
    result = a + b
    print(f"结果: {result}")      # 打印结果
    return result

# 2. 使用assert检查
def divide(a, b):
    assert b != 0, "除数不能为0"
    return a / b

# 3. try-except异常处理
try:
    result = 10 / 0
except ZeroDivisionError:
    print("除数不能为0")
except Exception as e:
    print(f"发生错误: {e}")
finally:
    print("无论如何都会执行")

# 4. 使用pdb调试器
import pdb

def complex_function(x):
    pdb.set_trace()  # 设置断点
    y = x * 2
    z = y + 10
    return z

# 运行到这里会进入调试模式
# 常用命令:
# n - 下一行
# s - 进入函数
# c - 继续执行
# p variable - 打印变量
# q - 退出
```

---

## 8. 练习题

### 练习1：处理数据
```python
# 任务：给定一个学生成绩列表，计算平均分，找出最高分和最低分
scores = [85, 92, 78, 90, 88, 95, 73]

# 你的代码：
average = sum(scores) / len(scores)
max_score = max(scores)
min_score = min(scores)

print(f"平均分: {average:.2f}")
print(f"最高分: {max_score}")
print(f"最低分: {min_score}")
```

### 练习2：文本处理
```python
# 任务：统计一段文本中每个单词出现的次数
text = "python is great python is powerful python is fun"

# 你的代码：
words = text.split()
word_count = {}

for word in words:
    word_count[word] = word_count.get(word, 0) + 1

print(word_count)
# 或使用Counter
from collections import Counter
word_count = Counter(words)
print(word_count)
```

### 练习3：NumPy矩阵
```python
# 任务：创建一个5x5的矩阵，对角线为1，其余为0
import numpy as np

# 你的代码：
matrix = np.eye(5)
print(matrix)
```

---

## 9. 学习资源

1. **官方文档**
   - Python: https://docs.python.org/zh-cn/3/
   - NumPy: https://numpy.org/doc/
   - Pandas: https://pandas.pydata.org/docs/
   - PyTorch: https://pytorch.org/docs/

2. **在线教程**
   - Python入门: https://www.liaoxuefeng.com/wiki/1016959663602400
   - NumPy教程: https://numpy.org/doc/stable/user/quickstart.html

3. **练习平台**
   - LeetCode: https://leetcode.cn/
   - HackerRank: https://www.hackerrank.com/

**建议学习路径**：
1. 先掌握Python基础语法（本文档）
2. 熟练NumPy数组操作
3. 学习PyTorch基础
4. 阅读其他进阶文档

记住：**编程是一门实践的艺术，多写代码比看十本书都有用！**
