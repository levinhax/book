### 常用钩子函数

- useState：维护状态
- useEffect：完成副作用操作
- useContext：使用共享状态
- useReducer：类似redux
- useCallback：缓存函数
- useMemo：缓存值
- useRef：访问DOM
- useImperativeHandle：使用子组件暴露的值/方法
- useLayoutEffect：完成副作用操作，会阻塞浏览器绘制

### useState

```
import React, { useState } from 'react'
import { Divider, Button } from 'antd'
import classes from './index.module.css'

const Demo = () => {
  const [count, setCount] = useState(0)
  const [obj, setObj] = useState({ id: 1 })

  const handleUpdate1 = () => {
    setCount(count + 1)
  }

  const handleUpdate2 = () => {
    setObj(prevObj => ({ ...prevObj, ...{ id: 2, name: '张三' } }))
  }

  return (
    <div className={classes['demo-wrapper']}>
      <h3>React 钩子函数</h3>
      <Divider orientation="left">useState</Divider>
      <div className={classes['demo-item']}>
        count：{count}
        <Button type="primary" onClick={handleUpdate1} style={{ marginLeft: '16px' }}>
          普通更新
        </Button>
      </div>
      <div className="demo-item">
        obj：{JSON.stringify(obj)}
        <Button type="primary" onClick={handleUpdate2} style={{ marginLeft: '16px' }}>
          函数式更新
        </Button>
      </div>

      <Divider orientation="left">useEffect</Divider>
    </div>
  )
}

export default Demo
```

### useEffect

Effect Hook 可以让你在函数组件中执行副作用操作，可以把 useEffect Hook 看做 componentDidMount，componentDidUpdate 和 componentWillUnmount 这三个函数的组合。

```
function FriendStatusWithCounter(props) {
  const [count, setCount] = useState(0);
  useEffect(() => {
      // 这里的代码块 等价于 componentDidMount
      document.title = `You clicked ${count} times`;
    },
    // 依赖列表，当依赖的值有变更时候，执行副作用函数，等价于 componentDidUpdate
    [ xxx，obj.xxx ]
  );

  const [isOnline, setIsOnline] = useState(null);
  useEffect(() => {
    function handleStatusChange(status) {
      setIsOnline(status.isOnline);
    }

    ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);

    // return的写法 等价于 componentWillUnmount
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(props.friend.id, handleStatusChange);
    };
  });
  // ...
}
```

依赖列表是灵活的，有三种写法:

- 当数组为空 [ ]，表示不会应为页面的状态改变而执行回调方法【即仅在初始化时执行，componentDidMount】
- 当这个参数不传递，表示页面的任何状态一旦变更都会执行回调方法
- 当数组非空，数组里的值一旦有变化，就会执行回调方法

##### 一些特殊场景:

1. 我依赖了某些值，**但是我不要在初始化就执行回调方法，我要让依赖改变再去执行回调方法**

```
  const firstLoad = useRef(true)

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false
      return
    }
    document.title = `You clicked ${count} times`
  }, [count])
```

2. 我有一个getData的异步请求方法，我要让其在初始化调用且点击某个按钮也可以调用

```
  const getData = useCallback(async () => {
    const data = await xxx({ id: 1 });
    setDetail(data);
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);

  const handleClick = () => {
    getData();
  };
```

### useContext

接收一个 context 对象（React.createContext 的返回值）并返回该 context 的当前值。当前的 context 值由上层组件中距离当前组件最近的 <MyContext.Provider> 的 value prop 决定。

当组件上层最近的 <MyContext.Provider> 更新时，该 Hook 会触发重渲染，并使用最新传递给 MyContext provider 的 context value 值。即使祖先使用 React.memo 或 shouldComponentUpdate，也会在组件本身使用 useContext 时重新渲染。

Context为我们提供了一种在组件之间共享此类值的方式，而不必显式地通过组件树 的逐层传递 props

```
const themes = {
  light: {
    foreground: "#000000",
    background: "#eeeeee"
  },
  dark: {
    foreground: "#ffffff",
    background: "#222222"
  }
};

const ThemeContext = React.createContext(themes.light);

function App() {
  return (
    <ThemeContext.Provider value={themes.dark}>
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar(props) {
  return (
    <div>
      <ThemedButton />
    </div>
  );
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return (
    <button style={{ background: theme.background, color: theme.foreground }}>
      I am styled by theme context!
    </button>
  );
}
```

### useReducer

useState 的替代方案。它接收一个形如 (state, action) => newState 的 reducer，并返回当前的 state 以及与其配套的 dispatch 方法。

```
const initialState = {count: 0};

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return {count: state.count + 1};
    case 'decrement':
      return {count: state.count - 1};
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <>
      Count: {state.count}
      <button onClick={() => dispatch({type: 'decrement'})}>-</button>
      <button onClick={() => dispatch({type: 'increment'})}>+</button>
    </>
  );
}
```
