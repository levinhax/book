![图片](images/001.jpg)

CommonJS、AMD、CMD三个规范都是为Js模块化加载而生的，使模块能够按需加载，使系统同庞杂的代码得到组织和管理。

### CommonJS

服务端模块规范，Node.js采用了这个规范。一个单独文件就是一个模块，通过require方法来同步加载要依赖的模块，然后通过extports或则module.exports来导出需要暴露的接口。

```
var $ = require('jquery');
var _ = require('underscore');
 
function a(){}; // 私有
function b(){};
function c(){};
 
module.exports = {
  b: b,
  c: c
}
```

优点：服务器端模块重用，NPM中模块包多，有将近20万个。

缺点：加载模块是同步的，只有加载完成后才能执行后面的操作，也就是当要用到该模块了，现加载现用，不仅加载速度慢，而且还会导致性能、可用性、调试和跨域访问等问题。Node.js主要用于服务器编程，加载的模块文件一般都存在本地硬盘，加载起来比较快，不用考虑异步加载的方式，因此,CommonJS规范比较适用。然而，这并不适合在浏览器环境，同步意味着阻塞加载，浏览器资源是异步加载的，因此有了AMD CMD解决方案。

### AMD异步模块规范

异步模块规范，鉴于浏览器的特殊情况，可以实现异步加载依赖模块，并且会提前加载。

其核心接口：define(id?, dependencies?, factory) ，它要在声明模块的时候指定所有的依赖 dependencies ，并且还要当做形参传到factory 中，对于依赖的模块提前执行，依赖前置。

```
define(['jquery', 'underscore'], function ($, _) {
// 方法
function a(){}; // 私有方法，因为没有被返回(见下面)
function b(){}; // 公共方法，因为被返回了
function c(){}; // 公共方法，因为被返回了

// 暴露公共方法
return {
  b: b,
  c: c
}
});
```

优点：在浏览器环境中异步加载模块；并行加载多个模块；

缺点：开发成本高，代码的阅读和书写比较困难，模块定义方式的语义不顺畅；不符合通用的模块化思维方式，是一种妥协的实现；

### CMD (Common Module Definition)

Common Module Definition 规范和 AMD 很相似，尽量保持简单，并与 CommonJS 和 Node.js 的 Modules 规范保持了很大的兼容性。

```
define(function(require, exports, module) {
    var a = require('./a')
    var b = require('./b') // 依赖可以就近书写
 
    // 通过 exports 对外提供接口
    exports.doSomething = function(){}
 
    // 或者通过 module.exports 提供整个接口
    module.exports = {}
})
```

优点：依赖就近，延迟执行 可以很容易在 Node.js 中运行；

缺点：依赖 SPM 打包，模块的加载逻辑偏重；

### UMD通用模块规范

由于CommonJS和AMD都十分流行，但似乎缺少一个统一的规范。于是，UMD(通用模块规范)出现了，它可以同时支持这两种风格。

虽然这个模式的写法比较难看，但是，它同时兼容了AMD和CommonJS，而且还支持老式的全局变量规范。

1. 先判断是否支持 AMD（define 是否存在），存在则使用 AMD 方式加载模块；
2. 再判断是否支持 Node.js 模块格式（exports 是否存在），存在则使用 Node.js 模块格式；
3. 前两个都不存在，则将模块公开到全局（window 或 global）；

```
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node, CommonJS之类的
    module.exports = factory(require('jquery'));
  } else {
    // 浏览器全局变量(root 即 window)
    root.returnExports = factory(root.jQuery);
  }
}(this, function ($) {
  // 方法
  function myFunc(){};
 
  // 暴露公共方法
  return myFunc;
}));
```

### ES Module

```
// profile.js
export var firstName = 'Michael';
export var lastName = 'Jackson';
export var year = 1958;
```

```
// profile.js
var firstName = 'Michael';
var lastName = 'Jackson';
var year = 1958;
 
export {firstName, lastName, year};
```

```
// main.js
import {firstName, lastName, year} from './profile';
 
function setName(element) {
  element.textContent = firstName + ' ' + lastName;
}
```

```
// circle.js
 
export function area(radius) {
  return Math.PI * radius * radius;
}
export function circumference(radius) {
  return 2 * Math.PI * radius;
}
```

```
import * as circle from './circle';
 
console.log('圆面积：' + circle.area(4));
console.log('圆周长：' + circle.circumference(14));
```

```
// export-default.js
export default function () {
  console.log('foo');
}
```

ES6 模块规范与 CommonJS 规范的不同：

- ES6 模块规范是解析（是解析不是编译）时静态加载、运行时动态引用，所有引用出去的模块对象均指向同一个模块对象。
- CommonJS 规范是运行时动态加载、拷贝值对象使用。每一个引用出去的模块对象，都是一个独立的对象。
