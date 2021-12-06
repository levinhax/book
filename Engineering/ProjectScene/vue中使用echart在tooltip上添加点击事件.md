# 产品需要在formatter中点击上面跳转到另一个页面，也就是在formatter中需要添加点击事件，网上其实有很多解决方法

## 问题

1. click函数并不执行
2. 在vue项目中click对应的函数找不到

### 问题一

问题1出现的原因是：css样式没有添加 pointer-events: all 这点很重要，很重要，很重要，重要的事情说三遍，因为没有添加 pointer-events: all 所以监听不到事件

### 问题二

formatter中定义的函数，跟Vue不在一个作用域下，也就是在vue中methods中写的方法，没法执行

#### 解决方案1

在vue项目中找到index.html文件，然后在 script 标签中写入刚才在formatter上绑定的函数，而且绑定函数不能用@click写，要用onclick写，用js的方式写绑定，因为formatter的作用域不是vue的作用域，用@click监听不到

```
tooltip: {
  triggerOn: 'none', // 关闭默认的mouseover调用
  trigger: 'axis',
  enterable: true, // 鼠标可进入提示框浮层中
  formatter: params => {
    const { marker, name, value, seriesName } = params[0]
    return `<div style="pointer-events: all;" onclick="handleClick">>
      <p>当前项: ${name}</p>
      <p>${marker} ${seriesName}: ${value}</p>
      <p><a href="https://www.baidu.com/">前往百度</a></p>
    </div>`
  },
},
```

```
// index.html

function handleClick() {
  console("监听到tooltip点击事件")
}
```

#### 解决方案2

如上，直接使用a标签实现跳转

#### 解决方案3

最近再搞离线地图模块，同样遇到了这样的问题，在地图上的标记弹框中的事件无法监听到，解决方法是用Vue.extend()

```
import Vue from 'vue'

methods : {
getHtmlComponent() {
        const infoContent = `<span onclick="myClick">这是显示的文本</span>`
        const MyComponent = Vue.extend({
          template: infoContent,
          methods: {
            myClick: function() {
              console.log('点击事件监听到')
            }
          }
        })
        var component = new MyComponent().$mount()
        return component
}
}

tooltip : {
    triggerOn: 'click',   //触发方式
    enterable: true, // 鼠标可移入tooltip中
    formatter:(params)=> {
      const component = this.getHtmlComponent()
      return component 
    }
}
```
