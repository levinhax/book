## 前言

Vue中的一些常见的功能在React中的实现

### v-if

v-if 指令用于条件性地渲染一块内容。这块内容只会在指令的表达式返回 truthy 值的时候被渲染。

v-if是“真正”的条件渲染，切换过程中条件块内的事件监听器和子组件会适当地被销毁和重建；同时又是惰性的，如果在初始渲染条件为假，则什么也不做直到第一次条件变真时，才会开始渲染。而v-show只是css样式上的控制。

**Vue**

```
<template>
  <div class="app-container">
    <button @click="handleToggleShow">切换</button>
    <div v-if="data_Show">这里是内容区域</div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      data_Show: false,
    };
  },
  methods: {
    handleToggleShow() {
      this.data_Show = !this.data_Show;
    },
  },
};
</script>
```

**React**

```
import { useState } from "react";
import "./App.css";

function App() {
  const [isShow, setIsShow] = useState(false);

  const handleToggleShow = () => {
    setIsShow(!isShow);
  };

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={handleToggleShow}>切换</button>
        {isShow && <div>这里是内容区域</div>}
        {isShow ? <div>这里是内容区域</div> : null}
      </header>
    </div>
  );
}

export default App;
```

### v-show

**Vue**

```
<template>
  <div class="app-container">
    <button @click="handleToggleShow">切换</button>
    <div v-show="data_Show">这里是内容区域</div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      data_Show: false,
    };
  },
  methods: {
    handleToggleShow() {
      this.data_Show = !this.data_Show;
    },
  },
};
</script>
```

**React**

```
import { useState } from "react";
import "./App.css";

function App() {
  const [isShow, setIsShow] = useState(false);

  const handleToggleShow = () => {
    setIsShow(!isShow);
  };

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={handleToggleShow}>切换</button>
        {<div style={{ display: isShow ? "" : "none" }}>这里是内容区域</div>}
      </header>
    </div>
  );
}

export default App;
```

### v-for

v-for 指令需要使用 item in items 形式的特殊语法，其中 items 是源数据数组，而 item 则是被迭代的数组元素的别名。

**Vue**

```
<template>
  <div class="app-container">
    <div v-for="item in data_List" :key="item.id">
      {{ item.name }}
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      data_List: [
        {
          id: 1,
          name: "北京",
        },
        {
          id: 2,
          name: "上海",
        },
        {
          id: 3,
          name: "广州",
        },
        {
          id: 4,
          name: "深圳",
        },
      ],
    };
  },
};
</script>
```

**React**

```
import { useState } from "react";
import "./App.css";

function App() {
  const [list] = useState([
    {
      id: 1,
      name: "北京",
    },
    {
      id: 2,
      name: "上海",
    },
    {
      id: 3,
      name: "广州",
    },
    {
      id: 4,
      name: "深圳",
    },
  ]);

  const renderToList = list.map((item) => {
    return (
      <div className="v-for-item" key={item.id}>
        {item.name}
      </div>
    );
  });

  return (
    <div className="App">
      <header className="App-header">
        {/* {list.map((item) => {
          return (
            <div className="v-for-item" key={item.id}>
              {item.name}
            </div>
          );
        })} */}

        {renderToList}
      </header>
    </div>
  );
}

export default App;
```

### computed

通常用计算属性来处理复杂逻辑。

**Vue**

```
<template>
  <div class="app-container">
    <button @click="handleAdd">增加</button>
    <div>计算结果: {{ cpd_Num }}</div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      data_Num1: 10,
      data_Num2: 8,
    };
  },
  computed: {
    cpd_Num() {
      return this.data_Num1 + this.data_Num2;
    },
  },
  methods: {
    handleAdd() {
      this.data_Num2++;
    },
  },
};
</script>
```

**React**

```
import { useState, useMemo } from "react";
import "./App.css";

function App() {
  const [num1, setNum1] = useState(10);
  const [num2, setNum2] = useState(8);

  const num3 = useMemo(
    (a, b) => {
      return num1 + num2;
    },
    [num1, num2]
  );

  const handleAdd = () => {
    setNum2(num2 + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={handleAdd}>增加</button>
        <div>计算结果：{num3}</div>
      </header>
    </div>
  );
}

export default App;
```

### watch

**Vue**

```
<template>
  <div class="app-container">
    <input v-model="data_Input" />
    <div>{{ cpd_Result }}</div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      data_Fetching: false,
      data_Input: "",
    };
  },
  computed: {
    cpd_Result() {
      return this.data_Fetching
        ? "请求中"
        : `请求结果：${this.data_Input || "~"}`;
    },
  },
  watch: {
    data_Input(newVal) {
      console.log("watch dataInput: ", newVal);
      this.handleFetch();
    },
  },
  methods: {
    handleFetch() {
      if (!this.data_Fetching) {
        this.data_Fetching = true;

        setTimeout(() => {
          this.data_Fetching = false;
        }, 1000);
      }
    },
  },
};
</script>
```

