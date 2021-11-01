# EventTarget.dispatchEvent

向一个指定的事件目标派发一个事件,  并以合适的顺序同步调用目标元素相关的事件处理函数。标准事件处理规则(包括事件捕获和可选的冒泡过程)同样适用于通过手动的使用dispatchEvent()方法派发的事件。

```
cancelable = target.dispatchEvent(event)
```

- event 是要被派发的事件对象。
- target 被用来初始化 事件 和 决定将会触发 目标.

当该事件是可取消的(cancelable为true)并且至少一个该事件的 事件处理方法 调用了Event.preventDefault()，则返回值为false；否则返回true。

*与浏览器原生事件不同，原生事件是由DOM派发的，并通过event loop异步调用事件处理程序，而dispatchEvent()则是同步调用事件处理程序。在调用dispatchEvent()后，所有监听该事件的事件处理程序将在代码继续前执行并返回。*

dispatchEvent()是create-init-dispatch过程的最后一步，用于将事件调度到实现的事件模型中。可以使用Event构造函数来创建事件。

```
// 创建一个支持冒泡且不能被取消的look事件

var ev = new Event("look", {"bubbles":true, "cancelable":false});
document.dispatchEvent(ev);

// 事件可以在任何元素触发，不仅仅是document
myDiv.dispatchEvent(ev);
```

完整示例:
```
      const eventCustom = new Event("build");

      let elem = document.getElementById('elem');
      // Listen for the event.
      elem.addEventListener(
        "build",
        function (e) {
          console.log(111, e);
        },
        false
      );

      // Dispatch the event.
      // elem.dispatchEvent(eventCustom);
      elem.addEventListener('click', e => e.target.dispatchEvent(eventCustom));
```
