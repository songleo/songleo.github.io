# 深度学习基础 - 理解AI训练的核心概念

## 目录
1. 什么是深度学习
2. 神经网络基础
3. 训练过程详解
4. 常见的模型架构
5. 训练中的关键概念
6. 实践：从零训练一个模型

---

## 1. 什么是深度学习

### 1.1 从例子开始理解

**传统编程 vs 深度学习**

**传统编程（规则驱动）**：
```python
# 例子：判断是否是垃圾邮件
def is_spam(email):
    if "中奖" in email or "点击领取" in email:
        return True
    if email.count("!") > 5:
        return True
    return False
```
问题：规则太死板，很难覆盖所有情况

**深度学习（数据驱动）**：
```python
# 1. 收集大量数据
emails = [
    ("恭喜你中奖了，点击领取", "spam"),
    ("明天开会通知", "not_spam"),
    ("您的快递到了", "not_spam"),
    # ... 10000条数据
]

# 2. 训练模型（让计算机自己学习规律）
model = train_neural_network(emails)

# 3. 预测
result = model.predict("恭喜你获得iPhone一部")  # spam
```

### 1.2 深度学习能做什么？

1. **图像识别**：看图片识别猫、狗、人脸
2. **自然语言处理**：翻译、对话、文本生成（ChatGPT）
3. **语音识别**：语音转文字
4. **推荐系统**：推荐商品、视频
5. **自动驾驶**：识别道路、行人、车辆

---

## 2. 神经网络基础

### 2.1 神经元 - 最小的计算单元

**类比：神经元就像一个简单的决策者**

```
输入1(x1) ──┐
            │  ╔═══════════╗
输入2(x2) ──┼─→║  神经元   ║──→ 输出(y)
            │  ╚═══════════╝
输入3(x3) ──┘
```

**数学表示**：
```
输出 = 激活函数(权重1*输入1 + 权重2*输入2 + 权重3*输入3 + 偏置)
y = f(w1*x1 + w2*x2 + w3*x3 + b)
```

**Python代码**：
```python
import numpy as np

def neuron(inputs, weights, bias):
    """一个简单的神经元"""
    # 加权求和
    z = np.dot(inputs, weights) + bias
    
    # 激活函数（这里用ReLU）
    output = max(0, z)  # ReLU: 小于0输出0，否则输出原值
    
    return output

# 例子
inputs = np.array([1.0, 2.0, 3.0])
weights = np.array([0.5, 0.3, -0.2])
bias = 0.1

result = neuron(inputs, weights, bias)
# 计算：0.5*1 + 0.3*2 + (-0.2)*3 + 0.1 = 0.5 + 0.6 - 0.6 + 0.1 = 0.6
print(f"输出: {result}")  # 0.6
```

### 2.2 神经网络 - 很多神经元连在一起

**一个简单的3层网络**：

```
输入层     隐藏层        输出层
  x1  ──→  h1  ──┐
           ╱ ╲   │
  x2  ──→  h2  ──┼──→  y1
           ╲ ╱   │
  x3  ──→  h3  ──┘
```

**代码实现**：
```python
import torch
import torch.nn as nn

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        # 第一层：3个输入 -> 5个神经元
        self.layer1 = nn.Linear(3, 5)
        # 第二层：5个输入 -> 2个输出
        self.layer2 = nn.Linear(5, 2)
        # 激活函数
        self.relu = nn.ReLU()
    
    def forward(self, x):
        # 前向传播
        x = self.layer1(x)      # 第一层
        x = self.relu(x)        # 激活
        x = self.layer2(x)      # 第二层
        return x

# 创建模型
model = SimpleNet()

# 输入数据（batch_size=2, 3个特征）
inputs = torch.tensor([[1.0, 2.0, 3.0],
                       [4.0, 5.0, 6.0]])

# 前向传播
outputs = model(inputs)
print(f"输出形状: {outputs.shape}")  # [2, 2]
print(f"输出:\n{outputs}")
```

### 2.3 激活函数 - 引入非线性

