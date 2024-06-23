### 一、减少重新 Render 的次数

在 React 里时间耗时最多的一个地方是 Reconciliation（reconciliation 的最终目标是以最有效的方式，根据新的状态来更新 UI，我们可以简单地理解为 diff），如果不执行 Render，也就不需要 Reconciliation，所以可以看出减少 Render 在性能优化过程中的重要程度了。

#### PureComponent

React.PureComponent 与 React.Component 很相似。两者的区别在于 React.Component 并未实现 shouldComponentUpdate()，而 React.PureComponent 中以浅层对比 Prop 和 State 的方式来实现了该函数。

在使用 PureComponent 的组件中，在 Props 或者 State 的属性值是对象的情况下，并不能阻止不必要的渲染，是因为自动加载的 shouldComponentUpdate 里面做的只是浅比较，所以想要用 PureComponent 的特性，应该遵守原则：

- 确保数据类型是值类型
- 如果是引用类型，不应当有深层次的数据变化(解构)

#### ShouldComponentUpdate

可以利用此事件来决定何时需要重新渲染组件。如果组件 Props 更改或调用 setState，则此函数返回一个 Boolean 值，为 true 则会重新渲染组件，反之则不会重新渲染组件。

shouldComponentUpdate 的使用，也是有代价的。如果处理得不好，甚至比多 Render 一次更消耗性能，另外也会使组件的复杂度增大，一般情况下使用PureComponent即可；

#### React.memo

如果你的组件在相同 Props 的情况下渲染相同的结果，那么你可以通过将其包装在 React.memo 中调用，以此通过记忆组件渲染结果的方式来提高组件的性能表现。这意味着在这种情况下，React 将跳过渲染组件的操作并直接复用最近一次渲染的结果。

React.memo 仅检查 Props 变更。如果函数组件被 React.memo 包裹，且其实现中拥有 useState，useReducer 或 useContext 的 Hook，当 State 或 Context 发生变化时，它仍会重新渲染。
默认情况下其只会对复杂对象做浅层对比，如果你想要控制对比过程，那么请将自定义的比较函数通过第二个参数传入来实现。

#### 避免使用匿名函数

有一个潜在问题是匿名函数在每次渲染时都会有不同的引用，这样就会导致 Menu 组件会出现重复渲染的问题；可以使用 useCallback 来进行优化

```
const MenuContainer = ({ list }) => {
  const handleClick = useCallback(
    (id) => () => {
      // ...    },
    [],
  );
return (
    <Menu>      {list.map((i) => (
        <MenuItem key={i.id}id={i.id}onClick={handleClick(i.id)}value={i.value} />      ))}
    </Menu>  );
};
```

### 二、减少渲染的节点

#### 组件懒加载

组件懒加载可以让 React 应用在真正需要展示这个组件的时候再去展示，可以比较有效的减少渲染的节点数提高页面的加载速度0

React.lazy 和 React.Suspense,这两个组件的配合使用可以比较方便进行组件懒加载的实现；

React.lazy 该方法主要的作用就是可以定义一个动态加载的组件，这可以直接缩减打包后 bundle 的体积，并且可以延迟加载在初次渲染时不需要渲染的组件

React.Suspense 该组件目前主要的作用就是配合渲染 lazy 组件，这样就可以在等待加载 lazy组件时展示 loading 元素，不至于直接空白，提升用户体验；

```
import React, { Suspense } from'react';
const OtherComponent = React.lazy(() => import('./OtherComponent'));
const AnotherComponent = React.lazy(() => import('./AnotherComponent'));
functionMyComponent() {
  return (
    <div><Suspense fallback={<div>Loading...</div>}>
        <section><OtherComponent /><AnotherComponent /></section></Suspense></div>  );
}
```
React.lazy 和 Suspense 技术还不支持服务端渲染。如果你想要在使用服务端渲染的应用中使用，推荐使用 Loadable Components 这个库

#### 虚拟列表

### 三、降低渲染计算量

#### useMemo

```
functioncomputeExpensiveValue(a, b) {
  // 计算量很大的一些逻辑return xxx
}
const memoizedValue = useMemo(computeExpensiveValue, [a, b]);
```

useMemo 的第一个参数就是一个函数，这个函数返回的值会被缓存起来，同时这个值会作为 useMemo 的返回值，第二个参数是一个数组依赖，如果数组里面的值有变化，那么就会重新去执行第一个参数里面的函数，并将函数返回的值缓存起来并作为 useMemo 的返回值 。

