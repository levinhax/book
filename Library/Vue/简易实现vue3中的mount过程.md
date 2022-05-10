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
            const el = document.createElement(vnode.tag)

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

        mount(vdom, document.getElementById('app'))
    </script>
</body>
</html>
```