**React**

```
import { useState, useEffect, useMemo } from "react";
import "./App.css";

function App() {
  const [value, setValue] = useState("react");
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetch();
  }, [value]);

  const result = useMemo(() => {
    return fetching ? "请求中" : `请求结果： ${value || "~"}`;
  }, [fetching]);

  const fetch = () => {
    if (!fetching) {
      setFetching(true);

      setTimeout(() => {
        setFetching(false);
      }, 1000);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <input
          defaultValue={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div>{result}</div>
      </header>
    </div>
  );
}

export default App;
```

### style

CSS property 名可以用驼峰式 (camelCase) 或短横线分隔 (kebab-case，记得用引号括起来) 来命名

1. Vue可以通过数组语法绑定多个样式对象，React主要是单个对象的形式
2. React 会自动添加 ”px”(这点Vue不会自动处理) 后缀到内联样式为数字的属性，其他单位手动需要手动指定
3. React样式不会自动补齐前缀。如需支持旧版浏览器，需手动补充对应的样式属性。Vue中当 v-bind:style 使用需要添加浏览器引擎前缀的 CSS property 时，如 transform，Vue.js 会自动侦测并添加相应的前缀。

**Vue**

```
<template>
  <div class="app-container">
    <div v-bind:style="{ color: activeColor, fontSize: fontSize + 'px' }">
      这是一段文字
    </div>
    <div v-bind:style="styleObject">这是一段文字</div>
    <div v-bind:style="[baseStyles, overridingStyles]">这是一段文字</div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      activeColor: "#f00",
      fontSize: 16,
      styleObject: {
        color: "red",
        fontSize: "14px",
      },
      baseStyles: {
        color: "green",
      },
      overridingStyles: {
        fontSize: "20px",
      },
    };
  },
};
</script>
```

**React**

```
import { useState } from "react";
import "./App.css";

function App() {
  const [text] = useState("这是一段文字");
  const baseStyles = {
    color: "green",
  };
  const overridingStyles = {
    fontSize: "20px",
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ ...baseStyles, ...overridingStyles }}>{text}</div>
      </header>
    </div>
  );
}

export default App;
```

### class

**Vue**

```
<template>
  <div class="app-container">
    <div
      class="static"
      v-bind:class="{ active: isActive, 'text-danger': hasError }"
    >
      这是一段文字
    </div>

    <div v-bind:class="classObject">这是一段文字</div>

    <div v-bind:class="[isActive ? activeClass : '', errorClass]">
      这是一段文字
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      isActive: true,
      hasError: false,
      activeClass: "active",
      errorClass: "text-danger",
    };
  },
  computed: {
    classObject: function () {
      return {
        active: this.isActive && !this.error,
        "text-danger": this.error && this.error.type === "fatal",
      };
    },
  },
};
</script>
```

**React**

```
import { useState, useMemo } from "react";
import "./App.css";

function App() {
  const [isActive, setIsActive] = useState(false);
  const buttonText = useMemo(() => {
    return isActive ? "已选中" : "未选中";
  }, [isActive]);

  const buttonClass = useMemo(() => {
    // 手动join一下，变成'button active'形式
    return ["button", isActive ? "active" : ""].join(" ");
  }, [isActive]);

  const handleClickActive = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className={buttonClass} onClick={handleClickActive}>
          {buttonText}
        </div>
      </header>
    </div>
  );
}

export default App;
```

### 父子组件

**Vue**

```
<template>
  <div class="app-container">
    <div>父组件值: {{ propCount }}</div>
    <button @click="handleChange">点击</button>
  </div>
</template>

<script>
export default {
  name: "ButtonCounter",
  data() {
    return {};
  },
  props: {
    propCount: {
      type: Number,
      default: 0,
    },
  },
  methods: {
    handleChange() {
      this.$emit("handleChange", this.propCount);
    },
  },
};
</script>
```

```
<template>
  <div class="app-container">
    <ComButtonCounter :propCount="data_Count" @handleChange="handleChange" />
  </div>
</template>

<script>
import ComButtonCounter from "./ButtonCounter";

export default {
  name: "App",
  components: {
    ComButtonCounter,
  },
  data() {
    return {
      data_Count: 0,
    };
  },
  methods: {
    handleChange(val) {
      console.log("val: ", val);
      this.data_Count++;
    },
  },
};
</script>
```

**React**

