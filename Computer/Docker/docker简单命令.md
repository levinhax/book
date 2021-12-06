# docker命令

## 删除镜像

- 查看本地docker镜像: docker images
- 尝试删除本地镜像: docker rmi 1ae57f7e77ec[IMAGE ID]

无法直接删除镜像，有关联docker容器

- 删除docker容器: docker rm ca2c58047430[CONTAINER ID]  (强制删除 docker rm -f ca2c58047430[CONTAINER ID])
- 删除docker镜像
- 删除成功后 docker images 查看

## 前端部署

在仓库里搜下mysql镜像：docker search mysql
拉取镜像：docker pull mysql
查看所有已装镜像：docker images

### 容器

容器是基于镜像运行的一个软件单元。它将代码及其所有依赖关系打包，以便应用程序从一个计算环境可靠快速地运行到另一个计算环境。是一个轻量的独立的可执行的软件包。容器将软件与其环境隔离开来，并确保它可以统一运行。一台机器上可运行多个容器。

查询处于运行状态的容器： docker ps

运行下nginx容器看下浏览器是否能正常访问nginx服务：
```
docker run --name nginx-test -p 8080:80 -d nginx

// 运行完后看 ip:8080能访问说明ok
```

**进入容器**

```
docker exec -it 容器id bash：进入容器（推荐exec，容器退出，不会导致容器的停止）

docker exec -it 9900fc8bb5c9[Container ID] bash 进入容器
```
此时我们可看见nginx的配置/usr/share/nginx/html/index.html，那我们把前端dist直接放进就ok

### 创建 nginx config配置文件

在项目根目录下创建文件default.conf(如：front-page/ai-mask/default.conf)，写入如下内容
```
server {
    listen       80;
    server_name  localhost; # 修改为docker服务宿主机的ip

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html =404;

        expires -1;                          # 首页一般没有强制缓存
        add_header Cache-Control no-cache;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   html;
    }
}
```
该配置文件定义了首页的指向为 /usr/share/nginx/html/index.html, 所以我们可以一会把构建出来的index.html文件和相关的静态资源放到/usr/share/nginx/html目录下。

### Dockerfile

Dockerfile 是一个用来构建镜像的文本文件，文本内容包含了一条条构建镜像所需的指令和说明。

在项目的同级目录下创建dockerfile文件(不一定非要根目录，如：front-page/ai-mask/dockerfile)

然后在/front-page/创建ai-mask文件夹，然后把前端dist拖到/front-page/ai-mask/。

在front-page/ai-mask/ 目录下编辑Dockerfile
```
#  设置基础镜像,这里使用的是最新版的nginx  步骤1 已经安装了最新的版本
FROM nginx

#  定义作者名称 
MAINTAINER levin

# 删除目录下的default.conf文件
RUN rm /etc/nginx/conf.d/default.conf

# 将default.conf复制到/etc/nginx/conf.d/下，用本地的default.conf配置来替换nginx镜像里的默认配置
ADD default.conf /etc/nginx/conf.d/

# 将dist文件夹复制到 /usr/share/nginx/html/  这个目录下面 
COPY /dist/   /usr/share/nginx/html/ 
```

FROM：定制的镜像都是基于 FROM 的镜像，这里的 nginx 就是定制需要的基础镜像。后续的操作都是基于 nginx。

COPY：复制指令，从上下文目录中复制文件或者目录到容器里指定路径。前面我们看过nginx容器里静态文件的目录为/usr/share/nginx/html/，所以故dist复制到此即可。

### 开始构建镜像

```
// -t 是给镜像取名
// 最后有一个点 “.”，表示使用当前路径下的 dockerfile 文件，也可以指定使用其它路径的。
docker build -t ai-mask . // 一定注意末尾加上 .

docker build -t micro-app-main .
docker build -t micro-app-test .
```

### 运行容器

```
// -p ：配置端口映射，格式是外部访问端口：容器内端口
// -d ：后台运行，后台运行容器，并返回容器ID
// --name : 给容器取名，前面一个是给容器取的名字，后面一个是使用的镜像的名字

docker run -itd -p 2222[运行端口]:80 --name ai-mask-1 ai-mask:latest

docker run -itd -p 9000:80 --name micro-app-main-1 micro-app-main:latest

docker run -itd -p 7000:7000 -p 7002:7002 --name micro-app-test-1 micro-app-test:latest
```

### 进入容器

```
docker exec -it f6d33f03653f[Container ID] bash
```
/usr/sbin/nginx 开启nginx服务 （/usr/sbin/nginx -s reload）

微前端项目：
```
worker_processes  1;   # Nginx 进程数，一般设置为和 CPU 核数一样

events {
  worker_connections  1024;   # 每个进程允许最大并发数
}

http {
  server {
    set $root "/Dockerfile/web";   # 设置静态文件目录的绝对路径，该变量根据个人的项目配置有所不同
    listen       9999;   # 配置监听的端口
    server_name  localhost;    # 配置的域名，目前是本地测试，所以直接使用 localhost
    
    location / {
      root   $root/data-platform;  # 网站根目录，这里选用主应用构建后的文件目录
      index  index.html;   # 默认首页文件
      try_files  $uri $uri/ /index.html @rewrites;   # 兼容 history 路由模式，找不到的文件直接重定向到 index.html 

      expires -1;                          # 首页一般没有强制缓存
      add_header Cache-Control no-cache;
    }
    
    location @rewrites {
        rewrite ^(.+)$ /index.html break;   # 重定向规则
    }
  }

  server {
    set $root "/Dockerfile/web";   # 设置静态文件目录的绝对路径，该变量根据个人的项目配置有所不同
    listen       10200;   # 配置监听的端口，vue 子应用的端口号为 10200
    server_name  localhost;    # 配置的域名，目前是本地测试，所以直接使用 localhost

    location / {
      root   $root/ai-mask;  # 网站根目录，这里选用 vue 子应用构建后的文件目录
      index  index.html;   # 默认首页文件
      try_files  $uri $uri/ /index.html @rewrites;   # 兼容 history 路由模式，找不到的文件直接重定向到 index.html 

      expires -1;                          # 首页一般没有强制缓存
      add_header Cache-Control no-cache;

      add_header "Access-Control-Allow-Origin" $http_origin;   # 全局变量获得当前请求origin，带cookie的请求不支持*
      add_header "Access-Control-Allow-Methods" "*";  # 允许请求方法
      add_header "Access-Control-Allow-Headers" "*";  # 允许请求的 header
    }
    
    location @rewrites {
        rewrite ^(.+)$ /index.html break;   # 重定向规则
    }
  }
}

```
