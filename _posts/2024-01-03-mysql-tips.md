---
layout: post
title: mysql tips
date: 2024-01-03 00:12:05
---

### docker启动mysql

```
docker run --rm --name mysql -e MYSQL_ROOT_PASSWORD=admin -d mysql
```

### 连接mysql

```
docker exec -it mysql bash
mysql -u root -p'admin'
```

### 退出数据库

```
mysql> exit
Bye
```

### 创建db

```
mysql> create database testdb;
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| testdb               |
| sys                |
+--------------------+
5 rows in set (0.00 sec)
```

### 创建table

```
mysql> create table testdb.test ( barcode text, goodsname text, price int );
mysql> describe testdb.test;
+-----------+------+------+-----+---------+-------+
| Field     | Type | Null | Key | Default | Extra |
+-----------+------+------+-----+---------+-------+
| barcode   | text | YES  |     | NULL    |       |
| goodsname | text | YES  |     | NULL    |       |
| price     | int  | YES  |     | NULL    |       |
+-----------+------+------+-----+---------+-------+
3 rows in set (0.00 sec)
mysql> use testdb;
mysql> show tables;
+----------------+
| Tables_in_testdb |
+----------------+
| test           |
+----------------+
1 row in set (0.00 sec)
```

### 添加主键

```
mysql> alter table testdb.test add column id int primary key auto_increment;
Query OK, 0 rows affected (0.03 sec)
Records: 0  Duplicates: 0  Warnings: 0
mysql> describe testdb.test;
+-----------+------+------+-----+---------+----------------+
| Field     | Type | Null | Key | Default | Extra          |
+-----------+------+------+-----+---------+----------------+
| barcode   | text | YES  |     | NULL    |                |
| goodsname | text | YES  |     | NULL    |                |
| price     | int  | YES  |     | NULL    |                |
| id        | int  | NO   | PRI | NULL    | auto_increment |
+-----------+------+------+-----+---------+----------------+
4 rows in set (0.00 sec)
```

### 向table中添加数据

```
mysql> insert into testdb.test ( barcode, goodsname, price ) values ('001', 'demo', 4);
Query OK, 1 row affected (0.00 sec)
mysql> select * from testdb.test;
+---------+-----------+-------+----+
| barcode | goodsname | price | id |
+---------+-----------+-------+----+
| 001     | demo      |     4 |  1 |
+---------+-----------+-------+----+
1 row in set (0.00 sec)
mysql> insert into testdb.test ( barcode, goodsname, price ) values ('002', 'demo2', 2);
Query OK, 1 row affected (0.00 sec)

mysql> select * from testdb.test;
+---------+-----------+-------+----+
| barcode | goodsname | price | id |
+---------+-----------+-------+----+
| 001     | demo      |     4 |  1 |
| 002     | demo2     |     2 |  2 |
+---------+-----------+-------+----+
2 rows in set (0.00 sec)
```