为什么需要激活函数？
- 没有激活函数，多层网络就等于一层（线性叠加还是线性）
- 激活函数引入非线性，让网络能学习复杂的模式

**常见激活函数**：

```python
import torch
import matplotlib.pyplot as plt

x = torch.linspace(-5, 5, 100)

# 1. ReLU (Rectified Linear Unit) - 最常用
relu = torch.relu(x)
# f(x) = max(0, x)
# 小于0输出0，大于0输出原值

# 2. Sigmoid - 早期常用，现在较少
sigmoid = torch.sigmoid(x)
# f(x) = 1 / (1 + e^(-x))
# 输出在0到1之间

# 3. Tanh - 输出在-1到1之间
tanh = torch.tanh(x)
# f(x) = (e^x - e^(-x)) / (e^x + e^(-x))

# 4. GELU - Transformer中常用
gelu = torch.nn.functional.gelu(x)

# 可视化
plt.plot(x, relu, label='ReLU')
plt.plot(x, sigmoid, label='Sigmoid')
plt.plot(x, tanh, label='Tanh')
plt.plot(x, gelu, label='GELU')
plt.legend()
plt.grid(True)
plt.title('常见激活函数')
plt.show()
```

---

## 3. 训练过程详解

### 3.1 训练的核心思想

**目标**：调整网络的权重，让预测结果越来越准确

**训练流程**：
```
1. 前向传播 (Forward Pass)
   输入 → 网络 → 输出预测

2. 计算损失 (Loss)
   比较预测和真实答案的差距

3. 反向传播 (Backward Pass)
   计算每个权重对损失的影响（梯度）

4. 更新权重 (Update)
   根据梯度调整权重

5. 重复1-4，直到模型足够准确
```

### 3.2 完整的训练示例

**任务**：根据房屋面积预测价格

```python
import torch
import torch.nn as nn
import torch.optim as optim
import matplotlib.pyplot as plt

# === 1. 准备数据 ===
# 房屋面积 (平方米)
areas = torch.tensor([[50.], [60.], [70.], [80.], [90.], [100.], [110.], [120.]])
# 价格 (万元)
prices = torch.tensor([[150.], [180.], [210.], [240.], [270.], [300.], [330.], [360.]])

# === 2. 定义模型 ===
class PriceModel(nn.Module):
    def __init__(self):
        super().__init__()
        # 简单的线性模型：price = w * area + b
        self.linear = nn.Linear(1, 1)
    
    def forward(self, x):
        return self.linear(x)

model = PriceModel()

# === 3. 定义损失函数和优化器 ===
criterion = nn.MSELoss()  # 均方误差损失
optimizer = optim.SGD(model.parameters(), lr=0.0001)  # 随机梯度下降

# === 4. 训练 ===
losses = []
epochs = 1000

print("开始训练...")
for epoch in range(epochs):
    # 前向传播
    predictions = model(areas)
    
    # 计算损失
    loss = criterion(predictions, prices)
    losses.append(loss.item())
    
    # 反向传播
    optimizer.zero_grad()  # 清空之前的梯度
    loss.backward()        # 计算梯度
    optimizer.step()       # 更新权重
    
    # 每100轮打印一次
    if (epoch + 1) % 100 == 0:
        print(f'Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}')

# === 5. 测试 ===
test_area = torch.tensor([[75.]])
predicted_price = model(test_area)
print(f'\n75平方米的房子预测价格: {predicted_price.item():.2f}万元')

# 查看学到的参数
weight = model.linear.weight.item()
bias = model.linear.bias.item()
print(f'学到的参数: 价格 = {weight:.2f} * 面积 + {bias:.2f}')

# === 6. 可视化 ===
plt.figure(figsize=(12, 4))

# 损失曲线
plt.subplot(1, 2, 1)
plt.plot(losses)
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.title('训练损失曲线')
plt.grid(True)

# 拟合结果
plt.subplot(1, 2, 2)
plt.scatter(areas.numpy(), prices.numpy(), label='真实数据')
pred_line = model(areas).detach().numpy()
plt.plot(areas.numpy(), pred_line, 'r-', label='模型预测')
plt.xlabel('面积(平方米)')
plt.ylabel('价格(万元)')
plt.legend()
plt.title('模型拟合结果')
plt.grid(True)

plt.tight_layout()
plt.show()
```

