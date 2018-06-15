---
layout: post
title: python技巧分享（十二）
date: 2018-06-15 21:12:05
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 判断序列为非空

- 不推荐方式

```python
l = [1]
if len(l) != 0:
    print l

d = {1: 1}
if len(d) != 0:
    print d

t = (1,)
if len(t) != 0:
    print t

s = '1'
if len(s) != 0:
    print s

'''
[1]
{1: 1}
(1,)
1
'''
```

- 推荐方式

```python
l = [1]
if l:
    print l

d = {1: 1}
if d:
    print d

t = (1,)
if t:
    print t

s = '1'
if s:
    print s

'''
[1]
{1: 1}
(1,)
1
'''
```

判断序列是否为非空，建议不要使用len函数，如果序列为None，使用len函数会抛出TypeError异常，就算能确保序列为非None，使用示例中推荐的方式也更符合python惯例，不管序列是None还是空，都能正确判断。另外，推荐的方式比使用len函数运行快。

### 2 判断list中所有元素是否相同

```python
l = [False] * 3

print l
print len(set(l)) == 1
print l.count(l[0]) == len(l)
print all(e == l[0] for e in l)

'''
[False, False, False]
True
True
True
'''
```

判断list中所有元素是否相同，可以通过示例中提供的3种方式实现，第一种方式通过set将list中元素去重，如果元素个数是1，则证明所有元素都相同；第二种方式借助list的count方法，计算第一个元素出现的次数是否和list长度相等，如果相等则证明所有元素相同；第三种方式通过all函数和列表解析实现，如果所有元素都等于第一个元素，则证明所有元素都相同，一般推荐第一种方式。

### 3 获取对象名称

```python
def demo_func():
    pass


class DemoClass(object):
    pass


f = demo_func
c = DemoClass()

print demo_func.__name__
print DemoClass.__name__
print f.__name__
print c.__class__.__name__

'''
demo_func
DemoClass
demo_func
DemoClass
'''
```

通过访问对象的`__name__`属性，可以获取类、类型、函数等对象的名称。由示例中可以看到，分别获取了函数名和类名。将函数赋值给变量后，依然可以获取函数名。将类实例化后，需要通过`__class__.__name__`属性获取类名。
