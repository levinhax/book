## npm

[npm](https://www.npmjs.com/) 是JavaScript 世界的包管理工具，并且是Node.js 平台的默认包管理工具。通过npm 可以安装、共享、分发代码，管理项目依赖关系。

比如有一些非常通用的公用方法，抽象封装，剔除一些冗余的业务需求，可以封装在一个npm包中，提供给相应的多个业务去使用。

## 发布步骤

首先建立一个npm包项目，准备要发布的代码。一个高质量的npm包，还会有example、测试test、docs、README.md等。

1. 新建项目，准备需要发布的代码
2. 编写package.json
3. 注册npm账号、并登录
4. 发布

## 准备项目

```
// 新建项目文件夹
mkdir eagle-eye-monitor
 
// 初始化npm，初始化package.json
npm init
 
// 准备好封装代码
// 一般源码是放在src，通过其他打包工具生成的一般是在dist目录或者build目录
mkdir src
 
// 可以将自己需要的代码往src中添加了
// 假设我们只需要发布一个index.js就好
// ......
```

## 发布一个最简单的npm包

1. 先去官网注册一个账号，填写好账号、密码、邮箱
2. 然后登录npm账号 npm login，如果你们公司有自己的默认npm仓库或者使用的淘宝镜像，注意需要指定一下仓库地址；npm login --registry=https://registry.npmjs.org

```
# 会依次让你输入用户名、密码、和邮箱
Username:  
Password:
Email: (this IS public) 
```

3. 发布包 npm publish --registry=https://registry.npmjs.org

会提示+ eagle-eye-monitor@1.0.0 你的包名字和版本，那么说明就发布好了。

## 本地调试

### 链接

项目和模块不在同一个目录下，需要先把模块链接到全局，然后再在项目中链接模块
```
// 先去到模块目录，把它链接到全局
$ cd path/to/my-module
$ npm link
```
npm link 操作会在全局 node_modules 目录（如 MacOS 默认的是 /usr/local/lib/node_modules）下创建一个 module-name 的超链接

```
// 再去项目目录
$ cd path/to/my-project
// 通过包名建立链接
$ npm link module-name
```
此时只需要指定 module-name，在项目的 node_modules 目录下创建一个 module-name 的超链接，链接到 /usr/local/lib/node_modules/module-name，然后再由全局目录下的超链接，链接到具体的代码目录下。

### 解除链接

解除项目和模块的链接
```
// 进入项目目录，解除链接
$ cd path/to/my-project
$ npm unlink module-name
```

解除模块的全局链接
```
// 进入模块目录，解除链接
$ cd path/to/my-module
$ npm unlink module-name
```