### 3.3 关键概念解释

**1. Epoch（轮次）**
- 一个epoch = 模型看过所有训练数据一遍
- 通常需要训练很多个epoch（比如100、1000）

**2. Batch（批次）**
- 一次处理一批数据，而不是一条条处理
- Batch Size = 每批的数据量

```python
# 例子：总共1000条数据，batch_size=32
# 一个epoch需要：1000 / 32 ≈ 32个batch

from torch.utils.data import DataLoader, TensorDataset

dataset = TensorDataset(areas, prices)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

for epoch in range(100):
    for batch_areas, batch_prices in dataloader:
        # 每次循环处理32条数据
        predictions = model(batch_areas)
        loss = criterion(predictions, batch_prices)
        # ... 反向传播和更新
```

**3. Learning Rate（学习率）**
- 控制权重更新的步长
- 太大：可能错过最优解
- 太小：训练太慢

```python
# 不同学习率的效果
optimizer_small = optim.SGD(model.parameters(), lr=0.00001)  # 太小，训练慢
optimizer_good = optim.SGD(model.parameters(), lr=0.001)     # 刚好
optimizer_large = optim.SGD(model.parameters(), lr=0.1)      # 太大，不收敛
```

**4. Loss（损失）**
- 衡量预测和真实值的差距
- 训练目标：最小化损失

```python
# 常见损失函数

# 1. MSE - 均方误差（回归问题）
mse_loss = nn.MSELoss()
loss = mse_loss(predictions, targets)
# loss = mean((predictions - targets)^2)

# 2. CrossEntropy - 交叉熵（分类问题）
ce_loss = nn.CrossEntropyLoss()
loss = ce_loss(logits, labels)

# 3. Binary CrossEntropy - 二分类
bce_loss = nn.BCEWithLogitsLoss()
loss = bce_loss(predictions, targets)
```

---

## 4. 常见的模型架构

### 4.1 全连接网络 (Fully Connected Network / MLP)

**适用**：结构化数据（表格数据）

```python
class MLP(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super().__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.fc3 = nn.Linear(hidden_size, output_size)
        self.relu = nn.ReLU()
    
    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        x = self.fc3(x)
        return x

# 例子：输入10个特征，预测3个类别
model = MLP(input_size=10, hidden_size=64, output_size=3)
```

### 4.2 卷积神经网络 (CNN)

**适用**：图像数据

**核心思想**：卷积层提取局部特征

```python
class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        # 卷积层
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)  # 3通道 -> 32通道
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1) # 32 -> 64
        self.pool = nn.MaxPool2d(2, 2)  # 2x2池化，尺寸减半
        
        # 全连接层
        self.fc1 = nn.Linear(64 * 8 * 8, 512)  # 假设输入是32x32
        self.fc2 = nn.Linear(512, num_classes)
        
        self.relu = nn.ReLU()
    
    def forward(self, x):
        # x shape: [batch, 3, 32, 32]
        x = self.pool(self.relu(self.conv1(x)))  # [batch, 32, 16, 16]
        x = self.pool(self.relu(self.conv2(x)))  # [batch, 64, 8, 8]
        
        x = x.view(x.size(0), -1)  # 展平: [batch, 64*8*8]
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# 使用
model = SimpleCNN(num_classes=10)
dummy_image = torch.randn(4, 3, 32, 32)  # 4张32x32的RGB图片
output = model(dummy_image)
print(output.shape)  # [4, 10]
```

**CNN如何处理图像**：

```
原始图片 (3x32x32)
    ↓ Conv2d(3, 32) + ReLU
特征图 (32x32x32)
    ↓ MaxPool(2x2)
特征图 (32x16x16)
    ↓ Conv2d(32, 64) + ReLU
特征图 (64x16x16)
    ↓ MaxPool(2x2)
特征图 (64x8x8)
    ↓ Flatten
向量 (4096)
    ↓ Linear(4096, 512)
向量 (512)
    ↓ Linear(512, 10)
输出 (10) - 10个类别的概率
```