- 如果没有提供依赖项数组，useMemo 在每次渲染时都会计算新的值；
- 计算量如果很小的计算函数，也可以选择不使用 useMemo，因为这点优化并不会作为性能瓶颈的要点，反而可能使用错误还会引起一些性能问题。

#### 遍历展示视图时使用 key

key 帮助 React 识别哪些元素改变了，比如被添加或删除。因此你应当给数组中的每一个元素赋予一个确定的标识。

### 四、合理设计组件

#### 简化 Props

如果一个组件的 Props 比较复杂的话，会影响 shallowCompare 的效率，也会使这个组件变得难以维护，另外也与“单一职责”的原则不符合，可以考虑进行拆解。

#### 简化 State

在设计组件的 State 时，可以按照这个原则来：需要组件响应它的变动或者需要渲染到视图中的数据，才放到 State 中；这样可以避免不必要的数据变动导致组件重新渲染。

#### 减少组件嵌套

一般不必要的节点嵌套都是滥用高阶组件/ RenderProps 导致的。所以还是那句话‘只有在必要时才使用 xxx’。有很多种方式来代替高阶组件/ RenderProps，例如优先使用 Props、React Hooks

### 使用PureComponent和memo进行组件的优化

在React中，有两种方式可以避免组件不必要的渲染，从而提升应用的性能：使用PureComponent和memo。

PureComponent是React提供的一个优化组件的方式，它会自动对组件的props和state进行浅比较，如果没有发生变化，就不会重新渲染组件。而memo是一个高阶组件，可以用来对函数式组件进行优化。

```
import React, { PureComponent, memo } from 'react';

// 使用 PureComponent 优化类组件
class MyClassComponent extends PureComponent {
    render() {
        return (
            // 组件的渲染内容
        );
    }
}

// 使用 memo 优化函数式组件
const MyFunctionalComponent = memo((props) => {
    return (
        // 组件的渲染内容
    );
});
```

### 使用虚拟列表优化长列表

在移动端应用中，长列表的渲染可能会导致性能问题。虚拟列表是一种优化技术，它只渲染可见区域内的列表项，而不是整个列表。这样可以减少渲染的数量，提升应用的性能。

可以使用react-window或react-virtualized这两个库来实现虚拟列表。

**原理**

只渲染可视区域内的列表项，而不是渲染整个列表

当用户滚动容器时，虚拟列表会根据滚动位置和可视区域的大小计算出当前应该显示的列表项。

虚拟列表的实现，实际上就是在首屏加载的时候，只加载可视区域内需要的列表项，当滚动发生时，动态通过计算获得可视区域内的列表项，并将非可视区域内存在的列表项删除。

- 计算当前可视区域起始数据索引(startIndex)
- 计算当前可视区域结束数据索引(endIndex)
- 计算当前可视区域的数据，并渲染到页面中
- 计算startIndex对应的数据在整个列表中的偏移位置startOffset并设置到列表上

虚拟列表通过动态渲染当前可见的列表项来提高性能和内存利用率，而下拉加载更多是在用户滚动到列表底部时自动加载更多数据。两者都是为了优化大数据集或长列表的用户界面，提供更好的性能和用户体验。

### 使用shouldComponentUpdate或memo进行属性的优化

在某些情况下，我们可能只需要对组件部分属性的变化进行响应，而不是对所有属性都重新渲染组件。此时，可以使用shouldComponentUpdate或memo对属性变化进行优化。

```
import React, { PureComponent, memo } from 'react';

class MyComponent extends PureComponent {
    shouldComponentUpdate(nextProps) {
        // 只在属性改变时重新渲染组件
        if (this.props.someProp !== nextProps.someProp) {
            return ture;
        }
        return false;
    }

    render() {
        return (
            // 组件内容
        );
    }
};
```

### 使用分包懒加载优化应用的加载速度

移动端网络环境相对不稳定，因此，应用的加载速度对于用户体验至关重要。可以通过使用分包懒加载的方式来优化应用的加载速度。

使用React.lazy和Suspense可以实现组件的懒加载，只有在组件被访问到时才加载。

```
import React, { lazy, Suspense } from 'react';

const MyLazyComponent = lazy(() => import('./MyComponent'));

const App = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <MyLazyComponent />
    </Suspense>
);
```
