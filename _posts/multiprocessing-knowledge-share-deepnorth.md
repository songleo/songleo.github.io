---
layout: post
title: python标准库multiprocessing总结
date: 2018-11-16 00:12:05
---

# 1 创建进程

子类创建
函数方式

# 2 运行daemon进程

# 3 终止进程

# 4 进程间通信

# 5 进程同步

# 6 管理进程间状态

# 7 使用进程池

 - 多进程并发处理

 - 自动处理list中的每个元素

 - 自动将结果汇总成list

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import time
import multiprocessing


def function_square(data):
    result = data * data
    time.sleep(0.1)
    return result


if __name__ == '__main__':
    inputs = list(range(100))
    pool = multiprocessing.Pool(processes=int(sys.argv[1]))
    pool_outputs = pool.map(function_square, inputs)
    pool.close()
    pool.join()
    # print ('Pool :', pool_outputs)
```

```
# time python process_pool.py 1

real    0m10.503s
user    0m0.016s
sys 0m0.152s
# time python process_pool.py 100

real    0m0.897s
user    0m0.044s
sys 0m0.172s
```