```
import React from "react";

function ButtonCounter(props) {
  const { count, handleChange } = props
  
  return <div>
      <div>父组件值: {count}</div>
      <button onClick={handleChange}>点击</button>
  </div>;
}

export default ButtonCounter;
```

```
import { useState } from "react";
import "./App.css";
import ComButtonCounter from "./components/ButtonCounter";

function App() {
  const [count, setCount] = useState(0);

  const handleChange = () => {
    console.log("handleChange: ");
    setCount(count + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <ComButtonCounter count={count} handleChange={handleChange} />
      </header>
    </div>
  );
}

export default App;
```

### provide/inject

Vue和React中对于全局状态的管理都有各自好的解决方案，比如Vue中的Vuex，React中的redux和Mobx，当然小型项目中直接使用这些有点大材小用，我们应该怎么解决呢

**Vue**

provide 和 inject 主要为高阶插件/组件库提供用例。并不推荐直接用于应用程序代码中。

provide 和 inject 绑定并不是可响应的。这是刻意为之的。然而，如果你传入了一个可监听的对象，那么其对象的 property 还是可响应的。
```
// 父级组件提供 'userInfo'
var Provider = {
  provide() {
    return {
      userInfo: {
        name: "levin",
      },
    };
  },
  // ...
}

// 子组件注入 'userInfo'
var Child = {
  inject: ['userInfo'],
  created () {
    console.log(this.userInfo.name) // => "levin"
  }
  // ...
}
```

**React**

context/index.js
```
import { createContext } from "react";

export const UserInfoContext = createContext({
  userInfo: {
    name: "",
  },
});
```

App.jsx
```
import { useState } from "react";
import "./App.css";
import { UserInfoContext } from "./context/index";
import ComChild from './components/child'

function App() {
  const [userInfo] = useState({
    name: "levin",
  });

  return (
    <UserInfoContext.Provider value={{ userInfo }}>
      <div className="App">
        <header className="App-header">
          <ComChild />
        </header>
      </div>
    </UserInfoContext.Provider>
  );
}

export default App;
```

components/child/index.jsx
```
import React, { useContext } from "react";
import { UserInfoContext } from "../../context/index";

export default function Child() {
  // 通过userContext，使用定义好的UserInfoContext
  const { userInfo } = useContext(UserInfoContext);

  return <div>{userInfo.name}</div>;
}
```

### slot

**Vue**

```
<template>
  <div class="child-container">
    <div>
      <slot name="header"></slot>
    </div>
    <main>
      <slot v-bind:user="user">这是默认插槽的内容</slot>
    </main>
    <div>
      <slot name="footer"> 这是footer插槽的内容 </slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "SlotChild",
  data() {
    return {
      user: {
        firstName: "levin",
      }
    };
  },
};
</script>
```

```
<template>
  <div class="app-container">
    <ComSlotChild>
      <template #header>
        <h1>Here might be a page title</h1>
      </template>

      <template v-slot:default="slotProps">
        <div>
          <h3>我是插槽内的内容</h3>
          <p>我是插槽内的内容</p>
          {{ slotProps.user.firstName }}
        </div>
      </template>

      <template #footer>
        <p>Here's some contact info</p>
      </template>
    </ComSlotChild>
  </div>
</template>

<script>
import ComSlotChild from "./SlotChild";

export default {
  name: "App",
  components: {
    ComSlotChild,
  },
  data() {
    return {};
  },
};
</script>
```

**React**

React中可以通过props.children获取到组件内部的子元素，通过这个就可以实现默认插槽的功能。

```
import { useState } from "react";

function SlotChild(props) {
  const [userInfo] = useState({
    name: "levin",
  });

  // 默认插槽
  // const { children, title = '' } = props

  // 具名插槽
  const { slot, main, scope, title = "" } = props;

  return (
    <div className={`slot-wrapper}`}>
      {/* 默认插槽 */}
      {/* {children} */}

      {/* 具名插槽 */}
      {slot}
      {main}
      {scope(userInfo)}
    </div>
  );
}

export default SlotChild;
```

```
import React from "react";
import "./App.css";
import ComSlotChild from "./components/SlotChild";

function App() {

  return (
    <div className="App">
      <header className="App-header">
        {/* <ComSlotChild title="这是调用默认插槽组件">
          <div>这是一段文字</div>
          <h3>标题</h3>
          <p>描述</p>
        </ComSlotChild> */}

        <ComSlotChild
          title="这是调用具名作用于插槽组件"
          slot={<h3>标题</h3>}
          main={<div>这是一段文字</div>}
          scope={(userInfo) => <div>你好{ userInfo.name }</div>}
        ></ComSlotChild>
      </header>
    </div>
  );
}

export default App;
```
