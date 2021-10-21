## 一、长列表性能优化

1. 不做响应式

比如会员列表、商品列表之类的，只是纯粹的数据展示，不会有任何动态改变的场景下，就不需要对数据做响应化处理，可以大大提升渲染速度

[Object.freeze()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) 方法可以冻结一个对象。一个被冻结的对象再也不能被修改；冻结了一个对象则不能向这个对象添加新的属性，不能删除已有属性，不能修改该对象已有属性的可枚举性、可配置性、可写性，以及不能修改已有属性的值。此外，冻结一个对象后该对象的原型也不能被修改。freeze() 返回和传入的参数相同的对象。

```
export default {
  data: () => ({
    dataList: []
  }),
  async created() {
    const data = await axios.get("/api/xxx");
    this.dataList = Object.freeze(data.result);
  }
};
```
Vue2 的响应式源码地址：src/core/observer/index.js 是这样的
```
export function defineReactive (...){
    const property = Object.getOwnPropertyDescriptor(obj, key)
    if (property && property.configurable === false) {
        return
    }
    ...
}
```
可以看到一开始就判断 configurable 为 false 的直接返回不做响应式处理，而冻结的对象的 configurable 就是为 false。

Vue3 里则是添加了响应式flag，用于标记目标对象类型。

2. 虚拟滚动

如果是大数据很长的列表，全部渲染的话一次性创建太多 DOM 就会非常卡，这时就可以用虚拟滚动，只渲染少部分(含可视区域)区域的内容，然后滚动的时候，不断替换可视区域的内容，模拟出滚动的效果。
```
<recycle-scroller
  class="items"
  :items="items"
  :item-size="24"
>
  <template v-slot="{ item }">
    <FetchItemView
      :item="item"
      @vote="voteItem(item)"
    />
  </template>
</recycle-scroller>
```

