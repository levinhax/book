### uniapp与vue和微信小程序的异同点

Uni-app就是用着vue的指令和小程序的组件和API

### 项目结构

- pages.json 微信小程序的配置文件，用于配置导航部分、tabbar、路由部分
- manifest.json 配置appid、logo、地图sdk等等；
- main.js vue项目的入口文件；
- App.vue 全局的公共css样式，事件监听（比如上来就要登录）；
- static 静态资源文件夹，放图片、字体图标
- pages 页面文件夹，放的都是路由页面
- components 组件文件夹，放的是在各个页面都可以公用的组件
- common 全局的css文件样式，比如主题色，间距

### Uniapp 应用的生命周期、页面的生命周期、组件的生命周期

#### 应用的生命周期

1. onLaunch——当uni-app 初始化完成时触发（全局只触发一次）
2. onShow——当 uni-app 启动，或从后台进入前台显示
3. onHide——当 uni-app 从前台进入后台
4. onError——当 uni-app 报错时触发
5. onUniNViewMessage——对 nvue 页面发送的数据进行监听，可参考 nvue 向 vue 通讯
6. onUnhandledRejection——对未处理的 Promise 拒绝事件监听函数（2.8.1+）
7. onPageNotFound——页面不存在监听函数
8. onThemeChange——监听系统主题变化

#### 页面的生命周期

1. onInit——监听页面初始化，其参数同 onLoad 参数，为上个页面传递的数据，参数类型为 Object（用于页面传参），触发时机早于 onLoad
2. onLoad——监听页面加载，其参数为上个页面传递的数据，参数类型为 Object（用于页面传参），参考示例
3. onShow——监听页面显示。页面每次出现在屏幕上都触发，包括从下级页面点返回露出当前页面
4. onReady——监听页面初次渲染完成。注意如果渲染速度快，会在页面进入动画完成前触发
5. onHide——监听页面隐藏
6. onUnload——监听页面卸载
7. onResize——监听窗口尺寸变化

#### 组件的生命周期

uni-app 组件支持的生命周期，与vue标准组件的生命周期相同

1. beforeCreate——在实例初始化之后被调用。
2. created——在实例创建完成后被立即调用。
3. beforeMount——在挂载开始之前被调用。
4. mounted——挂载到实例上去之后调用。详见 注意：此处并不能确定子组件被全部挂载，如果需要子组件完全挂载之后在执行操作可以使用$nextTickVue官方文档
5. beforeUpdate——数据更新时调用，发生在虚拟 DOM 打补丁之前。
6. updated——由于数据更改导致的虚拟 DOM 重新渲染和打补丁，在这之后会调用该钩子。
7. beforeDestroy——实例销毁之前调用。在这一步，实例仍然完全可用。
8. destroyed——Vue 实例销毁后调用。调用后，Vue 实例指示的所有东西都会解绑定，所有的事件监听器会被移除，所有的子实例也会被销毁。

### 本地缓存

同步存储：uni.setStorageSync，获取：uni.getStorageSync

异步存储：uni.setStorage，获取：uni.getStorage

### 页面通讯

uni.$emit(eventName,OBJECT) 触发全局的自定义事件，附加参数都会传给监听器回调函数
uni.$on(eventName,callback) 监听全局的自定义事件，事件由 uni.$emit 触发，回调函数会接收事件触发函数的传入参数。

```
uni.$emit('update',{msg:'页面更新'})

uni.$on('update',function(data){
    console.log('监听到事件来自 update ，携带参数 msg 为：' + data.msg);
})
```

### 路由跳转及传参

uniapp中的路由全部在pages.json中自动配置好了，路由函数中的url直接写文件路径即可，不过需要注意url不能写项目路径(比如@/pages/index)，只能写相对路径(比如../search/search)。传参也只要直接在路径后面用=的方式连接参数即可。

- uni.navigateTo({url: '../search/search?id=1'})，最常用的路由跳转函数
- uni.redirectTo({url: '../search/search?id=1'})，这个方法会关闭当前页面，然后再跳转到目标页面，用这种方式不会出现后退的按钮
- uni.switchTab({url: '../shopcart/shopcart'})，这个函数可以切换tab，上面两个都不可以。

### 转发分享到第三方

使用官方提供的uni.share方法可以分享到其他平台，需要传provider，imageUrl，title等参数

### 使用第三方账号登录

比如使用qq或者微信账号登录，使用官方提供的uni.login方法即可，另外需要配合uni.getUserInfo()方法，获取到用户在该平台的信息(比如昵称，头像等)

```
uni.login({
  provider: 'qq',
  success: (res) => {
    // 最重要的就是这个openid，需要传递给后端
    const openId = res.authResult.openId;
    uni.getUserInfo({
      provider: mode,
      success: (userInfo) => {
        console.log(userInfo);
      },
    });
    console.log(res);
  },
});
```
