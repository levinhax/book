## 概要

Rollup 是一个 JavaScript 模块打包器，可以将小块代码编译成大块复杂的代码，例如 library 或应用程序。

## 配置文件

配置文件是一个ES6模块，它对外暴露一个对象，这个对象包含了一些Rollup需要的一些选项。通常，我们把这个配置文件叫做rollup.config.js，它通常位于项目的根目录
```
// rollup.config.js
export default {
  // 核心选项
  input,     // 必须
  plugins,
};
```
如果你想使用Rollup的配置文件，记得在命令行里加上--config或者-c
