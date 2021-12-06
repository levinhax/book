# 概念

compose是函数式编程中使用较多的一种写法, 它把逻辑解耦在各个函数中,通过compose的方式组合函数, 将外部数据依次通过各个函数的加工,生成结果。

## 简单例子

```
      // 这个运算有两个操作，先做加法运算，再做幂运算
      // f(x) = x => (5 + x) ^3

      function power(x) {
        return Math.pow(x, 3);
      }
      function add(x) {
        return x + 5;
      }
      // function compose(fn1, fn2) {
      //   return function (x) {
      //     return fn1(fn2(x));
      //   };
      // }
      // 可简写成
      const compose = (fn1, fn2) => (x) => fn1(fn2(x));
      compose(power,  add)(5)  // 1000
```

这是两个函数compose的实现方式，如果有N个函数呢，这种方式的可读性就太差了。
我们可以构建一个compose函数，它接受任意多个函数作为参数（这些函数都只接受一个参数），然后compose返回的也是一个函数。
最终，compose可以把类似于f(g(h(x)))这种写法简化成compose(f, g, h)(x)。

## 实现

**在redux源码中有这样一种写法**
```
      function compose(...funcs) {
        if (funcs.length === 0) {
          return (arg) => arg;
        }

        if (funcs.length === 1) {
          return funcs[0];
        }

        return funcs.reduce(
          (a, b) =>
            (...args) =>
              a(b(...args))
        );
      }
```
compose最后是返回一个函数，而这个函数是依次执行funcs中每一个项（也是函数）

可以看出compose的特点如下:

- 参数均为函数, 返回值也是函数
- 第一个函数接受参数, 其他函数接受的上一个函数的返回值
- 第一个函数的参数是多元的, 其他函数的一元的
- 自右向左执行

*数组的reduce方法*
```
let arr = [10, 20, 30, 40];
result = arr.reduce((N, item) => {
  // reduce只传递一个回调函数，那么N第一次默认是第一项，后续的N是上一次函数执行的处理结果
  console.log(N, item);
  return N + item;
});

result = arr.reduce((N, item) => {
  console.log(N, item);
  return N + item;
}, 0); // reduce的第二个参数就是给N赋值的初始值，item从数组第一项开始遍历
```

因此上面的运算实现最终如下:
```
      // 这个运算有两个操作，先做加法运算，再做幂运算
      // f(x) = x => (5 + x) ^3

      function power(x) {
        return Math.pow(x, 3);
      }
      function add(x) {
        return x + 5;
      }

      function compose(...funcs) {
        if (funcs.length === 0) {
          return (arg) => arg;
        }

        if (funcs.length === 1) {
          return funcs[0];
        }

        return funcs.reduce(
          (a, b) =>
            (...args) =>
              a(b(...args))
        );
      }

      compose(power, add)(5) // 1000
```
