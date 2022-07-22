## 一、基本命令

1. 重启：reboot -f
2. 关机：poweroff
3. 帮助：命令 --help

## 二、目录操作命令

Linux的目录结构为树状结构，最顶级的目录为根目录 /。

- 绝对路径: 路径的写法，由根目录 / 写起，例如： /usr/share/doc 这个目录。
- 相对路径: 路径的写法，不是由 / 写起，例如由 /usr/share/doc 要到 /usr/share/man 底下时，可以写成： cd ../man 这就是相对路径的写法。

- ls（英文全拼：list files）: 列出目录及文件名
- cd（英文全拼：change directory）：切换目录
- pwd（英文全拼：print work directory）：显示目前的目录
- mkdir（英文全拼：make directory）：创建一个新的目录
- rmdir（英文全拼：remove directory）：删除一个空的目录
- cp（英文全拼：copy file）: 复制文件或目录
- rm（英文全拼：remove）: 删除文件或目录
- mv（英文全拼：move file）: 移动文件与目录，或修改文件与目录的名称
- find: 查找文件

```
// 复制一文件，创建一目录，将文件移动到目录中
cd /tmp
cp ~/.bashrc bashrc
mkdir mvtest
mv bashrc mvtest
// 将刚刚的目录名称更名为 mvtest2
mv mvtest mvtest2
```

## 三、文件操作命令

- touch: 新建文件
- vi: 修改文件
- cat: 由第一行开始显示文件内容
- more: 一页一页翻动
- grep: 文本过滤查找工具

## 四、压缩文件操作

- 打包：tar -cvf 打包压缩后文件名 待打包的文件（注：c：打包；v：显示运行过程；f：指定文件名）
- 解压：tar -xvf 待解压文件

## 五、其他命令

1. 查看进程：ps -ef
2. 结束进程：kill -9 pid（注：-9 强制；pid：进程号）
3. 网络通信命令：
   - ifconfig ：查看网卡信息
   - ping：查看与某台机器的连接情况
   - netstat -an：查看当前系统端口
4. 切换用户：su
5. 修改文件权限：chmod
