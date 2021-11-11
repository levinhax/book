**如：我要关闭7000端口的服务**

1. 查询端口对应的PID

```
netstat  -nao|findstr  7000
```

查看到7000端口被pid为15152的服务占用了
![服务](images/002.png)

2. 根据PID关闭该进程

```
taskkill /pid 15152 /F
```
F参数：表示强制关闭
