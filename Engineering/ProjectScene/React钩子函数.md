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

### useCallback

把内联回调函数及依赖项数组作为参数传入 useCallback，它将返回该回调函数的 memoized 版本，该回调函数仅在某个依赖项改变时才会更新。

useCallback(fn, deps) 相当于 useMemo(() => fn, deps)。

```
const memoizedCallback = useCallback(
  () => {
    doSomething(a, b);
  },
  [a, b],
);
```
除非 a 或 b 改变，否则不会变

新场景：react中只要父组件的 render 了，那么默认情况下就会触发子组的 render，react提供了来避免这种重渲染的性能开销的一些方法：
React.PureComponent、React.memo ，shouldComponentUpdate()

如下示例：当我们子组件接受属性是一个方法的时候

```
import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react'
import { Divider, Button } from 'antd'
import classes from './index.module.css'

import Child from './child'

const Demo = () => {
  const [count, setCount] = useState(0)
  
  const handleUpdate1 = () => {
    setCount(count + 1)
  }

  const getList = (n: number) => {
    return Array.apply(Array, Array(n)).map((item, i) => ({
      id: i,
      name: '张三' + i,
    }))
  }

  return (
    <div className={classes['demo-wrapper']}>
      <h3>React 钩子函数</h3>

      <Divider orientation="left">useCallback</Divider>
      <div className="demo-item">
        <Child getList={getList} />
        <hr />
        避免子组件做没必要的渲染
        <ChildMemo getList={getList} />
        <Button type="primary" onClick={handleUpdate1} style={{ marginTop: '16px' }}>
          普通更新 {count}
        </Button>
      </div>
    </div>
  )
}

export default Demo
```

```
import React from 'react'

const Child = ({ getList }: any) => {
  console.log('child-render')
  return (
    <>
      {getList(5).map((item: any) => (
        <div key={item.id}>
          id：{item.id}，name：{item.name}
        </div>
      ))}
    </>
  )
}

export default Child
```

当点击“count+1”按钮，发生了这样子的事：
```
父组件render > 子组件render > 子组件输出 "child-render"
```

为了避免子组件做没必要的渲染，这里用了React.memo:
```
import React, { memo } from 'react'

const ChildMemo = ({ getList }: any) => {
  console.log('child-memo-render')
  return (
    <>
      {getList(5).map((item: any) => (
        <div key={item.id}>name：{item.name}</div>
      ))}
    </>
  )
}

export default memo(ChildMemo)
```

*我们不假思索的认为，当我们点击“count+1”时，子组件不会再重渲染了。
但现实是，还是依然会渲染，这是为什么呢？
答：Reace.memo只会对props做浅比较，也就是父组件重新render之后会传入
不同引用的方法 getList，浅比较之后不相等，导致子组件还是依然会渲染。*

这时候，useCallback 就可以上场了，它可以缓存一个函数，当依赖没有改变的时候，会一直返回同一个引用。如：
```
  const getList = useCallback((n: number) => {
    return Array.apply(Array, Array(n)).map((item, i) => ({
      id: i,
      name: '张三' + i,
    }))
  }, [])
```

**如果子组件接受了一个方法作为属性，我们在使用 React.memo 这种避免子组件做没必要的渲染时候，就需要用 useCallback 进行配合，否则 React.memo 将无意义。**

### useMemo

把“创建”函数和依赖项数组作为参数传入 useMemo，它仅会在某个依赖项改变时才重新计算 memoized 值。这种优化有助于避免在每次渲染时都进行高开销的计算。

记住，传入 useMemo 的函数会在渲染期间执行。请不要在这个函数内部执行与渲染无关的操作，诸如副作用这类的操作属于 useEffect 的适用范畴，而不是 useMemo。

如果没有提供依赖项数组，useMemo 在每次渲染时都会计算新的值。

```
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

### useRef

useRef 返回一个可变的 ref 对象，其 .current 属性被初始化为传入的参数（initialValue）。返回的 ref 对象在组件的整个生命周期内持续存在。

```
function TextInputWithFocusButton() {
  const inputEl = useRef<HTMLInputElement>(null);
  const onButtonClick = () => {
    // `current` 指向已挂载到 DOM 上的文本输入元素
    inputEl.current && inputEl.current.focus();
  };
  return (
    <>
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus the input</button>
    </>
  );
}
```

如果我们要访问的是一个组件，操作组件里的具体DOM呢？我们就需要用到 React.forwardRef 这个高阶组件，来转发ref，如：

```
import React, { forwardRef } from 'react'
import { Input } from 'antd'

const ChildInput = (props: any, ref: any) => {
  console.log('ChildInput: ', props)
  return <Input ref={ref} />
}

export default forwardRef(ChildInput)
```

```
const antdInputEl = useRef<Input>(null)

const handleChildButtonClick = () => {
  antdInputEl.current && antdInputEl.current.focus()
}

<ChildInput ref={antdInputEl} />
<Button onClick={handleChildButtonClick} style={{ marginTop: '16px' }}>
  Focus the child input
</Button>
```

### useImperativeHandle

useImperativeHandle 可以让你在使用 ref 时自定义暴露给父组件的实例值，让我们在父组件调用到子组件暴露出来的属性/方法。在大多数情况下，应当避免使用 ref 这样的命令式代码。useImperativeHandle 应当与 forwardRef 一起使用：

```
import React, { useRef, forwardRef, useImperativeHandle } from 'react'

function FancyInput(props: any, ref: any) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(0)

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current && inputRef.current.focus()
    },
  }))

  return (
    <>
      <input ref={inputRef} />
    </>
  )
}
export default forwardRef(FancyInput)
```

```
const fancyInputEl = useRef<any>(null)

const handleFancyButtonClick = () => {
  fancyInputEl.current && fancyInputEl.current.focus()
}

<Divider orientation="left">useImperativeHandle</Divider>
<div className="demo-item">
  <FancyInput ref={fancyInputEl} />
    <Button onClick={handleFancyButtonClick} style={{ marginTop: '16px' }}>
      Focus the child input
    </Button>
</div>
```

### useLayoutEffect

它会在所有的 DOM 变更之后同步调用 effect。可以使用它来读取 DOM 布局并同步触发重渲染。在浏览器执行绘制之前，useLayoutEffect 内部的更新计划将被同步刷新。

尽可能使用标准的 useEffect 以避免阻塞视觉更新。
