---
layout: post
title: python技巧分享（六）
date: 2018-02-07 20:33:01
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 正确的函数返回

- 不推荐方式

```python
def divide(a, b):
    if b != 0:
        return a * 1.0 / b


print divide(1, 0)
# None
print divide(0, 1)
# 0.0
```

- 推荐方式

```python
def divide(a, b):
    try:
        return a * 1.0 / b
    except ZeroDivisionError as e:
        raise e


print divide(0, 1)
# 0.0
print divide(1, 0)
# ZeroDivisionError: float division by zero
```

前一种方式中，如果输入的参数b为0，函数会默认返回None，这是一个不太好的编程习惯，例如，当把函数的返回值作为if条件判断时，0.0和None都是False，这样容易导致bug。后面这种方式，将除数是0当成异常抛出，让调用者处理异常，是比较合理的做法。

### 2 正确使用函数默认参数

- 不推荐方式

```python
def gen_list(a=[], b=None):
    a.append(b)
    return a


print gen_list(b=2)
# [2]
print gen_list(b=3)
# [2, 3]
```

- 推荐方式

```python
def gen_list(a=None, b=None):
    if a is None:
        a = []
    a.append(b)
    return a


print gen_list(b=2)
# [2]
print gen_list(b=3)
# [3]
```

前一种方式会导致函数默认值改变，多次调用相互影响。正确方式是将函数默认值设置成None，在函数内部初始化默认参数。这里只是针对传递引用类型的参数，如果是数字、字符串等类型就不存在该问题。

### 3 利用元组传递多个函数参数

- 推荐方式

```python
def demo(a, b, c, d):
    print a, b, c, d


args = (1, 2, 3, 4)
demo(*args)
# 1 2 3 4
```

利用python的可变参数特性，可以通过元组传递多个参数，实现参数的“打包式”传递。