### 4.3 循环神经网络 (RNN / LSTM)

**适用**：序列数据（文本、时间序列）

```python
class SimpleLSTM(nn.Module):
    def __init__(self, vocab_size, embed_size, hidden_size, num_classes):
        super().__init__()
        # 词嵌入层
        self.embedding = nn.Embedding(vocab_size, embed_size)
        # LSTM层
        self.lstm = nn.LSTM(embed_size, hidden_size, batch_first=True)
        # 输出层
        self.fc = nn.Linear(hidden_size, num_classes)
    
    def forward(self, x):
        # x: [batch, seq_len] - 词的索引
        x = self.embedding(x)  # [batch, seq_len, embed_size]
        
        # LSTM处理序列
        lstm_out, (h_n, c_n) = self.lstm(x)
        # lstm_out: [batch, seq_len, hidden_size]
        # h_n: [1, batch, hidden_size] - 最后一个时间步的隐藏状态
        
        # 使用最后一个时间步的输出
        out = self.fc(h_n.squeeze(0))
        return out

# 例子：情感分类
model = SimpleLSTM(vocab_size=10000, embed_size=128, hidden_size=256, num_classes=2)
sentences = torch.randint(0, 10000, (32, 50))  # 32个句子，每个50个词
output = model(sentences)
print(output.shape)  # [32, 2] - 32个句子的分类结果
```

### 4.4 Transformer

**适用**：现代NLP任务（GPT、BERT都基于这个）

**核心**：自注意力机制（Self-Attention）

```python
class SimpleTransformer(nn.Module):
    def __init__(self, vocab_size, d_model, nhead, num_layers, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, d_model)
        
        # Transformer Encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,      # 嵌入维度
            nhead=nhead,          # 注意力头数
            dim_feedforward=d_model * 4
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        self.fc = nn.Linear(d_model, num_classes)
    
    def forward(self, x):
        # x: [batch, seq_len]
        x = self.embedding(x)  # [batch, seq_len, d_model]
        
        # Transformer需要 [seq_len, batch, d_model]
        x = x.permute(1, 0, 2)
        
        x = self.transformer(x)  # [seq_len, batch, d_model]
        
        # 使用第一个位置的输出（类似BERT的[CLS]）
        x = x[0, :, :]  # [batch, d_model]
        
        x = self.fc(x)
        return x

# 使用
model = SimpleTransformer(
    vocab_size=10000,
    d_model=512,
    nhead=8,
    num_layers=6,
    num_classes=2
)
```

---

## 5. 训练中的关键技巧

### 5.1 数据预处理

**归一化（Normalization）**：
```python
# 为什么需要归一化？
# 如果特征1的范围是[0, 1]，特征2的范围是[0, 1000]
# 梯度会被特征2主导，训练不稳定

# 方法1：Min-Max归一化 -> [0, 1]
def normalize_minmax(x):
    return (x - x.min()) / (x.max() - x.min())

# 方法2：标准化 -> 均值0，标准差1
def normalize_standard(x):
    return (x - x.mean()) / x.std()

# 图像常用：归一化到[-1, 1]
from torchvision import transforms

transform = transforms.Compose([
    transforms.ToTensor(),  # 转为tensor，范围[0, 1]
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])  # -> [-1, 1]
])
```

**数据增强（Data Augmentation）**：
```python
# 增加数据多样性，防止过拟合

transform = transforms.Compose([
    transforms.RandomHorizontalFlip(),  # 随机水平翻转
    transforms.RandomRotation(10),      # 随机旋转±10度
    transforms.ColorJitter(brightness=0.2, contrast=0.2),  # 颜色抖动
    transforms.RandomCrop(32, padding=4),  # 随机裁剪
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])
```

### 5.2 防止过拟合

