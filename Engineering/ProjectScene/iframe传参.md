## window.postMessage

window.postMessage() 方法可以安全地实现跨源通信。

```
otherWindow.postMessage(message, targetOrigin, [transfer]);
```

## iframe父子页面交互传值

iframe页面调用子页面方法
```
iframe.contentWindow.子页面方法();
```

子页面调用iframe页面方法
```
window.parent.父页面方法();
```

iframe向子页面传值
```
// 父页面传值
iframe.contentWindow.postMessage(data, 'http://localhost:8000/');

// 子页面接收
window.addEventListener ('message', function(event) {
  // event.data获取传过来的数据
  console.log(event.data)
});
```

子页面向iframe传值
```
// 子页面传值
window.parent.postMessage(data, 'http://localhost:8000/');

// 父页面接收
window.addEventListener('message', function(e){
  console.log(e.data)
}, false);
```

## 示例

*微前端里应用加载与iframe.onload存在先后关系，因此先在微前端加载完后向parent发送消息，然后parent应用在接收到消息后向微前端推送要传递的信息*

### 父文件

```
<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <iframe
      id="mainIframe"
      ref="mainIframe"
      name="mainIframe"
      src="http://10.20.49.160:8000/"
      frameborder="10"
      width="100%"
      height="640"
    ></iframe>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  mounted() {
    this.setIframe();
  },
  methods: {
    async setIframe() {
      const mainFrame = this.$refs["mainIframe"];
      mainFrame.onload = () => {
        // const iframeWin = mainFrame.contentWindow;
        // iframeWin.postMessage(PAGESOURCE, "*");
        // iframeWin.postMessage(PAGESOURCE, "http://10.20.49.160:9000/");

        window.addEventListener("message", (event) => {
          console.log("iframe页面传递的值: ", event.data);
          if (e.data === "SORT COMPLETED") {
            console.log("可以传递信息");
            this.changeData();
          }
        });
      };
    },
    async changeData() {
      let PAGESOURCE = {
        iframe: true,
        origin: "https://ip:port",
        source: "DSC",
      };
      const mainFrame = this.$refs["mainIframe"];
      mainFrame.contentWindow.postMessage(PAGESOURCE, "*");
    },
  },
};
</script>
```

### 子文件

```
<template>
  <div id="app">
    <h3>子文件</h3>
  </div>
</template>

<script>

export default {
  name: 'App',
  data() {
    return {
      data_IsScreenView: true,
    };
  },
  async mounted() {
    window.parent.postMessage('SORT COMPLETED', '*');
    this.getParentIframeData();
  },
  methods: {
    // 判断是否嵌入平台
    getParentIframeData() {
      console.log('getParentIframeData');
      window.addEventListener('message', (event) => {
        // console.log(messageEvent.source, window.parent);
        // if (messageEvent.source != window.parent) return;
        if (event.data?.iframe) {
          this.data_IsScreenView = true;
        }
      });
    },
  },
};
</script>
```
