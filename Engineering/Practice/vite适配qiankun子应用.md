# vite适配qiankun子应用

创建我们的子应用:
```
npm init vite@latest qiankun-micro-react-vite -- --template react-ts
```

因为构建工具是vite2，vite的script标签中有type="module", qiankun的依赖之一import-html-entry暂不支持这个属性，这里我使用了一个第三方依赖包，在终端执行：
```
yarn add vite-plugin-qiankun path --dev
```

[vite-plugin-qiankun](https://github.com/tengmaoqing/vite-plugin-qiankun)

1. 在vite.config.ts中，加入如下代码:

```
import { UserConfig } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import qiankun from 'vite-plugin-qiankun'

// useDevMode 开启时与热更新插件冲突,使用变量切换
const useDevMode = true

const baseConfig: UserConfig = {
  plugins: [
    // react(),
    ...(
      useDevMode ? [] : [
        react()
      ]
    ),
    // 这里的 'MICRO3_React_APP_VITE' 是子应用名，主应用注册时AppName需保持一致
    // useDevMode = true 则不使用热更新插件，useDevMode = false 则能使用热更新，但无法作为子应用加载。
    qiankun('MICRO3_React_APP_VITE', { useDevMode }),
  ],
  server: {
    port: 9003,
    // open: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/api/test': {
        changeOrigin: true,
        target: 'http://10.11.32.173:8080/',
        rewrite: (path) => path.replace(/^\/api\/test/, '')
      }
    }
  },
}

export default defineConfig(({ command, mode }) => {
  // console.log('command, mode: ', command, mode)
  // if (command === 'serve') {
  //   return {
  //     // serve 独有配置
  //   }
  // } else {
  //   return {
  //     // build 独有配置
  //   }
  // }

  baseConfig.base = 'http://127.0.0.1:9003/';
  if (mode === 'development') {
    baseConfig.base = '/';
  }
  return baseConfig;
})
```

2. 在入口文件里面写入乾坤的生命周期配置

main.tsx
```
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

// vite-plugin-qiankun helper
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'

function render(props: any) {
  console.log('------ React 子应用渲染 ------')
  console.log(props)

  const { container } = props
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    container ? container.querySelector('#root') : document.getElementById('root')
  )
}

renderWithQiankun({
  mount(props) {
    console.log('[react17] vite react app mount')
    render(props)
  },
  bootstrap() {
    console.log('[react17] vite react app bootstrap')
  },
  unmount(props: any) {
    console.log('[react17] vite react app unmount')
    const { container } = props
    const mountRoot = container?.querySelector('#root')
    ReactDOM.unmountComponentAtNode(mountRoot || document.querySelector('#root'))
  },
})

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  console.log('子应用单独运行')
  render({})
}
```

App.tsx
```
import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import './styles/index.css'

import Home from './views/Home'
const About = lazy(() => import('./views/About'))

const RouteEle = () => {
  return (
    <Router basename={qiankunWindow.__POWERED_BY_QIANKUN__ ? '/micro3' : '/'}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

function App() {
  return (
    <div className="App">
      <RouteEle />
    </div>
  )
}

export default App
```

其它使用注意点 qiankunWindow:

因为es模块加载与qiankun的实现方式有些冲突，所以使用本插件实现的qiankun微应用里面没有运行在js沙盒中。所以在不可避免需要设置window上的属性时，尽量显示的操作js沙盒，否则可能会对其它子应用产生副作用。qiankun沙盒使用方式
```
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';

qiankunWindow.customxxx = 'ssss'

if (qiankunWindow.__POWERED_BY_QIANKUN__) {
  console.log('我正在作为子应用运行')
}
```
