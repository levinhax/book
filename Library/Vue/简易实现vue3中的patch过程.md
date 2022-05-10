```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        .red {
            color: red;
        }

        .green {
            color: green;
        }
    </style>
</head>
<body>
    <div id="app"></div>

    <script>
        function h(tag, props, children) {
            return {
                tag,
                props,
                children
            }
        }

        function mount(vnode, container) {
            const el = vnode.el = document.createElement(vnode.tag)

            // props
            if (vnode.props) {
                for (const key in vnode.props) {
                    const value = vnode.props[key]
                    el.setAttribute(key, value)
                }
            }

            // children
            if (vnode.children) {
                if (typeof vnode.children === 'string') {
                    el.textContent = vnode.children
                } else {
                    vnode.children.forEach(child => {
                        mount(child, el)
                    });
                }
            }

            container.appendChild(el)
        }

        const vdom = h('div', { class: 'red' }, [
            h('span', null, 'hello')
        ])

        const vdom2 = h('div', { class: 'green' }, [
            h('span', null, 'world')
        ])

        mount(vdom, document.getElementById('app'))

        // patch
        // function patch(oldV, newV) {}
        function patch(n1, n2) {
            if (n1.tag === n2.tag) {
                const el = n2.el = n1.el
                // props
                const oldProps = n1.props || {}
                const newProps = n2.props || {}
                for (const key in newProps) {
                    const oldValue = oldProps[key]
                    const newValue = newProps[key]
                    if (newValue !== oldValue) {
                        el.setAttribute(key, newValue)
                    }
                }

                for (const key in oldProps) {
                    if (!key in newProps) {
                        el.removeAttribute(key)
                    }
                }

                // children
                const oldChildren = n1.children
                const newChildren = n2.children
                if (typeof newChildren === 'string') {
                    if (typeof oldChildren === 'string') {
                        if (newChildren !== oldChildren) {
                            el.textContent = newChildren
                        }
                    } else {
                        el.textContent = newChildren
                    }
                } else {
                    if (typeof oldChildren === 'string') {
                        el.innerHTML = ''
                        newChildren.forEach(child => {
                            mount(child, el)
                        })
                    } else {
                        const commonLength = Math.min(oldChildren.length, newChildren.length)
                        for (let i = 0; i < commonLength; i++) {
                            patch(oldChildren[i], newChildren[i]) // 待优化，可参考源码
                        }
                        if (newChildren.length > oldChildren.length) {
                            newChildren.slice(oldChildren.length).forEach(child => {
                                mount(child, el)
                            })
                        } else if (newChildren.length < oldChildren.length) {
                            oldChildren.slice(newChildren.length).forEach(child => {
                                el.removeChild(child.el)
                            })
                        }
                    }
                }
            } else {
                // replace

            }
        }

        patch(vdom, vdom2)
    </script>
</body>
</html>
```
