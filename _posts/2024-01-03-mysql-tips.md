---
layout: post
title: mysql tips
date: 2024-01-03 00:12:05
---

### docker启动mysql

```
docker run --rm -v /Users/ssli/share/db_data:/var/lib/mysql --name mysql -e MYSQL_ROOT_PASSWORD=admin -d mysql
```

### 连接mysql

```
docker exec -it mysql env LANG=C.utf8 bash
mysql -u root -p'admin'
```

### 退出数据库

```
mysql> exit
Bye
```

### 创建db

```
mysql> create database demo;
Query OK, 1 row affected (0.00 sec)

mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| demo               |
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
5 rows in set (0.01 sec)
```

### 创建table

```
mysql> create table demo.test ( barcode text, goodsname text, price int );
Query OK, 0 rows affected (0.02 sec)

mysql> describe demo.test;
+-----------+------+------+-----+---------+-------+
| Field     | Type | Null | Key | Default | Extra |
+-----------+------+------+-----+---------+-------+
| barcode   | text | YES  |     | NULL    |       |
| goodsname | text | YES  |     | NULL    |       |
| price     | int  | YES  |     | NULL    |       |
+-----------+------+------+-----+---------+-------+
3 rows in set (0.00 sec)

mysql> use demo
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
+----------------+
| Tables_in_demo |
+----------------+
| test           |
+----------------+
1 row in set (0.00 sec)
```

### 添加主键

```
mysql> alter table demo.test add column itemnumber int primary key auto_increment;
Query OK, 0 rows affected (0.04 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> describe demo.test;
+------------+------+------+-----+---------+----------------+
| Field      | Type | Null | Key | Default | Extra          |
+------------+------+------+-----+---------+----------------+
| barcode    | text | YES  |     | NULL    |                |
| goodsname  | text | YES  |     | NULL    |                |
| price      | int  | YES  |     | NULL    |                |
| itemnumber | int  | NO   | PRI | NULL    | auto_increment |
+------------+------+------+-----+---------+----------------+
4 rows in set (0.00 sec)
```

### 向table中添加数据

```
mysql> insert into demo.test (barcode,goodsname,price) VALUES ('0001','本',3);
Query OK, 1 row affected (0.01 sec)
mysql> select * from demo.test;
+---------+-----------+-------+------------+
| barcode | goodsname | price | itemnumber |
+---------+-----------+-------+------------+
| 0001    | 本        |     3 |          1 |
+---------+-----------+-------+------------+
1 row in set (0.00 sec)
```
