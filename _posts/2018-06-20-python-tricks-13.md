---
layout: post
title: python技巧分享（十三）
date: 2018-06-20 00:05:00
---

这是一个系列文章，主要分享python的使用建议和技巧，每次分享3点，希望你能有所收获。

### 1 python2代码转换成python3代码

python2代码：

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def greet(name):
    print "Hello, {0}!".format(name)
print "What's your name?"
name = raw_input()
greet(name)
```

分别使用python2和python3运行python2代码：

```bash
$ python2 2to3_demo.py
What's your name?
LEo
Hello, LEo!
```

```bash
$ python3 2to3_demo.py
  File "2to3_demo.py", line 6
    print "Hello, {0}!".format(name)
                      ^
SyntaxError: invalid syntax
```

转换步骤：

```bash
$ 2to3 -w 2to3_demo.py
RefactoringTool: Skipping implicit fixer: buffer
RefactoringTool: Skipping implicit fixer: idioms
RefactoringTool: Skipping implicit fixer: set_literal
RefactoringTool: Skipping implicit fixer: ws_comma
RefactoringTool: Refactored 2to3_demo.py
--- 2to3_demo.py    (original)
+++ 2to3_demo.py    (refactored)
@@ -3,7 +3,7 @@
 
 
 def greet(name):
-    print "Hello, {0}!".format(name)
-print "What's your name?"
-name = raw_input()
+    print("Hello, {0}!".format(name))
+print("What's your name?")
+name = input()
 greet(name)
RefactoringTool: Files that were modified:
RefactoringTool: 2to3_demo.py
```

使用python3运行转换后的代码:

```bash
$ python3 2to3_demo.py
What's your name?
LEo
Hello, LEo!
```

转换后的python3代码：

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def greet(name):
    print("Hello, {0}!".format(name))
print("What's your name?")
name = input()
greet(name)
```

python2和python3的语法有一定的区别，不能直接使用python3运行python2的代码，官方提供了2to3工具，通过该工具（运行yum install python-tools命令安装），可以将python2代码自动转换成python3代码。由示例中可以看到，使用该工具转换后（-w表示将转换后的python代码写入文件），python2代码就可以在python3上运行，否则会报语法错误。

### 2 python代码反汇编

```python
#!/usr/bin/env python
# coding=utf8

import dis


def add(a, b):
    return a + b


dis.dis(add)
```

运行示例如下：

```bash
$ ./dis_demo.py 
  8           0 LOAD_FAST                0 (a)
              3 LOAD_FAST                1 (b)
              6 BINARY_ADD          
              7 RETURN_VALUE        
```

通过标准库dis模块，可以反汇编python代码，进而查看python代码的字节码。由示例中可以看到add函数反汇编后字节码，通过字节码大概能看明白该函数的具体执行过程。

### 3 python代码检测

待检测的代码：

```python
 #!/usr/bin/env python

import string

shift = 3
choice = raw_input("would you like to encode or decode?")
word = (raw_input("Please enter text"))
letters = string.ascii_letters + string.punctuation + string.digits
encoded = ''
if choice == "encode":
    for letter in word:
        if letter == ' ':
            encoded = encoded + ' '
        else:
            x = letters.index(letter) + shift
            encoded=encoded + letters[x]
if choice == "decode":
    for letter in word:
        if letter == ' ':
            encoded = encoded + ' '
        else:
            x = letters.index(letter) - shift
            encoded = encoded + letters[x]

print encoded
```

检测步骤如下：

```
$ pylint pylint_demo.py 
No config file found, using default configuration
************* Module pylint_demo
C: 16, 0: Exactly one space required around assignment
            encoded=encoded + letters[x]
                   ^ (bad-whitespace)
C:  1, 0: Missing module docstring (missing-docstring)
C:  5, 0: Constant name "shift" doesn't conform to UPPER_CASE naming style (invalid-name)
C:  6, 0: Constant name "choice" doesn't conform to UPPER_CASE naming style (invalid-name)
C:  7, 0: Constant name "word" doesn't conform to UPPER_CASE naming style (invalid-name)
C:  8, 0: Constant name "letters" doesn't conform to UPPER_CASE naming style (invalid-name)
C:  9, 0: Constant name "encoded" doesn't conform to UPPER_CASE naming style (invalid-name)

------------------------------------------------------------------
Your code has been rated at 6.32/10 (previous run: 6.32/10, +0.00)
```

检测得分6.32分（满分10分），按建议修改后的代码如下：

```python
# !/usr/bin/env python

'''
pylint demo code
'''

import string

SHIFT = 3
CHOICE = raw_input("would you like to encode or decode?")
WORD = (raw_input("Please enter text"))
LETTERS = string.ascii_letters + string.punctuation + string.digits
ENCODED = ''
if CHOICE == "encode":
    for LETTER in WORD:
        if LETTER == ' ':
            ENCODED = ENCODED + ' '
        else:
            x = LETTERS.index(LETTER) + SHIFT
            ENCODED = ENCODED + LETTERS[x]
if CHOICE == "decode":
    for LETTER in WORD:
        if LETTER == ' ':
            ENCODED = ENCODED + ' '
        else:
            x = LETTERS.index(LETTER) - SHIFT
            ENCODED = ENCODED + LETTERS[x]

print ENCODED
```

再次检测得分10分：

```
$ pylint pylint_demo.py 
No config file found, using default configuration

-------------------------------------------------------------------
Your code has been rated at 10.00/10 (previous run: 6.32/10, +3.68)
```

由示例中可以看到，通过pylint（运行pip install pylint命令安装）工具，在一定程度上可以检测python代码是否符合规范。
