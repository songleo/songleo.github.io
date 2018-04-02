---
layout: post
title: python技巧分享（九）
date: 2018-04-02 12:05:01
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 正确打开文件

- 不推荐方式

```python
f = open("tmp")
for line in f.readlines():
    print line

f.close()

'''
line 1

line 2

line 3
'''
```

- 推荐方式

```python
with open("tmp") as f:
    for line in f.readlines():
        print line

'''
line 1

line 2

line 3
'''
```

前一种方式需要显式的调用close()方法关闭打开的文件，如果因为异常或者其他原因没有关闭打开的文件，会导致资源泄露，这是一种很不好的编程习惯。后一种方式使用with语句方式打开文件，文件在with语句块范围外会自动关闭，不需要调用close()方法关闭文件。

### 2 创建有序字典

- 推荐方式

```python
import collections

ordered_dict = collections.OrderedDict()
ordered_dict['0'] = 0
ordered_dict['1'] = 1
ordered_dict['2'] = 2
ordered_dict['3'] = 3
ordered_dict['4'] = 4

print "ordered dict:"
for key, value in ordered_dict.items():
    print "ordered_dict[{key}] = {value}".format(key=key, value=value)

regular_dict = {}
regular_dict['0'] = 0
regular_dict['1'] = 1
regular_dict['2'] = 2
regular_dict['3'] = 3
regular_dict['4'] = 4

print "\nregular dict:"
for key, value in regular_dict.items():
    print "regular_dict[{key}] = {value}".format(key=key, value=value)

'''
ordered dict:
ordered_dict[0] = 0
ordered_dict[1] = 1
ordered_dict[2] = 2
ordered_dict[3] = 3
ordered_dict[4] = 4

regular dict:
regular_dict[1] = 1
regular_dict[0] = 0
regular_dict[3] = 3
regular_dict[2] = 2
regular_dict[4] = 4
'''
```

由于字典存储时是无序的，如果需要将存储顺序记录下来，可以通过使用collections.OrderedDict()方式实现，从上面示例可以看到，对于一般字典，遍历打印该字典时，不是按存储顺序输出。如果使用有序字典，打印时就会按存储的顺序输出。

### 3 模拟switch语句

- 不推荐方式

```python
def calc(operator, x, y):
        if operator == '+':
            return x + y
        elif operator == '-':
            return x - y
        elif operator == '*':
            return x * y
        elif operator == '/':
            return x / y
        else:
            return 'invalid operator'


print calc('+', 2, 1)
# 3
print calc('-', 2, 1)
# 1
print calc('*', 2, 1)
# 2
print calc('/', 2, 1)
# 2
print calc('&', 2, 1)
# invalid operator
```

- 推荐方式

```python
def calc(operator, x, y):
    operator_dict = {
        '+': x + y,
        '-': x - y,
        '*': x * y,
        '/': x / y,
    }

    result = operator_dict.get(operator, None)
    if result is None:
        return 'invalid operator'
    else:
        return result


print calc('+', 2, 1)
# 3
print calc('-', 2, 1)
# 1
print calc('*', 2, 1)
# 2
print calc('/', 2, 1)
# 2
print calc('&', 2, 1)
# invalid operator
```

前一种方式中，通过if else方式实现类似switch的功能，但是代码比较多，尤其重复代码。后一种方式借助字典的特性，轻易实现switch功能，代码量更少且易读。