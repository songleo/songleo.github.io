---
layout: post
title: python技巧分享（二）
date: 2018-01-26 22:13:32
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 如何在if语句中同时检测多个条件

- 不推荐方式

```
flag1 = 1
flag2 = 0
flag3 = 0

if flag1 == 1 or flag2 == 1 or flag3 == 1:
    print 'ok'
```

- 推荐方式

```
flag1 = 1
flag2 = 0
flag3 = 0

if 1 in (flag1, flag2, flag3):
    print 'ok'
```

可以看到，前一种方式重复代码太多，不推荐。后一种写法更简洁、易读。另外，其实也可以通过any函数实现，如下：

```
if any((flag1, flag2, flag3)):
    print 'ok'
```

### 2 如何从list中随机采样元素

- 推荐方式

```
import random

all_data = [num for num in range(100)]
sample_data = random.sample(all_data, 20)
print sample_data
# [71, 25, 58, 79, 70, 69, 93, 29, 11, 30, 40, 81, 12, 48, 91, 21, 83, 42, 38, 31]
```

这里是从100个元素中，随机采样20个元素。可以看到，借助random模块的sample可以很轻易实现采样功能。python的random模块很有意思，大家感兴趣可以看看，能实现很多有趣的功能。比如可以轻易实现“洗牌”功能：

```
import random

order_list = range(10)
print order_list
random.shuffle(order_list)
print order_list
# [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
# [0, 9, 6, 1, 3, 5, 7, 4, 2, 8]
```

### 3 如何测试函数运行时间

- 不推荐方式

```
import time


def func1():
    time.sleep(2)


begin_time = time.time()
func1()
pass_time = time.time() - begin_time
print pass_time
# 2.00099992752
```

- 推荐方式

```
import time
from timeit import timeit


def func1():
    time.sleep(2)


print timeit(stmt="func1()",
             setup="from __main__ import func1",
             number=1)
# 2.00122451254
```

借助python的timeit模块，可以很轻易的测试出函数运行时间。在不知道timeit模块之前，我就是用前一种方式测试函数运行时间的。
