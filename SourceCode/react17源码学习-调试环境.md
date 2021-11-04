# 前言

通过源码的学习，你可以提升项目中排查 bug 的能力、更好的理解 react 的工作过程和工作模式、提升数据结构和算法设计的能力，以及最重要的：提升面试竞争力。

本系列的源码解析的 react 版本是 [v 17.0.2](https://github.com/facebook/react/releases/tag/v17.0.2)

# 调试环境搭建

## 创建项目

首先创建一个 react 项目
```
npx create-react-app debug-react // 官方脚手架

// npm init vite@latest debug-react -- --template react
// yarn create vite debug-react --template react
```

## 暴露 webpack 配置

我们后续想要对通过直接引入 react 源码替代 node_modules 中的 react 包，需要修改 webpack，在 debug-react 目录下执行以下命令暴露 webpack 配置：
```
cd ./debug-react
yarn eject
```

## 引入 react 源码及修改 webpack

由于 node_modules 中的 react 包是打包好之后的文件，许多代码掺杂在一个文件中，不便于我们对源码进行调试。因此在 debug-react 目录下新建 lib 目录引入 react 的源码：
```
git clone https://github.com/facebook/react.git -b 17.0.2
```

并在刚刚引入的 lib/react 目录下执行一下命令安装依赖：
```
yarn install
```

然后我们修改 webpack 的配置，使得在代码中引入的 react 等 npm 包的指向由 node_modules 改为刚刚引入的源码。在 config/webpack.config.js 下新增如下几个包的引用：
```
// ...
module.exports = {
    // ...
    resolve: {
        alias: {
        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        'react-native': 'react-native-web',
        // Allows for better profiling with ReactDevTools
        ...(isEnvProductionProfile && {
          'react-dom$': 'react-dom/profiling',
          'scheduler/tracing': 'scheduler/tracing-profiling',
        }),
        ...(modules.webpackAliases || {}),
+       'react': path.resolve(__dirname, '../src/react/packages/react'),
+       'react-dom': path.resolve(__dirname, '../src/react/packages/react-dom'),
+       'shared': path.resolve(__dirname, '../src/react/packages/shared'),
+       'react-reconciler': path.resolve(__dirname, '../src/react/packages/react-reconciler'),
      },
    }
}
```

## 修改环境变量

我们将 __DEV__ 等环境变量默认启用，便于开发调试，修改 config/env.js：
```
// ...
function getClientEnvironment(publicUrl) {
  // ...
  const stringified = {
+   __DEV__: true,
+   __PROFILE__: true,
+   __UMD__: true,
+   __EXPERIMENTAL__: true,
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };

  return { raw, stringified };
}
```

在 debug-react 的根目录下创建 .eslintrc.json 文件，内容如下：
```
{
  "extends": "react-app",
  "globals": {
    "__DEV__": true,
    "__PROFILE__": true,
    "__UMD__": true,
    "__EXPERIMENTAL__": true
  }
}
```

## 解决一系列报错

上面的环境配置好之后，通过 yarn start 启动会出现一系列的报错问题，因为 react 中某些遍历是在打包时根据环境注入生成的，我们现在要直接调试源码，不进行 react 的打包，所以要解决这些报错。

### 添加 ReactFiberHostConfig 引用

如下报错
```
Attempted import error: 'afterActiveInstanceBlur' is not exported from './ReactFiberHostConfig'.
```

直接修改 src/react/packages/react-reconciler/src/ReactFiberHostConfig.js 的内容如下：
```
- import invariant from 'shared/invariant';
- invariant(false, 'This module must be shimmed by a specific renderer.');

+ export * from './forks/ReactFiberHostConfig.dom'
```

另外修改 src/react/packages/shared/ReactSharedInternals.js，直接从引入 ReactSharedInternals 并导出：
```
- import * as React from 'react';
- const ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

+ import ReactSharedInternals from '../react/src/ReactSharedInternals';
```

### 修改 react 引用方式

如下报错
```
Attempted import error: 'react' does not contain a default export (imported actFiberHosts 'React').
```

修改 src/index.js 中 react 和 react-dom 的引入方式：
```
- import React from 'react';
- import ReactDOM from 'react-dom';
+ import * as React from 'react';
+ import * as ReactDOM from 'react-dom';
```

### 修改 inveriant

如下报错
```
Error: Internal React error: invariant() is meant to be replaced at compile time. There is no runtime version.
```

修改 src/react/packages/shared/invariant.js 的内容：
```
export default function invariant(condition, format, a, b, c, d, e, f) {
+ if (condition) {
+   return;
+ }
  throw new Error(
    'Internal React error: invariant() is meant to be replaced at compile ' +
      'time. There is no runtime version.',
  );
}
```

### 解决 eslint 报错

诸如：
```
Failed to load config "fbjs" to extend from.
```

eslint 报错的内容实在太多了，我这里直接简单粗暴的将 webpack 中 eslint 插件给关掉，修改 src/config/webpack.config.js 文件：
```
module.exports = {
  // ...
  plugins: [
    // ...
-   !disableESLintPlugin &&
-   new ESLintPlugin({
-   // Plugin options
-     extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
-     formatter: require.resolve('react-dev-utils/eslintFormatter'),
-       eslintPath: require.resolve('eslint'),
-     failOnError: !(isEnvDevelopment && emitErrorsAsWarnings),
-     context: paths.appSrc,
-     cache: true,
-     cacheLocation: path.resolve(
-       paths.appNodeModules,
-       '.cache/.eslintcache'
-     ),
-     // ESLint class options
-     cwd: paths.appPath,
-     resolvePluginsRelativeTo: __dirname,
-     baseConfig: {
-       extends: [require.resolve('eslint-config-react-app/base')],
-       rules: {
-          ...(!hasJsxRuntime && {
-          'react/react-in-jsx-scope': 'error',
-       }),
-     },
-   },
-   }),
  ]
}
```

# 使用yarn link调试源码

克隆 React 项目后，执行 yarn 来获取依赖。

我们建议运行 yarn test（或上述命令）以确保你的代码没有引入回归，不管怎样，这有助于尝试你的 React 构建版本。

首先，运行 yarn build，这会于 build 文件夹中生成预先构建的 bundle，还会于 build/packages 中生成 npm 包。

```
cd ~/path_to_your_react_clone/
# yarn build react/index,react/jsx,react-dom/index,scheduler --type=NODE
npm run build react/index,react/jsx,react-dom/index,scheduler --type=NODE

cd build/node_modules/react
# yarn link
npm link
cd build/node_modules/react-dom
# yarn link
npm link

cd ~/path/to/your/project
# yarn link react react-dom
npm link react react-dom
```

每当你在项目文件夹下运行 yarn build，更新版本会出现在 node_modules 文件夹，之后可以重新构建项目来测试更改。

如果依然缺少某些 package（例如，可能在项目中使用到 react-dom/server），则应始终执行 yarn build 进行完整构建。请注意，不带选项运行 yarn build 会耗费很长时间。

* yarn命令如果有问题可改为npm *

**最后使用 yarn unlink react 移除链接， 移除后需要重新安装该库。**

## 开始调试

1. 打开我们clone的项目
2. 找到想要调试的地方

如: packages/react-dom/src/client/ReactDOMLegacy.js
```
export function render(
  element: React$Element<any>,
  container: Container,
  callback: ?Function,
) {
  console.log('react v17.0.2 debug --> render');
  if (__DEV__) {
    console.error(
      'ReactDOM.render is no longer supported in React 18. Use createRoot ' +
        'instead. Until you switch to the new API, your app will behave as ' +
        "if it's running React 17. Learn " +
        'more: https://reactjs.org/link/switch-to-createroot',
    );
  }

  if (!isValidContainerLegacy(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  if (__DEV__) {
    const isModernRoot =
      isContainerMarkedAsRoot(container) &&
      container._reactRootContainer === undefined;
    if (isModernRoot) {
      console.error(
        'You are calling ReactDOM.render() on a container that was previously ' +
          'passed to ReactDOM.createRoot(). This is not supported. ' +
          'Did you mean to call root.render(element)?',
      );
    }
  }
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    false,
    callback,
  );
}
```

3. 运行yarn build react/index,react/jsx,react-dom/index,scheduler --type=NODE (npm run build react/index,react/jsx,react-dom/index,scheduler --type=NODE)重新打包
4. 打开我们创建的React项目
5. yarn start
6. 查看控制台

**每次修改源代码都需要:**

1. 运行 yarn build react/index,react/jsx,react-dom/index,scheduler --type=NODE (npm run build react/index,react/jsx,react-dom/index,scheduler --type=NODE) 重新打包
2. 刷新页面

# 总结

至此，我们的调试环境就搭建完成了，可以在 react 源码中通过 debugger 打断点或者 console.log() 输出日志进行愉快地调试了！
