## 区别概括

- Vue2使用的是optionsAPI ，Vue3使用composition API，更好的组织代码，提高代码可维护性
- Vue3使用Proxy代理实现了新的响应式系统，比Vue2有着更好的性能和更准确的数据变化追踪能力。
- Vue3引入了Teleprot组件，可以将DOM元素渲染到DOM树的其他位置，用于创建模态框、弹出框等。
- Vue3全局API名称发生了变化，同时新增了watchEffect、Hooks等功能
- Vue3对TypeScript的支持更加友好
- Vue3核心库的依赖更少，减少打包体积
- 3支持更好的Tree Shanking，可以更加精确的按需要引入模块

## 使用上

1. 组合式api替换选项式api，方便逻辑更加的聚合
2. 一些细节的使用点改变

具体细节：

1，因为改成组合式api所以没有this

2，生命周期没有creat，setup等同于create，卸载改成unmount

3，vue3中v-if高于v-for的优先级

4，根实例的创建从new app变成了createApp方法

5，一些全局注册，比如mixin，注册全局组件，use改成了用app实例调用，而不是vue类调用

6，新增了传送门teleport组件

7，template模板可以不包在一个根div里

## 原理方面

- 响应式原理改成了用proxy，解决了数组无法通过下标修改，无法监听到对象属性的新增和删除的问题。也提升了响应式的效率
- 深入回答：vue3并不是完全抛弃了defineProperty，通过reactive定义的响应式数据使用proxy包装出来，而ref是直接new了一个class，一个新对象给入value，设置get set
- （组合式api的写法下，源码改成了函数式编程，方便按需引入）支持按需引入，可以更好tree-shaking，打包体积更小
- 性能优化，增加了静态节点标记。会标记静态节点，不对静态节点进行比对。从而增加效率

深入回答：文本内容为变量会标记为1，属性为动态会标记为2，如果静态则不标记跳过比对

## 进阶操作方面

- vue3不推荐使用minxin进行复用逻辑处理，而是推荐hook
- v-model应用于自定义组件时，监听的事件和传递的值改变（update:modelValue、modelValue）
- ts更好配合
