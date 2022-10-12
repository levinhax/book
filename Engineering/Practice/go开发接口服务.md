## 零、Docker 安装 MySQL

1. 查看可用的 MySQL 版本: docker search mysql
2. 拉取mysql镜像: docker pull mysql:latest
3. 查看本地镜像: docker images
4. 运行容器: docker run -itd --name mysql-test -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql
5. 通过 docker ps 查看是否安装成功

```
#进入容器
docker exec -it mysql-test bash

#本机可以通过 root 和密码 123456 访问 MySQL 服务。
mysql -h localhost -u root -p

#登录mysql
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';

#添加远程登录用户
CREATE USER 'levin'@'%' IDENTIFIED WITH mysql_native_password BY '123456';
GRANT ALL PRIVILEGES ON *.* TO 'levin'@'%';
```

## 一、初始化项目

1. 在项目根目录(go-service)下，初始化 go.mod 文件

```
go mod init go-service
```

2. 安装gin

```
go get -u github.com/gin-gonic/gin
```

3. 在项目根目录下编写 main.go 文件

```
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.Default()

    // 测试路由
    r.GET("/ping", func(c *gin.Context) {
        c.String(http.StatusOK, "pong")
    })

    // 启动服务器
    r.Run(":5000")
}
```

4. 启动应用 & 测试

执行 go run main.go 启动应用

## 二、初始项目数据库

新建 meta 数据库，编码为utf8_general_ci，在 meta 数据库下，新建以下表

1. 用户表
```
CREATE TABLE `meta_user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT '' COMMENT '用户名',
  `password` varchar(50) DEFAULT '' COMMENT '密码',
  `email` varchar(100),
  `created_on` int(11) DEFAULT NULL,
  `modified_on` int(10) unsigned DEFAULT '0' COMMENT '修改时间',
  `deleted_on` int(10) unsigned DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户管理';
```

```
create database meta;

use meta;

show tables
```

安装驱动
```
go get github.com/go-sql-driver/mysql

go get -u gorm.io/gorm
```

```
package main

import (
    "fmt"
    "github.com/gin-gonic/gin"
    _ "github.com/go-sql-driver/mysql"
    "github.com/jinzhu/gorm"
    "net/http"
    "time"
)

type User struct {
    gorm.Model
    Name      string `gorm:"type:varchar(20);not null"`
    Telephone string `gorm:"varchar(20);not null;unique"`
    Password  string `gorm:"size:255;not null"`
}

//项目初始化
func main() {
    db := InitDB()
    defer db.Close() //延时关闭

    r := gin.Default()

    //r.Run()
    panic(r.Run()) // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}


//数据库连接
func InitDB() *gorm.DB {

    driverName := "mysql"
    host := "127.0.0.1"
    port := "3306"
    database := "blog"
    username := "root"
    password := "islot"
    charset := "utf8"
    args := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=%s&parseTime=true",
        username,
        password,
        host,
        port,
        database,
        charset,
    )

    db, err := gorm.Open(driverName, args)
    //db, err := gorm.Open("mysql", "user:islot@/blog?charset=utf8&parseTime=True&loc=Local")
    if err != nil {
        panic("failed to connect database,err:" + err.Error())
    }

    //自动创建数据表
    db.AutoMigrate(&User{})

    return db

}
```