**Dropout**：训练时随机丢弃一些神经元
```python
class ModelWithDropout(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 512)
        self.dropout1 = nn.Dropout(0.5)  # 50%的概率丢弃
        self.fc2 = nn.Linear(512, 256)
        self.dropout2 = nn.Dropout(0.3)  # 30%的概率丢弃
        self.fc3 = nn.Linear(256, 10)
    
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.dropout1(x)  # 训练时生效，推理时自动关闭
        x = torch.relu(self.fc2(x))
        x = self.dropout2(x)
        x = self.fc3(x)
        return x
```

**L2正则化（Weight Decay）**：
```python
# 惩罚过大的权重
optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=0.0001)
```

**Early Stopping**：验证集loss不再下降时停止
```python
best_val_loss = float('inf')
patience = 10
patience_counter = 0

for epoch in range(1000):
    train_loss = train_one_epoch()
    val_loss = validate()
    
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        save_checkpoint(model)
        patience_counter = 0
    else:
        patience_counter += 1
    
    if patience_counter >= patience:
        print("Early stopping!")
        break
```

### 5.3 学习率调度

```python
from torch.optim.lr_scheduler import StepLR, CosineAnnealingLR, ReduceLROnPlateau

# 方法1：每N个epoch降低学习率
scheduler = StepLR(optimizer, step_size=30, gamma=0.1)  # 每30轮学习率x0.1

# 方法2：余弦退火
scheduler = CosineAnnealingLR(optimizer, T_max=100)  # 100轮内平滑降低

# 方法3：根据验证集loss自动调整
scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5)

# 使用
for epoch in range(100):
    train()
    val_loss = validate()
    scheduler.step(val_loss)  # ReduceLROnPlateau需要传入metric
    # 或者
    scheduler.step()  # StepLR和CosineAnnealingLR不需要参数
```

---

## 6. 实践：训练一个图像分类模型

**任务**：在CIFAR-10数据集上训练分类器（10个类别：飞机、汽车、鸟等）

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import matplotlib.pyplot as plt

# === 1. 数据准备 ===
transform_train = transforms.Compose([
    transforms.RandomHorizontalFlip(),
    transforms.RandomCrop(32, padding=4),
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])

transform_test = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])

train_dataset = datasets.CIFAR10(root='./data', train=True, download=True, transform=transform_train)
test_dataset = datasets.CIFAR10(root='./data', train=False, download=True, transform=transform_test)

train_loader = DataLoader(train_dataset, batch_size=128, shuffle=True, num_workers=2)
test_loader = DataLoader(test_dataset, batch_size=128, shuffle=False, num_workers=2)

classes = ('飞机', '汽车', '鸟', '猫', '鹿', '狗', '青蛙', '马', '船', '卡车')

# === 2. 定义模型 ===
class CIFAR10Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 64, 3, padding=1)
        self.conv2 = nn.Conv2d(64, 128, 3, padding=1)
        self.conv3 = nn.Conv2d(128, 256, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(256 * 4 * 4, 512)
        self.fc2 = nn.Linear(512, 10)
        self.dropout = nn.Dropout(0.5)
    
    def forward(self, x):
        x = self.pool(torch.relu(self.conv1(x)))  # 32x32 -> 16x16
        x = self.pool(torch.relu(self.conv2(x)))  # 16x16 -> 8x8
        x = self.pool(torch.relu(self.conv3(x)))  # 8x8 -> 4x4
        x = x.view(-1, 256 * 4 * 4)
        x = self.dropout(torch.relu(self.fc1(x)))
        x = self.fc2(x)
        return x

# === 3. 训练设置 ===
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"使用设备: {device}")

model = CIFAR10Net().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.5)

# === 4. 训练函数 ===
def train_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
    
    return running_loss / len(loader), 100. * correct / total

# === 5. 验证函数 ===
def validate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
    
    return running_loss / len(loader), 100. * correct / total

# === 6. 训练循环 ===
num_epochs = 30
train_losses, train_accs = [], []
test_losses, test_accs = [], []

print("开始训练...")
for epoch in range(num_epochs):
    train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
    test_loss, test_acc = validate(model, test_loader, criterion, device)
    
    train_losses.append(train_loss)
    train_accs.append(train_acc)
    test_losses.append(test_loss)
    test_accs.append(test_acc)
    
    scheduler.step()
    
    print(f'Epoch [{epoch+1}/{num_epochs}]')
    print(f'  Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%')
    print(f'  Test Loss: {test_loss:.4f}, Test Acc: {test_acc:.2f}%')
    print(f'  LR: {optimizer.param_groups[0]["lr"]:.6f}')
    print()

