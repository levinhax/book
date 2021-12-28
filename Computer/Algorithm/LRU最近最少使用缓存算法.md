## 什么是 LRU

LRU（Least Recently Used）即最近最少使用缓存，前端在做性能优化的时候会经常用到使用到缓存，用以空间换时间的方式来达到性能优化目标。

## LRU 实现

1. 需要给定一个数据结构的长度，不能无限制的缓存数据；
2. LRU 实例提供一个 get 方法，可通过关键字 key 获取缓存中数据，若没有则返回 -1；
3. LRU 实例提供一个 put 方法，变更数据值，若数据存在则修改，不存在则插入一条新数据，插入时超过数据长度则删除最久未使用的关键字。
4. get、put的时间复杂度必须是 O(1)

*问题一*

用纯数组就可以实现上述 1、2、3 的需求，但是在时间复杂度的要求上达不到，用数组的话，不管是 get 还是 put 方法的时间复杂度都为 O(n)

*问题二*

双向链表对插入与删除时间复杂度为 O(1), 但是链表的查找时间复杂度却为 O(n),在实现 get 的过程中肯定会使用到查询操作

为了解决查询的时间复杂度问题，自然就想到了 Map 数据结构。es6 的 Map 数据结构是查询的时间复杂度正是为O(1)。

通过 双向链表，Map 的数据结构的组合来实现 LRU，使用双向链表存储数据，使用Map标记链表中 key 的位置这样就可以很容易实现 LRUCache 的数据结构。

```
class LinkNode {
  key: number
  value: number
  _prev: LinkNode | null
  _next: LinkNode | null
  constructor(key: number, val: number) {
    this.key = key
    this.value = val
    this._prev = null
    this._next = null
  }
}

class LRUCache {
  head: LinkNode | null
  tail: LinkNode | null
  size: number
  map: Map<number, LinkNode>
  constructor(capacity: number) {
    this.size = capacity
    this.map = new Map()
    this.head = null
    this.tail = null
  }

  get(key: number): number {
    // 在 map 中查找是否存在有这条数据
    if (this.map.has(key)) {
      let node = this.map.get(key) as LinkNode
      let _prev = node._prev
      let _next = node._next

      // 判断是否为头节点，若为头节点则不需要对链表作任何操作，直接返回值，若部位头肩点，需要操作链表达到最近缓存的操作
      if (_prev) {
        // 不为节点需要将该节点移动到头节点的位置

        // 当前节点是尾部节点的情况
        if (!_next) {
          this.tail = _prev
        } else {
          _next._prev = _prev // 等价于 node._next._prev = node._prev
        }

        // 1. 链表操作，移除 node 节点
        _prev._next = _next // 等价于 node._prev._next = node._next

        // 2. 将 node 节点放到链表头部
        node._prev = null

        if (this.head) {
          node._next = this.head
          this.head._prev = node
        }
        this.head = node
      }

      // 返回想要查找的数据值
      return node.value
    }

    return -1
  }

  put(key: number, value: number): void {
    // put 功能包括两部分，修改和新增

    if (this.map.has(key)) {
      // 修改
      let node = this.map.get(key) as LinkNode
      node.value = value
      let _prev = node._prev
      let _next = node._next

      if (_prev) {
        if (!_next) {
          this.tail = _prev
        } else {
          _next._prev = _prev // 等价于 node._next._prev = node._prev
        }

        // 非头部节需要把节点提到链表头部
        _prev._next = _next
        node._next = this.head
        node._prev = null
        this.head && (this.head._prev = node)
        this.head = node
      }
    } else {
      let node = new LinkNode(key, value)
      this.map.set(key, node)

      if (this.head) {
        node._next = this.head
        this.head._prev = node
        this.head = node
      } else {
        this.head = this.tail = node
      }

      // 新增数据的场景
      if (this.map.size > this.size) {
        let _tail = this.tail as LinkNode
        this.map.delete(_tail.key)

        this.tail = _tail._prev

        if (this.tail) {
          this.tail._next = null
        }

        if (this.head.key === _tail.key) {
          this.head = null
        }
      }
    }
  }
}
```