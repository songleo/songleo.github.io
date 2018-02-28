---
layout: post
title: python技巧分享（七）
date: 2018-02-26 20:04:01
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 is 和 == 的区别

```python
import os

str1 = os.__name__
str2 = "os"

print str1
# os
print str2
# os

print str1 == str2
# True

print str1 is str2
# False
```

由示例中可以看到，str1和str2的值都是字符串"os"，str1 == str2为True，但是str1 is str2却为False，即is和==不是一回事，is为True表示两个对象的id相同，即id(str1) == id(str2)时，str1 is str2才为True，is表示2个对象引用同一块内存内容，==表示2个对象的值相等。所以判断2个对象值是否相等时，使用==，判断2个对象是否引用同一块内存时，使用is。如果将上面示例中的str1 = os.__name__修改成str1 = "os"，你会发现str1 is str2为True，这是python为了性能考虑，将str1和str2都指向同一块内存，内存的值就是字符串"os"，所以导致str1 is str2为True，如下：

```python
str1 = "os"
str2 = "os"

print str1
# os

print str2
# os

print str1 == str2
# True

print str1 is str2
# True

print id(str1) == id(str2)
# True

print id(str1)
# 31301840

print id(str2)
# 31301840
```


### 2 通过下划线_丢弃多余的返回值

- 不推荐方式

```python
def demo():
    return 0, 1, 2


multi_values = demo()

print multi_values[1]
# 1
```

- 推荐方式

```python
def demo():
    return 0, 1, 2


_, one, _ = demo()

print one
# 1
```

前一种方式将返回的多个值以元组的形式保存在变量multi_values中，然后读取第二个值，后一种方式中，通过下划线方式，丢弃多余的函数返回值，更加简洁易读。

### 3 如何判断文件是否被打开

- 推荐方式

```python
with open("tmp") as f:
    print f.closed
    for line in f.readlines():
        print line

print f.closed

'''
False
line 1

line 2

line 3
True
'''
```

由示例中可以看到，使用with方式打开文件，文件在with语句块范围外会自动关闭。第一个print打印False，文件处于打开状态，第二个print在with语句的范围外，打印True，表明文件处于关闭状态。