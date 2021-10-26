在 TS 中，类似数组、字符串、数组、接口这些常见的类型都非常常见，但是如果要定义一个对象的 key 和 value 类型该怎么做呢？这时候就需要用到 TS 的 Record 了。

Record<K,T>构造具有给定类型T的一组属性K的类型。在将一个类型的属性映射到另一个类型的属性时，Record非常方便。

```
interface PageInfo {
  title: string;
}

type Page = "home" | "about" | "contact";

const nav: Record<Page, PageInfo> = {
  about: { title: "about" },
  contact: { title: "contact" },
  home: { title: "home" },
};
```
Record 后面的泛型就是对象键和值的类型。

比如我需要一个对象，有 ABC 三个属性，属性的值必须是数字，那么就这么写：
```
type keys = 'A' | 'B' | 'C'
const result: Record<keys, number> = {
  A: 1,
  B: 2,
  C: 3
}
```
