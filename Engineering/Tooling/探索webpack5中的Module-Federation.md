# Module Federation 是什么？

多个独立的构建可以组成一个应用程序，这些独立的构建之间不应该存在依赖关系，因此可以单独开发和部署它们。

Module federation 使 JavaScript 应用得以从另一个 JavaScript 应用中动态地加载代码，帮我们解决了模块共享的问题。

它不仅仅是微前端，而且场景粒度可以更加细，一般微前端更多的是应用级别，但它更偏向模块级别的共享

# 基础概念

我们区分本地模块(Host, 消费模块的一方)和远程模块(Remote, 提供模块的一方)。

加载远程模块被认为是异步操作。当使用远程模块时，这些异步操作将被放置在远程模块和入口之间的下一个 chunk 的加载操作中。如果没有 chunk 加载操作，就不能使用远程模块。

容器是由容器入口创建的，该入口暴露了对特定模块的异步访问。暴露的访问分为两个步骤：

1. 加载模块（异步的）
2. 执行模块（同步的）

步骤 1 将在 chunk 加载期间完成。步骤 2 将在与其他（本地和远程）的模块交错执行期间完成。这样一来，执行顺序不受模块从本地转换为远程或从远程转为本地的影响。

每个应用都既可以作为 host，也可以作为 remote，还可以相互引用。

# Module Federation 配置

## 配置项

- name: 必须且唯一
- filename: 若没有提供 filename，那么构建生成的文件名与容器名称同名
- remotes: 可选，作为引用方最关键的配置项，用于声明需要引用的远程资源包的名称与模块名称，作为 Host 时，去消费哪些 Remote
- exposes: 可选，表示作为 Remote 时，export 哪些属性被消费
- library: 可选,定义了 remote 应用如何将输出内容暴露给 host 应用。配置项的值是一个对象，如 { type: 'xxx', name: 'xxx'}
- shared，可选,指示 remote 应用的输出内容和 host 应用可以共用哪些依赖。 shared 要想生效，则 host 应用和 remote 应用的 shared 配置的依赖要一致；配置了这个属性，webpack在加载的时候会先判断本地应用是否存在对应的包，如果不存在，则加载远程应用的依赖包
  - Singleton: 是否开启单例模式。默认值为 false，开启后remote 应用组件和 host 应用共享的依赖只加载一次，而且是两者中版本比较高的
  - requiredVersion：指定共享依赖的版本，默认值为当前应用的依赖版本
  - eager：共享依赖在打包过程中是否被分离为 async chunk。设置为 true， 共享依赖会打包到 main、remoteEntry，不会被分离，因此当设置为true时共享依赖是没有意义的

## Remote应用

```
const ModuleFederationPlugin = require('webpack').container.ModuleFederationPlugin;

plugins: [
  new ModuleFederationPlugin({
    name: 'app_remote',
    filename: 'remoteEntry.js',
    exposes: {
      './HelloWorld.vue': './src/components/HelloWorld.vue',
      './AboutView.vue': './src/views/AboutView.vue',
    },
    shared: {
      vue: {
        singleton: true,
      },
    },
  }),
]
```

## Host应用

```
const ModuleFederationPlugin = require('webpack').container.ModuleFederationPlugin;

plugins: [
  new ModuleFederationPlugin({
    name: 'app_host',
    filename: 'remoteEntry.js',
    remotes: {
      app_remote: 'app_remote@http://localhost:8002/remoteEntry.js',
    },
    shared: {
      vue: {
        singleton: true,
      },
    },
  }),
]
```

```
<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
const isLoadingComponent = ref(true);
const HelloWorld = defineAsyncComponent(() => import('app_remote/HelloWorld.vue')
  .finally(() => {
    isLoadingComponent.value = false;
  }));
</script>
```

```
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('app_remote/AboutView.vue'),
  },
];
```
