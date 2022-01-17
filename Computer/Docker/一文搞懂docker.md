## Docker介绍

![Docker](images/001.png)

Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的镜像中，然后发布到任何流行的 Linux或Windows操作系统的机器上，也可以实现虚拟化(集装箱原理)。容器是完全使用沙箱机制，相互之间不会有任何接口。

Docker 中有三个核心概念：镜像（Image）、容器（Container）、仓库（Repository）。

Image 是只读的，分为 Base Image 和普通 Image，Base Image 是直接基于内核构造的，例如 Ubuntu Image、Centos Image 等。

Container是镜像的一个运行实例。由镜像、运行环境、指令集组成。

Repository是一个集中存储、管理镜像的远程服务，类似与maven的远程仓库，可通过仓库进行镜像的分发。

**用docker做开发环境的好处**

- 保持本机清爽
- 隔离环境
- 方便迁移
- 更快速的交付部署

```
+---------+  +---------+  +---------+    +-----+ +-----+ +-----+
| xxx1.com |  | xxx2.com |  | xxx3.com |    | DB1 | | DB2 | | DB3 |    
+----+----+  +----+----+  +----+----+    +--+--+ +--+--+ +--+--+    
     |            |            |            |       |       |
+----+----+  +----+----+  +----+----+    +--+--+ +--+--+ +--+--+    
|   xxx1   |  | xxx2.com |  | xxx3.com |    | DB1 | | DB2 | | DB3 |
| config  |  | config  |  | config  |    | conf| | conf| | conf|
|  data   |  |  data   |  |  data   |    | data| | data| | data|
+----+----+  +----+----+  +----+----+    +--+--+ +--+--+ +--+--+
     |            |            |            |       |       |
     +------------+------------+            +-------+-------+
                  |                                 |
           +------+------+                   +------+------+          
           | Nginx Image |                   | MySQL Image
```

## 安装 Docker

如果是你 MacOS 或 Windows ，直接下载[Docker Desktop](https://www.docker.com/)，下载很慢的话，可以去 [DaoCloud](http://get.daocloud.io/)。
Linux根据官网文档进行操作。

安装完成，打开 docker，待其完全启动后，打开 shell 输入：
```
docker -v
```
有版本信息即安装成功。

Docker-Compose:

Compose 是用于定义和运行多容器 Docker 应用程序的工具。通过 Compose，您可以使用 YML 文件来配置应用程序需要的所有服务。然后，使用一个命令，就可以从 YML 文件配置中创建并启动所有服务。

检验是否安装:
```
docker-compose -v
```

## Docker 应用场景

### 从hello world开始

创建一个 hello-docker 目录，在里面新建一个index.js
```
console.log('hello docker!!!');
```

### 编写Dockerfile

新建一个Dockerfile文件
```
FROM node:16.13.2-slim
COPY . ./demo
WORKDIR /demo
CMD node index.js
```

- FROM node:16.13.2-slim 就是说我们的镜像会继承 node:16.13.2-slim 这个镜像，可以从[Docker Hub](https://hub.docker.com/)中找到
- COPY . ./demo 是把当前目录拷贝到镜像的/demo目录下，也可以使用.dockerignore来排除不需要打包的文件
- WORKDIR /demo 类似于 cd /demo
- CMD node index.js 容器启动后执行node index.js命令

### 构建镜像

```
docker image build -t hello-docker .
```

构建好之后，运行docker images就可以查看到hello-docker镜像了。

### 运行容器

```
docker container run hello-docker
```

## 端口映射

拉取nginx镜像
```
docker pull nginx
```

启动容器，端口映射通过-P和-p参数来实现

```
docker run --name nginx -p 80:80 -d nginx
```

nginx镜像配置文件： /etc/nginx/conf.d/default.conf、 /usr/share/nginx/html

### nginx启动/重启/暂停

#### 启动

启动代码格式：nginx安装目录地址 -c nginx配置文件地址
```
/usr/local/nginx/sbin/nginx -c /etc/nginx/nginx.conf
```

#### 停止

##### 从容停止

1. 查看进程号
```
ps -ef|grep nginx
```

2. 杀死进程
```
kill -QUIT 2072
```

##### 快速停止

1. 查看进程号
```
ps -ef|grep nginx
```

2. 杀死进程
```
kill -TERM 2072
```

##### 强制停止

```
pkill -9 nginx
```

#### 重启

cd /usr/sbin

```
nginx -c /etc/nginx/nginx.conf
```

```
// 进入nginx可执行目录sbin下，
nginx -s reload
```

*报错： ps: command not found*
原因是该 nginx 镜像 没有打包 ps 命令
```
apt-get update && apt-get install procps
```

## Docker的常用命令

### 镜像常用命令

```
docker pull [镜像名称:版本] 拉取镜像
docker images  镜像列表
docker rmi [镜像名称:版本] 删除镜像
docker history [镜像名称] 镜像操作记录
docker tag [镜像名称:版本][新镜像名称:新版本]
docker inspect [镜像名称:版本] 查看镜像详细
docker search [关键字] 搜索镜像
docker login 镜像登陆
docker image build -t [镜像名称] . // -t ：指定要创建的目标镜像名； . ：Dockerfile 文件所在目录，可以指定Dockerfile 的绝对路径
```

### 容器常用命令

```
docker ps -a 容器列表(所有容器)
docker ps  查看所有(运行的)容器
docker exec -it <id> /bin/bash   // 以 bash 命令进入容器内
docker run -it --name [容器名称][镜像名称:版本] bash  // 启动容器并进入
docker logs 查看容器日志
docker top <container_id> 查看容器最近的一个进程
docker run -it --name [容器名称] -p 8080:80 [镜像名称:版本] bash  端口映射
docker rm <container_id> 删除容器
docker stop <container_id> 停止容器
docker start <container_id> 开启容器
docker restart <container_id> 重启容器
docker inspect <container_id> 查看容器详情
docker commit [容器名称] my_image:v1.0  容器提交为新的镜像
```

### DockerFile常用命令

见上
