## 概述

前端项目的根目录下面，一般都有一个package.json文件，定义了这个项目所需要的各种模块，以及项目的配置信息（比如名称、版本、作者、简介、包依赖、构建等信息）。

## 常用命令

```
npm init  // 生成package.json

npm i --save pkgName   // 安装依赖包

npm i --save-dev pkgName   // 安装依赖包

npm i --save pkgName@1.1.0    // 安装指定版本的包，版本号用@符号连接
```

## 属性

### name

name必须小于等于214个字符，不能以.或_开头，不能有大写字母，因为名称最终成为URL的一部分因此不能包含任何非URL安全字符。
npm官方建议我们不要使用与核心节点模块相同的名称。不要在名称中加js或node。如果需要可以使用engines来指定运行环境。

该名称会作为参数传递给require，因此它应该是简短的，但也需要具有合理的描述性。

### version

version一般的格式是x.x.x, 并且需要遵循该规则。名称和版本一起构成一个标识符，该标识符被认为是完全唯一的。每次发布时version不能与已存在的一致。

### description

description是一个字符串，用于编写描述信息。

### keywords

keywords是一个字符串组成的数组，有助于人们在npm库中搜索的时候发现你的模块。

### homepage

项目的主页地址

### bugs

用于项目问题的反馈issue地址或者一个邮箱

### license

当前项目的协议，让用户知道他们有何权限来使用你的模块，以及使用该模块有哪些限制。

### author、contributors

author是具体一个人，contributors表示一群人，他们都表示当前项目的共享者。同时每个人都是一个对象。

### main

指定加载的入口文件，require导入的时候就会加载这个文件。

### bin

用来指定每个内部命令对应的可执行文件的位置。

### scripts

指定运行脚本命令的npm命令行缩写

### dependencies、devDependencies

dependencies字段指定了项目运行所依赖的模块，devDependencies指定项目开发所需要的模块。

它们的值都是一个对象。该对象的各个成员，分别由模块名和对应的版本要求组成，表示依赖的模块及其版本范围。对象的每一项通过一个键值对表示，前面是模块名称，后面是对应模块的版本号。版本号遵循“大版本.次要版本.小版本”的格式规定。

当安装依赖的时候使用--save参数表示将该模块写入dependencies属性，--save-dev表示将该模块写入devDependencies属性。

#### 版本号说明

- 指定版本：比如1.2.2，遵循“大版本.次要版本.小版本”的格式规定，安装时只安装指定版本;
- 波浪号（tilde）+指定版本：比如~1.2.2，表示安装1.2.x的最新版本，但是不安装1.3.x;
- 插入号（caret）+指定版本：比如ˆ1.2.2，表示安装1.x.x的最新版本，但是不安装2.x.x;
- latest：安装最新版本;

### private

设为true这个包将不会发布到NPM平台下