# === 7. 保存模型 ===
torch.save(model.state_dict(), 'cifar10_model.pth')
print("模型已保存!")

# === 8. 可视化 ===
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(train_losses, label='Train Loss')
plt.plot(test_losses, label='Test Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.title('损失曲线')
plt.grid(True)

plt.subplot(1, 2, 2)
plt.plot(train_accs, label='Train Accuracy')
plt.plot(test_accs, label='Test Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy (%)')
plt.legend()
plt.title('准确率曲线')
plt.grid(True)

plt.tight_layout()
plt.savefig('training_curves.png')
plt.show()

# === 9. 测试单张图片 ===
def predict_image(model, image, device):
    model.eval()
    with torch.no_grad():
        image = image.unsqueeze(0).to(device)  # 添加batch维度
        output = model(image)
        _, predicted = output.max(1)
        return predicted.item()

# 随机选择几张测试图片
import random
indices = random.sample(range(len(test_dataset)), 5)

plt.figure(figsize=(15, 3))
for i, idx in enumerate(indices):
    image, label = test_dataset[idx]
    pred = predict_image(model, image, device)
    
    # 反归一化以便显示
    img = image / 2 + 0.5
    img = img.permute(1, 2, 0).numpy()
    
    plt.subplot(1, 5, i+1)
    plt.imshow(img)
    plt.title(f'真实: {classes[label]}\n预测: {classes[pred]}')
    plt.axis('off')

plt.tight_layout()
plt.savefig('predictions.png')
plt.show()

print("\n训练完成!")
print(f"最终测试准确率: {test_accs[-1]:.2f}%")
```

---

## 7. 常见问题和调试技巧

### 问题1：Loss不下降

**可能原因和解决方法**：
```python
# 1. 学习率太小
optimizer = optim.Adam(model.parameters(), lr=0.001)  # 尝试增大到0.01

# 2. 学习率太大
optimizer = optim.Adam(model.parameters(), lr=0.0001)  # 尝试减小

# 3. 模型太简单，学不到复杂模式
# -> 增加层数或神经元数量

# 4. 数据没有归一化
# -> 添加Normalize

# 5. 梯度消失（很深的网络）
# -> 使用BatchNorm或ResNet架构
```

### 问题2：训练准确率高，测试准确率低（过拟合）

```python
# 解决方法：
# 1. 添加Dropout
self.dropout = nn.Dropout(0.5)

# 2. 数据增强
transforms.RandomHorizontalFlip()
transforms.RandomCrop()

# 3. 减少模型复杂度
# 4. 增加训练数据
# 5. Early Stopping
# 6. L2正则化
optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=0.0001)
```

### 问题3：GPU内存不足（OOM）

```python
# 解决方法：
# 1. 减小batch size
train_loader = DataLoader(dataset, batch_size=32)  # 从128减到32

# 2. 使用梯度累积
accumulation_steps = 4
for i, (images, labels) in enumerate(train_loader):
    outputs = model(images)
    loss = criterion(outputs, labels) / accumulation_steps
    loss.backward()
    
    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()

# 3. 使用混合精度训练
from torch.cuda.amp import autocast, GradScaler
scaler = GradScaler()

with autocast():
    outputs = model(images)
    loss = criterion(outputs, labels)

scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()
```

---

## 8. 下一步学习

掌握了这些基础知识后，你可以：

1. **深入学习PyTorch**：官方教程 https://pytorch.org/tutorials/
2. **动手项目**：
   - 图像分类：MNIST、CIFAR-10
   - 目标检测：YOLO
   - 文本生成：训练一个小型GPT
3. **阅读论文**：ResNet、Transformer、GPT等经典论文
4. **参加竞赛**：Kaggle比赛

记住：**实践是最好的老师**。多写代码，多训练模型，多调试bug，慢慢就会掌握！
