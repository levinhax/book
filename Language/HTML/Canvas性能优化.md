最近研究Canvas方面的知识，对这一块性能优化没有太多经验，为了避免以后出现的各种坑点，就整理了一下这方面的资料。

### 如何进行性能测试

为了应对 HTML5 画布的快速变化，您可以通过 [JSPerf](https://jsperf.com/) (jsperf.com) 测试来验证所述的各项优化是否仍然有效。JSPerf 是一款供开发人员编写 JavaScript 性能测试的网络应用。每项测试的关注点均为您尝试实现的某种结果（例如清空画布），且会包含可实现相同结果的多种方法。JSPerf 会在短时间内尽可能多地运行每种方法，并提供具有统计意义的每秒迭代次数。分数越高就表示优化效果越好！

### 一、requestAnimationFrame

为了实现动画，我们需要一些可以定时执行重绘的方法。setTimeout 和 setInterval并非是专为连续循环产生的 API，所以可能无法达到流畅的动画表现。window.requestAnimationFrame(callback)提供了更加平缓并更加有效率的方式来执行动画，当系统准备好了重绘条件的时候，才调用绘制动画帧。一般每秒钟回调函数执行60次，也有可能会被降低。

如果页面不是激活状态下的话，requestAnimationFrame() 会被暂停调用以提升性能和电池寿命。

### 二、离屏渲染

如果你发现你的在每一帧里有好多复杂的画图运算，请考虑创建一个离屏canvas，将图像在这个画布上画一次（或者每当图像改变的时候画一次），然后在每帧上画出视线以外的这个画布。

通俗的解释是将离屏canvas当成预渲染，在离屏canvas上绘制好一整块图形，绘制好后在放到视图canvas中，适合每一帧画图运算复杂的图形。

```
myEntity.offscreenCanvas = document.createElement("canvas");
myEntity.offscreenCanvas.width = myEntity.width;
myEntity.offscreenCanvas.height = myEntity.height;
myEntity.offscreenContext = myEntity.offscreenCanvas.getContext("2d");

myEntity.render(myEntity.offscreenContext);
```

### 三、使用多层画布去画一个复杂的场景

你可能会发现，你有些元素不断地改变或者移动，而其它的元素，例如外观，永远不变。这种情况的一种优化是去用多个画布元素去创建不同层次。

比如一个简单的游戏场景，游戏背景始终不变或者变化次数较少但是人物游戏的主体是一直在根据玩家的指挥不停的改变。

```
<div id="stage">
  <canvas id="ui-layer" width="480" height="320"></canvas>
  <canvas id="game-layer" width="480" height="320"></canvas>
  <canvas id="background-layer" width="480" height="320"></canvas>
</div>
 
<style>
  #stage {
    width: 480px;
    height: 320px;
    position: relative;
    border: 2px solid black
  }
  canvas { position: absolute; }
  #ui-layer { z-index: 3 }
  #game-layer { z-index: 2 }
  #background-layer { z-index: 1 }
</style>
```

### 四、避免浮点数的坐标点，用整数取而代之

当你画一个没有整数坐标点的对象时会发生子像素渲染。

*浏览器为了达到抗锯齿的效果会做额外的运算。为了避免这种情况，请保证在你调用drawImage()函数时，用Math.floor()函数对所有的坐标点取整。*

```
ctx.drawImage(myImage, 3, 5);
```

### 五、不要在用drawImage时缩放图像

在离屏canvas中缓存图片的不同尺寸，而不要用drawImage()去缩放它们。

```
// 在离屏 canvas 上绘制
var offscreencanvas = document.createElement('canvas');
// 宽高赋值为想要的图片尺寸
offscreencanvas.width = dWidth;
offscreencanvas.height = dHeight;
// 裁剪
offscreencanvas.getContext('2d').drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
// 在视图canvas中绘制
viewcontext.drawImage(canvas, x, y);
```

### 六、用CSS设置大的背景图

如果像大多数游戏那样，你有一张静态的背景图，用一个静态的<div>元素，结合background 特性，以及将它置于画布元素之后。这么做可以避免在每一帧在画布上绘制大图。

### 七、用CSS transforms特性缩放画布

CSS transforms 特性由于调用GPU，因此更快捷。最好的情况是，不要将小画布放大，而是去将大画布缩小。

### 八、关闭透明度

如果你的游戏使用画布而且不需要透明，当使用 HTMLCanvasElement.getContext() 创建一个绘图上下文时把 alpha 选项设置为 false 。这个选项可以帮助浏览器进行内部优化。

```
var ctx = canvas.getContext('2d', { alpha: false });
```

创建 canvas上下文的 API存在第二个参数：

```
canvas.getContext(contextType, contextAttributes);
```

contextType 是上下文类型，一般值都是 2d，除此之外还有 webgl、webgl2、bitmaprenderer三个值，contextAttributes 是上下文属性，用于初始化上下文的一些属性，对于不同的 contextType，contextAttributes的可取值也不同，对于常用的 2d，contextAttributes可取值有：alpha、willReadFrequently、storage。

### 九、尽量不要频繁地调用比较耗时的API

shadow相关 API，此类 API包括 shadowOffsetX、shadowOffsetY、shadowBlur、shadowColor;

绘图相关的 API，例如 drawImage、putImageData，在绘制时进行缩放操作也会增加耗时时间;

### 十、渲染绘制操作不要频繁调用

渲染绘制的 api，例如 stroke()、fill、drawImage，都是将 ctx状态机里面的状态真实绘制到画布上，这种操作也比较耗费性能。

```
for (let i = 0; i < 10; i++) {
  context.beginPath()
  context.moveTo(x1[i], y1[i])
  context.lineTo(x2[i], y2[i])
  // 每条线段都单独调用绘制操作，比较耗费性能
  context.stroke()
}

for (let i = 0; i < 10; i++) {
  context.beginPath()
  context.moveTo(x1[i], y1[i])
  context.lineTo(x2[i], y2[i])
}
// 先绘制一条包含多条线条的路径，最后再一次性绘制，可以得到更好的性能
context.stroke()
```

### 十一、尽量少的改变状态机 ctx的里状态

ctx可以看做是一个状态机，例如 fillStyle、globalAlpha、beginPath，这些 api都会改变 ctx里面对于的状态，频繁改变状态机的状态，是影响性能的，可以通过对操作进行更好的规划，减少状态机的改变，从而得到更加的性能。

例如在一个画布上绘制几行文字，最上面和最下面文字的字体都是 30px，颜色都是 yellowgreen，中间文字是 20px pink，那么可以先绘制最上面和最下面的文字，再绘制中间的文字，而非必须从上往下依次绘制，因为前者减少了一次状态机的状态改变

```
ctx.font = '30 sans-serif'
ctx.fillStyle = 'yellowgreen'
ctx.fillText("大家好，我是最上面一行", 0, 40)
ctx.fillText("大家好，我是最下面一行", 0, 130)

ctx.font = '20 sans-serif'
ctx.fillStyle = 'red'
ctx.fillText("大家好，我是中间一行", 0, 80)
```

### 十二、尽量少的调用 canvas API

canvas也是通过操纵 js来绘制的，但是相比于正常的 js操作，调用 canvas API将更加消耗资源，所以在绘制之前请做好规划，通过 适量 js原生计算减少 canvas API的调用是一件比较划算的事情。通常情况下，渲染比计算的开销大很多（3~4 个量级）。

### 十三、避免阻塞

#### 1. web worker

web worker 是运行在后台的 JavaScript，独立于其他脚本，不会影响页面的性能。它最常用的场景就是大量的频繁计算，减轻主线程压力，如果遇到大规模的计算，可以通过此 API分担主线程压力。

创建web worker 文件:

```
// demo_workers.js

var i=0;

function timedCount()
{
    i=i+1;
    postMessage(i);
    setTimeout("timedCount()",500);
}

timedCount();
```

创建web worker对象:
```
if (typeof(w) === "undefined") {
    w=new Worker("demo_workers.js");
}
w.onmessage = function(event) {
    document.getElementById("result").innerHTML = event.data;
};
```

终止web worker:
```
w.terminate();
```

#### 2. 分解任务

将一段大的任务过程分解成数个小型任务，使用定时器轮询进行，想要对一段任务进行分解操作，此任务需要满足以下情况：

- 循环处理操作并不要求同步
- 数据并不要求按照顺序处理

分解任务可以是 根据任务总量分配或根据运行时间分配。

##### 根据任务总量分配

```
// 封装 定时器分解任务 函数
function processArray(items, process, callback) {
  // 复制一份数组副本
  var todo=items.concat();
  setTimeout(function(){
    process(todo.shift());
    if(todo.length>0) {
      // 将当前正在执行的函数本身再次使用定时器
      setTimeout(arguments.callee, 25);
    } else {
      callback(items);
    }
  }, 25);
}

// 使用
var items=[12,34,65,2,4,76,235,24,9,90];
function outputValue(value) {
  console.log(value);
}
processArray(items, outputValue, function(){
  console.log('Done!');
});
```

优点是任务分配模式比较简单，更有控制权，缺点是不好确定小任务的大小，小任务可能会造成线程阻塞或资源浪费。

##### 根据运行时间分配

```
function timedProcessArray(items, process, callback) {
  var todo=items.concat();
  setTimeout(function(){
    // 开始计时
    var start = +new Date();
    // 如果单个数据处理时间小于 50ms ，则无需分解任务
    do {
      process(todo.shift());
    } while (todo.length && (+new Date()-start < 50));

    if(todo.length > 0) {
      setTimeout(arguments.callee, 25);
    } else {
      callback(items);
    }
  });
}
```

优点是避免了第一种情况出现的问题，缺点是多出了一个时间比较的运算，额外的运算过程也可能影响到性能。

### 十四、清空画布

```
// 三种方法清空，性能依次提高

context.fillRect()
context.clearRect()
canvas.width = canvas.width; // 一种画布专用的技巧
```

参考：https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
