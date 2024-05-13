### 1. props 和 emit

vue2


```
<son count="100" @addCount = "addCount"></son>
addCount(val) {}
```

子组件
```
props: ['count'] // [{count: Number}]  [{count: {type: Number, default: 0}],this.$emit('addCount', value)
```

vue3

父组件
```
<son count="100" @addCount = "addCount"></son>
constaddCount = (val) => {}
```

子组件
```
const props = defineProps(['count']) // defineProps({ count: Number })

defineProps<{ count?: number }>(), const emit = defineEmits(['addCount']) 
functionbuttonClick() { 
    emit('addCount') 
}
```

### 2. $attrs 和 $listeners

```
$attrs // 组件传值, 除了已在prop声明的值和 class样式名 style行内样式
$listeners // 组件传函数, 除了.native// 父组件
<Son :num="num" @addNum='addNum'></Son>
// 子组件
<GrandSon></GrandSon><div>{{$attrs.num}}</div>
// 孙子组件
<div @click="clickFn">{{$attrs.num}}</div>methods:{
    clickFn(){
        this.$listeners.addNum()
    }
}
```

### 3. v-model

vue2 v-mode 是 :value="msg" @input="msg=$event" 的语法糖，vue3 v-mode 是 :modelValue="msg" @update:modelValue="msg=$event" 的语法糖

### 4. 作用域插槽

```
<template>
    <div>
        <!--默认插槽-->
        <slot></slot>
        <!--另一种默认插槽的写法-->
        <slot name="default"></slot>
        <!--具名插槽-->
        <slot name="footer"></slot>
        <!--作用域插槽-->
        <slot v-bind:user="user" name="header"></slot>
    </div>
</template>
<!--使用-->
<children>
    <!--跑到默认插槽中去-->
    <div>123</div>
    <!--另一种默认插槽的写法-->
    <template v-slot:default></template>
    <!--跑到具名插槽 footer 中去-->
    <template v-slot:footer></template>
    <!--缩写形式-->
    <template #footer></template>
    <!--获取子组件的值-->
    <template v-slot:header="slot">{{slot.user}}</template>
    <!--结构插槽值-->
    <template v-slot:header="{user: person}">{{person}}</template>
    <!--老式写法，可以写到具体的标签上面-->
    <template slot="footer" slot-scope="scope"></template>
</children>
```

### 5. $refs, $root, $parent, $children

- $root 获取根组件
- $parent 获取父组件
- $children 获取子组件(所有的子组件，不保证顺序)
- $refs 组件获取组件实例，元素获取元素

### 6. provide 和 inject

vue2

父组件
```
provide(){
 return{
     color:this.color
 }
}
```

子孙组件
```
<h3>{color}</h3>
exportdefault{
  inject:['color'] //inject: { color: 'color' }  inject: {color: {from: 'colorcolor',default:#333}}
}
```

vue3

父组件
```
import { provide } from'vue';
provide('money',money)
provide('changeMoneyFn',number=>{
    money.value-=number
})
```

子孙组件
```
import { inject } from"vue";
const money =inject('money')
const changeMoneyFn=inject('changeMoneyFn')
```

### 7. mitt/ event-bus

event-bus
```
/* eventbus.js 暴露总结总线文件 */// 这里我们在js中暴露这个事件总线对象 
import Vue from 'vue'
export default new Vue()
```

```
// 注册事件
bus.$on("getScore", data => {
    this.yoursore = data;
});
// 触发事件
bus.$emit("getScore", this.score);
```

mitt
```
/* eventbus.js 暴露总结总线文件 */// 这里我们在js中暴露这个事件总线对象 import mitt from"mitt"; 
const emitter = mitt(); 
exportdefault emitter;
```

```
// 注册事件import emitter from"./utils/eventbus.js";
emitter.on("getScore", data =&gt; {
    this.yoursore = data;
});
// 触发事件import emitter from"./utils/eventbus.js";
emitter.emit("getScore", this.score)
```

### 8. pina/vuex

vuex

声明
```
import { createApp } from'vue'import { createStore } from'vuex'// 创建一个新的 store 实例const store = createStore({
  state () {
    return {
      count: 0
    }
  },
  mutations: {
    increment (state) {
      state.count++
    }
  },
  actions: {},
  getters: {},
  modules: {}
})
const app = createApp({ /* 根组件 */ })
// 将 store 实例作为插件安装
app.use(store)
```

使用
```
1. 直接调用
this.$store.state.name// 跨模块访问 state 数据: store.rootState.user.profile.tokenthis.$store.commit('setCount', 5) // 跨模块访问mutation方法 : store.commit('permission/setRoutes', [], { root: true })this.$store.dispatch("asyncSetCount", 5)
this.$store.getters.validList2. 计算属性调用
computed: { 
  name(){ 
    returnthis.$store.state.name; 
  },
  validList(){ 
    returnthis.$store.getters.validList;
  }
}
3. 方法调用
4. 引入辅助函数, 延展运算符展开调用
import { mapState, mapMutations, mapActions, mapGetters } from'vuex'computed: { ...mapState(['name']), ...mapGetters(['validList']) }
methods: { ...mapMutations(['setCount']), ...mapActions(['asyncSetCount']) }
5. 模块化调用
import { mapMutations } from'vuex'this.$store.state.user.tokenthis.$store.commit('user/setNewState', 666)
methods: {
...mapMutations(["user/setNewState"]),
setNewState(data) {
this['user/setNewState'](data)
}
}
6. createNamespacedHelpers 创建基于某个命名空间辅助函数
import { createNamespacedHelpers, mapGetters } from"vuex";
const { mapMutations } = createNamespacedHelpers("user");
exportdefault {
computed: {
...mapGetters(["token", "name"]),
},
methods: {
...mapMutations(["setNewState"]),
},
};
< h3 > name: { { name } }< /h3>
< button @click="setNewState(666)" > 修改数据 < /button >
```

pina

声明
```
import { createPinia } from'pinia'
app.use(createPinia())

import { defineStore } from'pinia'// useStore 可以是 useUser、useCart 之类的任何东西// 第一个参数是应用程序中 store 的唯一 idexportconst useStore = defineStore('main', {
 state: () => {
    return {
      // 所有这些属性都将自动推断其类型counter: 0,
    }
  },
  getters: {
    doubleCount: (state) => state.counter * 2,
  },
  actions: {
    increment() {
      this.counter++
    },
  },
})
```

使用
```
import { useStore } from'@/stores/counter'const store = useStore()
const { counter, doubleCount } = storeToRefs(store)
store.$reset() // 将状态 重置 到其初始值
store.counter++
store.$patch({
  counter: store.counter + 1,
})
store.$state = { counter: 666 }
pinia.state.value = {}
```

### 9. 路由传参

this.$router 相当于一个全局的路由器对象，包含了很多属性和对象（比如 history 对象），任何页面都可以调用其 push(), replace(), go() 等方法。

this.$route 表示当前路由对象，每一个路由都会有一个 route 对象，是一个局部的对象，可以获取对应的 name, path, params, query 等属性。

### 10. 全局变量

将属性挂载到window对象

window.appName = 'meta'// window['appName'] = 'meta'

### 11. 本地存储

LocalStorage / sessionStorage
