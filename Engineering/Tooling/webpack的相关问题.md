### 什么是Webpack的热更新（Hot Module Replacement）

Webpack的热更新（Hot Module Replacement，简称HMR），**在不刷新页面的前提下，将新代码替换掉旧代码**。

HRM的原理实际上是 webpack-dev-server（WDS）和浏览器之间维护了一个websocket服务。当本地资源发生变化后，webpack会先将打包生成新的模块代码放入内存中，然后WDS向浏览器推送更新，并附带上构建时的hash，让客户端和上一次资源进行对比。客户端对比出差异后会向WDS发起Ajax请求获取到更改后的内容（文件列表、hash），通过这些信息再向WDS发起jsonp请求获取到最新的模块代码。

### Loader和Plugin的区别

功能不同：

- Loader本质是一个函数，它是一个转换器。webpack只能解析原生js文件，对于其他类型文件就需要用loader进行转换。
- Plugin它是一个插件，用于增强webpack功能。webpack在运行的生命周期中会广播出许多事件，Plugin 可以监听这些事件，在合适的时机通过 webpack 提供的 API 改变输出结果。

用法不同：

- Loader的配置是在module.rules下进行。类型为数组，每⼀项都是⼀个 Object ，⾥⾯描述了对于什么类型的⽂件（ test ），使⽤什么加载( loader )和使⽤的参数（ options ）
- Plugin的配置在plugins下。类型为数组，每一项是一个 Plugin 的实例，参数都通过构造函数传入。

### bundle，chunk，module是什么

- bundle 捆绑包： 它是构建过程的最终产物，由说有需要的chunk和module组成。
- chunk 代码块：一个chunk由多个模块组合而成，用于代码的合并和分割，在构建过程中一起被打包到一个文件中。
- module 模块：是代码的基本单位，可以是一个文件、一个组件、一个库等。在编译的时候会从entry中递归寻找出所有依赖的模块。

### 什么是Code Splitting

Code Splitting代码分割，是一种优化技术。它允许将一个大的chunk拆分成多个小的chunk，从而实现按需加载，减少初始加载时间，并提高应用程序的性能。

通常Webopack会将所有代码打包到一个单独的bundle中，然后在页面加载时一次性加载整个bundle。这样的做法可能导致初始加载时间过长，尤其是在大型应用程序中，因为用户需要等待所有代码加载完成才能访问应用程序。

Code Splitting 解决了这个问题，它将应用程序的代码划分为多个代码块，每个代码块代表不同的功能或路由。这些代码块可以在需要时被动态加载，使得页面只加载当前所需的功能，而不必等待整个应用程序的所有代码加载完毕。

在Webpack中通过optimization.splitChunks配置项来开启代码分割。

### Webpack的Source Map是什么？如何配置生成Source Map？

Source Map是一种文件，它建立了构建后的代码与原始源代码之间的映射关系。通常在开发阶段开启，用来调试代码，帮助找到代码问题所在。

可以在Webpack配置文件中的devtool选项中指定devtool: 'source-map'来开启。

### Webpack的Tree Shaking原理

Tree Shaking 也叫摇树优化，是一种通过移除多于代码，从而减小最终生成的代码体积，生产环境默认开启。

原理：

ES6 模块系统：Tree Shaking的基础是ES6模块系统，它具有静态特性，意味着模块的导入和导出关系在编译时就已经确定，不会受到程序运行时的影响。

静态分析：在Webpack构建过程中，Webpack会通过静态分析依赖图，从入口文件开始，逐级追踪每个模块的依赖关系，以及模块之间的导入和导出关系。

标记未使用代码： 在分析模块依赖时，Webpack会标记每个变量、函数、类和导入，以确定它们是否被实际使用。如果一个导入的模块只是被导入而没有被使用，或者某个模块的部分代码没有被使用，Webpack会将这些未使用的部分标记为"unused"。

删除未使用代码: 在代码标记为未使用后，Webpack会在最终的代码生成阶段，通过工具（如UglifyJS等）删除这些未使用的代码。这包括未使用的模块、函数、变量和导入。

### 如何提高webpack的打包速度

- 利用缓存：利用Webpack的持久缓存功能，避免重复构建没有变化的代码。可以使用cache: true选项启用缓存。
- 使用多进程/多线程构建 ：使用thread-loader、happypack等插件可以将构建过程分解为多个进程或线程，从而利用多核处理器加速构建。
- 使用DllPlugin和HardSourceWebpackPlugin： DllPlugin可以将第三方库预先打包成单独的文件，减少构建时间。HardSourceWebpackPlugin可以缓存中间文件，加速后续构建过程。
- 使用Tree Shaking: 配置Webpack的Tree Shaking机制，去除未使用的代码，减小生成的文件体积
- 移除不必要的插件: 移除不必要的插件和配置，避免不必要的复杂性和性能开销。

### 如何减少打包后的代码体积

- 代码分割（Code Splitting）：将应用程序的代码划分为多个代码块，按需加载。这可以减小初始加载的体积，使页面更快加载。
- Tree Shaking：配置Webpack的Tree Shaking机制，去除未使用的代码。这可以从模块中移除那些在项目中没有被引用到的部分。
- 压缩代码：使用工具如UglifyJS或Terser来压缩JavaScript代码。这会删除空格、注释和不必要的代码，减小文件体积。
- 使用生产模式：在Webpack中使用生产模式，通过设置mode: 'production'来启用优化。这会自动应用一系列性能优化策略，包括代码压缩和Tree Shaking。
- 使用压缩工具：使用现代的压缩工具，如Brotli和Gzip，来对静态资源进行压缩，从而减小传输体积。
- 利用CDN加速：将项目中引用的静态资源路径修改为CDN上的路径，减少图片、字体等静态资源等打包。

### vite比webpack快在哪里

他们都是前端构建工具，但vite构建速度相对于webpack还是有一些速度优势

- 冷启动速度：vite是利用浏览器的原生ES moudle，采用按需加载的当时，而不是将整个项目打包。而webpack是将整个项目打包成一个或多个bundle，构建过程复杂。
- HMR热更新： vite使用浏览器内置的ES模块功能，使得在开发模式下的热模块替换更加高效，那个文件更新就加载那个文件。它通过WebSocket在模块级别上进行实时更新，而不是像Webpack那样在热更新时重新加载整个包。
- 构建速度： 在生产环境下，Vite的构建速度也通常比Webpack快，因为Vite的按需加载策略避免了将所有代码打包到一个大文件中。而且，Vite对于缓存、预构建等方面的优化也有助于减少构建时间。
- 缓存策略： Vite利用浏览器的缓存机制，将依赖的模块存储在浏览器中，避免重复加载。这使得页面之间的切换更加迅速。
- 不需要预编译： Vite不需要预编译或生成中间文件，因此不会产生大量的临时文件，减少了文件IO操作，进一步提升了速度。
