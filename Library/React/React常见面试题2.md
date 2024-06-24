### react 调用setState发生了什么

1. react会将传入的参数对象与组件当前已有的状态合并，并触发所谓的调和过程（Reconciliation）
2. 经过调和之后，React会以相对高效地方式根据新的状态去构建新的React元素树，并着手重新渲染UI界面
3. React得到元素树后，React会自动计算出新树与老树节点间的差异，根据差异对界面进行最小化重渲染
4. 在DIff算法中，React能够相对精确地知道哪些地方发生了变化以及如何改变，从而能够按需更新，而不是全部重新渲染。

总结起来，调用setState会触发组件的重新渲染，包括计算虚拟dom树、找出差异、应用差异等过程，以保证组件的显示与状态同步更新。

### react组件传参

#### 父子传参

父级组件向子组件传递一些参数，在子组件主要通过props来进行接收大部分传输的都是可观察的数据，当父组件的更改了向子组件传输的参数，子组件响应到更新就会正常渲染新的内容

#### 子父传参

```
import { useState } from 'react'

const Person = () => {

  const [count, setCount] = useState(0)

  const updateCount = (val) => {
    setCount(val)
  }

  return <div>
    {/* 定义callback回调方法 */}
    <Son callback={updateCount} />
    点赞：{count}
  </div>
}

const Son = (props) => {
  //props接收参数，当name更改子组件重新渲染
  const { name } = props;

  const { callback } = props

  return <div>
    <h1>{name}</h1>
    {/* 调用父组件传递的方法并且将参数回传 */}
    <button onClick={() => callback(10)}>更新父组件</button>
  </div>
}

export default Person;
```

#### 跨层级传参context

跨层级传参主要使用context

在class组件中在父组件使用contextTypes在子组件使用this.context接收参数
```
import React from 'react'
import PropTypes from 'prop-types';
​
class SecondComp extends React.Component {
  static contextTypes = {
    //子组件声明接收参数
    name: PropTypes.string
  }
​
  render() {
    return <div>
      孙组件：SecondComp
      {this.context.name}
    </div>
  }
}
​
class FirstComp extends React.Component {
  render() {
    return <div>
      父组件：FirstComp
      <SecondComp />
    </div>
  }
}
​
class App extends React.Component {
​
  state = {
    name: '落霞与孤鹜齐飞'
  }
​
  getChildContext() {
    //在父组件定义参数
    return { name: this.state.name };
  }
​
  static childContextTypes = {
    name: PropTypes.string
  }
​
  render() {
    return <div>
      爷组件:App
      <button onClick={() => this.setState({ name: '秋水共天长一色' })}>更新</button>
      <FirstComp />
    </div>
  }
}
​
export default App;
```

context传参的通用方式使用Provider和Consumer两个关键字，本次的🌰只展示class类组件的例子因为在hooks中使用的方式和类组件是一样的
```
//声明公共context
const ThemeContext = React.createContext('');
​
class SecondComp extends React.Component {
​
  render() {
    // 使用Consumer嵌套，children接收的是一个回调函数，函数内的参数就是爷组件传递下来的
    return <ThemeContext.Consumer>
      {
        (val) => <div>
          孙组件：SecondComp
          {val}
        </div>
      }
    </ThemeContext.Consumer>
  }
}
​
class FirstComp extends React.Component {
  render() {
    return <div>
      父组件：FirstComp
      <SecondComp />
    </div>
  }
}
​
class App extends React.Component {
​
  state = {
    name: '落霞与孤鹜齐飞'
  }
​
  render() {
    return <div>
      爷组件:App
      <button onClick={() => this.setState({ name: '秋水共天长一色' })}>更新</button>
      {/* 父组件使用Provider嵌套将参数传递 */}
      <ThemeContext.Provider value={this.state.name}>
        <FirstComp />
      </ThemeContext.Provider>
    </div>
  }
}
​
export default App;
```

在hooks中实现跨层级传参主要使用useContext接收参数
```
//声明公共context
const ThemeContext = React.createContext('');
​
const SecondComp = () => {
  const { name } = useContext(ThemeContext)
​
  return <div>
    孙组件：SecondComp
    {name}
  </div>
}
​
const FirstComp = () => {
  return <div>
    父组件：FirstComp
    <SecondComp />
  </div>
}
​
const App = () => {
​
  const [name, setName] = useState('落霞与孤鹜齐飞')
​
  return <div>
    爷组件:App
    <button onClick={() => setName('秋水共天长一色')}>更新</button>
​
    {/* 将参数下传 */}
    <ThemeContext.Provider value={{
      name
    }}>
      <FirstComp />
    </ThemeContext.Provider>
  </div>
}
​
export default App;
```

#### 状态库传参

目前在react生态库流行的状态管理是mobx和redux两种

mobx类似于vuex的存储方式原理都是使用响应式进行监听，mobx提供observe和react视图绑定在数据更改的时候进行响应，注意如果是在js中需要配置装饰器才可以使用@

定义store的存储
```
 //npm i -D mobx mobx-react 
 
import { observable, action } from 'mobx'

class Store {
    @observable count = 0

    @action.bound
    seetCount(){
        this.count = 100
    }
}

export default new Store()
```

使用observe连接react视图
```
import Store from './store'
import { observer } from 'mobx-react'

const Son = () => {
  return <div>
    状态管理提供： {Store.count}
  </div>
}

const SonOb = observer(Son)

const Person = () => {

  return <div>
    <SonOb/>
    <button onClick={Store.seetCount(100)}></button>
  </div>
}

export default observer(Person);
```

redux存储方式是现在较为流行的一种而且他并不拘于框架本身，不会像vuex那样和vue有深度绑定关系，redux提供connect高阶函数与视图连接，但是今天我们不会使用，我会根据redux提供的监控更新函数进行视图更新，直接使用useReducer强制更新

定义store存储
```
import { createStore } from 'redux'

//纯函数方式
function counter(state = 0, action) {
    switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
    }
  }

const store = createStore(counter);

export default store
```

react视图
```
import { useEffect, useReducer } from 'react'

import store from './store/store'

function Son() {
  return <div>
    <span>状态库提供参数：{store.getState()}</span>
    Son
  </div>
}

function Person() {

  const [, forceUpdate] = useReducer(x => x + 1, 0)

  useEffect(() => {
    //redux更新监控函数
    store.subscribe(() => {
      forceUpdate()
    }
    );
  }, [])

  return (

    <div className="App">
      <Son />
      <button onClick={() => store.dispatch({ type: 'INCREMENT' })}>更新</button>
      Person
    </div >
  );
}

export default Person;
```

#### 通用的存储方式

sessionStorage、localStorage，indexDB等