可参考 [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller)、[vue-virtual-scroll-list](https://github.com/tangbc/vue-virtual-scroll-list)

### 二、v-for 遍历避免同时使用 v-if

在 Vue2 中 v-for 优先级更高，所以编译过程中会把列表元素全部遍历生成虚拟 DOM，再来通过 v-if 判断符合条件的才渲染，就会造成性能的浪费，因为我们希望的是不符合条件的虚拟 DOM都不要生成

在 Vue3 中 v-if 的优先级更高，就意味着当判断条件是 v-for 遍历的列表中的属性的话，v-if 是拿不到的

所以在一些需要同时用到的场景，就可以通过计算属性来过滤一下列表
```
<template>
    <ul>
      <li v-for="item in activeList" :key="item.id">
        {{ item.title }}
      </li>
    </ul>
</template>
<script>
// Vue2.x
export default {
    computed: {
      activeList() {
        return this.list.filter( item => {
          return item.isActive
        })
      }
    }
}

// Vue3
import { computed } from "vue";
const activeList = computed(() => {
  return list.filter( item => {
    return item.isActive
  })
})
</script>
```

### 三、列表使用唯一 key

### 四、使用 v-show 复用 DOM

使用 v-if 当条件变化的时候，触发 diff 更新，发现新旧 vnode 不一致，就会移除整个旧的 vnode，再重新创建新的 vnode，然后创建新的 my-components 组件，又会经历组件自身初始化，render，patch 等过程，而 v-show 在条件变化的时候，新旧 vnode 是一致的，就不会执行移除创建等一系列流程

### 五、无状态的组件用函数式组件

对于一些纯展示，没有响应式数据，没有状态管理，也不用生命周期钩子函数的组件，我们就可以设置成函数式组件，提高渲染性能，因为会把它当成一个函数来处理，所以开销很低

原理是在 patch 过程中对于函数式组件的 render 生成的虚拟 DOM，不会有递归子组件初始化的过程，所以渲染开销会低很多

它可以接受 props，但是由于不会创建实例，所以内部不能使用 this.xx 获取组件属性
```
<template functional>
  <div>
    <div class="content">{{ value }}</div>
  </div>
</template>
<script>
export default {
  props: ['value']
}
</script>

// 或者
Vue.component('my-component', {
  functional: true, // 表示该组件为函数式组件
  props: { ... }, // 可选
  // 第二个参数为上下文，没有 this
  render: function (createElement, context) {
    // ...
  }
})
```

### 六、子组件分割

```
<template>
  <div :style="{ opacity: number / 100 }">
    <div>{{ someThing() }}</div>
  </div>
</template>
<script>
export default {
  props:['number'],
  methods: {
    someThing () { /* 耗时任务 */ }
  }
}
</script>
```
上面这样的代码中，每次父组件传过来的 number 发生变化时，每次都会重新渲染，并且重新执行 someThing 这个耗时任务

所以优化的话一个是用计算属性，因为计算属性自身有缓存计算结果的特性

第二个是拆分成子组件，因为 Vue 的更新是组件粒度的，虽然每次数据变化都会导致父组件的重新渲染，但是子组件却不会重新渲染，因为它的内部没有任何变化，耗时任务自然也就不会重新执行，因此性能更好
```
<template>
  <div>
    <my-child />
  </div>
</template>
<script>
export default {
  components: {
    MyChild: {
      methods: {
        someThing () { /* 耗时任务 */ }
      },
      render (h) {
        return h('div', this.someThing())
      }
    }
  }
}
</script>
```

### 七、变量本地化

简单说就是把会多次引用的变量保存起来，因为每次访问 this.xx 的时候，由于是响应式对象，所以每次都会触发 getter，然后执行依赖收集的相关代码，如果使用变量次数越多，性能自然就越差

```
<template>
  <div :style="{ opacity: number / 100 }"> {{ result }}</div>
</template>
<script>
import { someThing } from '@/utils'
export default {
  props: ['number'],
  computed: {
    base () { return 100 },
    result () {
      let base = this.base, number = this.number // 保存起来
      for (let i = 0; i < 1000; i++) {
        number += someThing(base) // 避免频繁引用 this.xx
      }
      return number
    }
  }
}
</script>
```

### 八、第三方插件按需引入

### 九、路由懒加载

### 十、keep-alive缓存页面

比如在表单输入页面进入下一步后，再返回上一步到表单页时要保留表单输入的内容、比如在列表页>详情页>列表页，这样来回跳转的场景等

我们都可以通过内置组件 <keep-alive></keep-alive> 来把组件缓存起来，在组件切换的时候不进行卸载，这样当再次返回的时候，就能从缓存中快速渲染，而不是重新渲染，以节省性能

### 十一、事件的销毁

Vue 组件销毁时，会自动解绑它的全部指令及事件监听器，但是仅限于组件本身的事件

而对于定时器、 addEventListener 注册的监听器等，就需要在组件销毁的生命周期钩子中手动销毁或解绑，以避免内存泄露

```
<script>
export default {
    created() {
      this.timer = setInterval(this.refresh, 2000)
      addEventListener('touchmove', this.touchmove, false)
    },
    beforeDestroy() {
      clearInterval(this.timer)
      this.timer = null
      removeEventListener('touchmove', this.touchmove, false)
    }
}
</script>
```

### 十二、图片懒加载

图片懒加载就是对于有很多图片的页面，为了提高页面加载速度，只加载可视区域内的图片，可视区域外的等到滚动到可视区域后再去加载

可以使用第三方插件 vue-lazyload

也可以手动封装一个自定义指令，这里封装好了一个兼容各浏览器的版本的，主要是判断浏览器支不支持 IntersectionObserver API，支持就用它实现懒加载，不支持就用监听 scroll 事件+节流的方式实现

```
const LazyLoad = {
  // install方法
  install(Vue, options) {
    const defaultSrc = options.default
    Vue.directive('lazy', {
      bind(el, binding) {
        LazyLoad.init(el, binding.value, defaultSrc)
      },
      inserted(el) {
        if (IntersectionObserver) {
          LazyLoad.observe(el)
        } else {
          LazyLoad.listenerScroll(el)
        }
      },
    })
  },
  // 初始化
  init(el, val, def) {
    el.setAttribute('data-src', val)
    el.setAttribute('src', def)
  },
  // 利用IntersectionObserver监听el
  observe(el) {
    var io = new IntersectionObserver((entries) => {
      const realSrc = el.dataset.src
      if (entries[0].isIntersecting) {
        if (realSrc) {
          el.src = realSrc
          el.removeAttribute('data-src')
        }
      }
    })
    io.observe(el)
  },
  // 监听scroll事件
  listenerScroll(el) {
    const handler = LazyLoad.throttle(LazyLoad.load, 300)
    LazyLoad.load(el)
    window.addEventListener('scroll', () => {
      handler(el)
    })
  },
  // 加载真实图片
  load(el) {
    const windowHeight = document.documentElement.clientHeight
    const elTop = el.getBoundingClientRect().top
    const elBtm = el.getBoundingClientRect().bottom
    const realSrc = el.dataset.src
    if (elTop - windowHeight < 0 && elBtm > 0) {
      if (realSrc) {
        el.src = realSrc
        el.removeAttribute('data-src')
      }
    }
  },
  // 节流
  throttle(fn, delay) {
    let timer
    let prevTime
    return function (...args) {
      const currTime = Date.now()
      const context = this
      if (!prevTime) prevTime = currTime
      clearTimeout(timer)
 
      if (currTime - prevTime > delay) {
        prevTime = currTime
        fn.apply(context, args)
        clearTimeout(timer)
        return
      }
 
      timer = setTimeout(function () {
        prevTime = Date.now()
        timer = null
        fn.apply(context, args)
      }, delay)
    }
  },
}
export default LazyLoad
```

### 十三、SSR
