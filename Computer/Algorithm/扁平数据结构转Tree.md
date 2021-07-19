## 情景

题目：打平的数据内容如下：
```
let arr = [
    {id: 1, name: '部门1', pid: 0},
    {id: 2, name: '部门2', pid: 1},
    {id: 3, name: '部门3', pid: 1},
    {id: 4, name: '部门4', pid: 3},
    {id: 5, name: '部门5', pid: 4},
]
```

输出结果:
```
[
    {
        "id": 1,
        "name": "部门1",
        "pid": 0,
        "children": [
            {
                "id": 2,
                "name": "部门2",
                "pid": 1,
                "children": []
            },
            {
                "id": 3,
                "name": "部门3",
                "pid": 1,
                "children": [
                    // 结果 ,,,
                ]
            }
        ]
    }
]
```

## 算法的时间复杂度和空间复杂度

我们常常用时间复杂度代表执行时间，空间复杂度代表占用的内存空间。

### 时间复杂度

**时间复杂度的计算并不是计算程序具体运行的时间，而是算法执行语句的次数。**

随着n的不断增大，时间复杂度不断增大，算法花费时间越多。 常见的时间复杂度有

- 常数阶O(1)
- 对数阶O(log2 n)
- 线性阶O(n)
- 线性对数阶O(n log2 n)
- 平方阶O(n^2)
- 立方阶O(n^3)
- k次方阶O(n^K)
- 指数阶O(2^n)

#### 计算方法

1. 选取相对增长最高的项
2. 最高项系数是都化为1
3. 若是常数的话用O(1)表示

举个例子：如f(n)=3*n^4+3n+300 则 O(n)=n^4

通常我们计算时间复杂度都是计算最坏情况。计算时间复杂度的要注意的几个点：

如果算法的执行时间不随n的增加而增长，假如算法中有上千条语句，执行时间也不过是一个较大的常数。此类算法的时间复杂度是O(1)。 举例如下：代码执行100次，是一个常数，复杂度也是O(1)。
```
let x = 1;
while (x <100) {
    x++;
}
```

有多个循环语句时候，算法的时间复杂度是由嵌套层数最多的循环语句中最内层语句的方法决定的。举例如下：在下面for循环当中，外层循环每执行一次，内层循环要执行n次，执行次数是根据n所决定的，时间复杂度是O(n^2)。
```
for (i = 0; i < n; i++){
    for (j = 0; j < n; j++) {
        // ...code
    }
}
```

循环不仅与n有关，还与执行循环判断条件有关。举例如下：在代码中，如果arr[i]不等于1的话，时间复杂度是O(n)。如果arr[i]等于1的话，循环不执行，时间复杂度是O(0)。
```
for(var i = 0; i<n && arr[i] !=1; i++) {
    // ...code
}
```

### 空间复杂度

**空间复杂度是对一个算法在运行过程中临时占用存储空间的大小。**

#### 计算方法

- 忽略常数，用O(1)表示
- 递归算法的空间复杂度=(递归深度n)*(每次递归所要的辅助空间)

仅仅只复制单个变量，空间复杂度为O(1)。举例如下：空间复杂度为O(n) = O(1)。
```
let a = 1;
let b = 2;
let c = 3;
console.log('输出a,b,c', a, b, c);
```

递归实现，调用fun函数，每次都创建1个变量k。调用n次，空间复杂度O(n*1) = O(n)。
```
function fun(n) {
    let k = 10;
    if (n == k) {
        return n;
    } else {
        return fun(++n)
    }
}
```

## 解法

### 递归遍历查找

不考虑性能，主要思路是提供一个递getChildren的方法，该方法递归去查找子集。

```
/**
 * 递归查找，获取children
 */
const getChildren = (data, result, pid) => {
  for (const item of data) {
    if (item.pid === pid) {
      const newItem = {...item, children: []};
      result.push(newItem);
      getChildren(data, newItem.children, item.id);
    }
  }
}

/**
* 转换方法
*/
const arrayToTree = (data, pid) => {
  const result = [];
  getChildren(data, result, pid)
  return result;
}
```

### 借助map

主要思路是先把数据转成Map去存储，之后遍历的同时借助对象的引用，直接从Map找对应的数据做存储

```
function arrayToTree(items) {
  const result = [];   // 存放结果集
  const itemMap = {};  // 
    
  // 先转成map存储
  for (const item of items) {
    itemMap[item.id] = {...item, children: []}
  }
  
  for (const item of items) {
    const id = item.id;
    const pid = item.pid;
    const treeItem =  itemMap[id];
    if (pid === 0) {
      result.push(treeItem);
    } else {
      if (!itemMap[pid]) {
        itemMap[pid] = {
          children: [],
        }
      }
      itemMap[pid].children.push(treeItem)
    }

  }
  return result;
}
```

该实现的时间复杂度为O(2n)，需要一个Map把数据存储起来，空间复杂度O(n)

### 最优性能

主要思路也是先把数据转成Map去存储，之后遍历的同时借助对象的引用，直接从Map找对应的数据做存储。不同点在遍历的时候即做Map存储,有找对应关系。性能会更好。
```
function arrayToTree(items) {
  const result = []; // 存放结果集
  const itemMap = {}; //
  for (const item of items) {
    const id = item.id;
    const pid = item.pid;

    if (!itemMap[id]) {
      itemMap[id] = {
        children: [],
      };
    }

    itemMap[id] = {
      ...item,
      children: itemMap[id]["children"],
    };

    const treeItem = itemMap[id];

    if (pid === 0) {
      result.push(treeItem);
    } else {
      if (!itemMap[pid]) {
        itemMap[pid] = {
          children: [],
        };
      }
      itemMap[pid].children.push(treeItem);
    }
  }
  return result;
}
```
