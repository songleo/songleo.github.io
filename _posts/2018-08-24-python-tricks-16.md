---
layout: post
title: python技巧分享（十六）
date: 2018-08-24 00:12:05
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 单元测试

```python
#!/usr/bin/python

import unittest


def add(x, y):
    return x + y


class TestAdd(unittest.TestCase):

    def setUp(self):
        print "begin testing ..."

    def test_add(self):

        case_list = [
        # (x, y, x + y)
            (1, 1, 2),
            (1, -1, 0),
            (0, 0, 1),
            ('1', '2', '12'),
            ('1', '', '1'),
            ('', '', ''),
            ([0], [1], [0, 1]),
        ]

        for idx, case in enumerate(case_list):
            try:
                self.assertEqual(add(case[0], case[1]), case[2])

            except AssertionError as e:
                print 'test case {} failed: {}'.format(idx + 1, e)

    def tearDown(self):
        print "done"


if __name__ == '__main__':
    unittest.main()

```

运行示例代码输出如下：

```
begin testing ...
test case 3 failed: 0 != 1
done
.
----------------------------------------------------------------------
Ran 1 test in 0.002s

OK
```

示例中定义一个add函数，用于计算参数x和y的和，由于x和y没有指定类型，所以给定不同类型的输入会导致不同的输出。通过python的单元测试框架，定义相应的测试类和函数对add函数进行单元测试。示例中，将所有的输入和输出定义在一个list中，添加一个case只需要往list中添加相应的输入和输出即可。由输出结果可以看到，这里的case 3测试失败，因为0加0应该是0，实际输出是1，示例中将断言失败的异常捕获，打印相应的异常信息。

### 2 配置解析

```python
#!/usr/bin/env python
# coding=utf8

import ConfigParser


conf = ConfigParser.ConfigParser()
conf.read('demo.conf')

print conf.get('section1', 'name')
print conf.get('section1', 'job')
print conf.get('section1', 'id')

print conf.get('section2', 'name')
print conf.get('section2', 'job')
print conf.get('section2', 'id')

'''
user1
dev
1
user2
ps
2
'''
```

配置文件demo.conf的内容如下：

```
[section1]
name = user1
job = dev
id = 1

[section2]
name = user2
job = ps
id = 2
```

借助ConfigParser模块，可以很方便实现配置文件的解析。由示例中可以看到，使用ConfigParser解析配置文件demo.conf，并按不同的配置段打印配置信息。ConfigParser模块还有很多有用功能，感兴趣可以看看，具体可以参考：https://docs.python.org/2/library/configparser.html。

### 3 类的三种方法

```python
#!/usr/bin/env python
# coding=utf8


class DemoClass:

    @classmethod
    def class_method(cls):
        print 'call class_method'

    @staticmethod
    def static_method():
        print 'call static_method'

    def instance_method(self):
        print 'call instance_method'


instance = DemoClass()

instance.class_method()
instance.static_method()
instance.instance_method()

DemoClass.class_method()
DemoClass.static_method()
DemoClass.instance_method()
```

上面示例程序输出如下：

```
call class_method
call static_method
call instance_method
call class_method
call static_method
Traceback (most recent call last):
  File "./python-tips-16.py", line 27, in <module>
    DemoClass.instance_method()
TypeError: unbound method instance_method() must be called with DemoClass instance as first argument (got nothing instead)
```

示例中定义了三种不同的方法，分别是类方法、静态方法和实例方法，由运行结果可以看到，类不能调用实例方法instance_method，可以调用类方法class_method和静态方法static_method，而实例可以调用类方法class_method、静态方法static_method和实例方法instance_method。
