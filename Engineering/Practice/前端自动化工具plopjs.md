# 为什么使用 plop

一般项目开发过程中，我们都需要编写(CV)一大堆重复的代码，比如列表查询、store/modules/xx.js，有时还要去修改删除无用代码，比较麻烦，我们就需要一个自动生成的工具来帮助我们提效。

# 什么是plop

![plop](https://github.com/plopjs/plop)是一款可用于创建项目中特定文件类型的小工具，类似于Yeoman中的sub generator，一般不会独立使用。我们可以把Plop集成到项目中，用来自动化的创建同类型的项目文件。

# plop配置

## 根目录下创建plopfile.js
```
module.exports = function (plop) {
  plop.setWelcomeMessage('请选择需要创建的模式：')
  plop.setGenerator('page', require('./plop-tpls/page/prompt'))
  plop.setGenerator('component', require('./plop-tpls/component/prompt'))
}
```

## 创建模板文件
plop-tpls/page/index.hbs
```
<script setup lang="ts">
// const { proxy } = getCurrentInstance()
// const router = useRouter()
// const route = useRoute()
</script>

<template>
  <div>
    <h1>{{upperCase name}} 页面</h1>
  </div>
</template>

<style lang="less" scoped>
@import './index.less';
</style>
```

## 生成器配置
plop-tpls/page/prompt.js
```
const path = require('path')
const fs = require('fs')

function getFolder(dirPath) {
  const components = []
  const files = fs.readdirSync(dirPath)
  files.forEach(function (item) {
    const stat = fs.lstatSync(dirPath + '/' + item)
    if (stat.isDirectory() === true && item != 'components') {
      components.push(dirPath + '/' + item)
      components.push(...getFolder(dirPath + '/' + item))
    }
  })
  return components
}

module.exports = {
  description: '新建页面',
  prompts: [
    {
      type: 'list',
      name: 'dirPath',
      message: '请选择页面创建目录',
      choices: getFolder('src/views'),
    },
    {
      type: 'input',
      name: 'name',
      message: '请输入文件名',
      validate: v => {
        if (!v || v.trim === '') {
          return '文件名不能为空'
        } else {
          return true
        }
      },
    },
  ],
  actions: data => {
    let relativePath = path.relative('src/views', data.dirPath)

    let pagePath = '',
      lessPath = ''
    pagePath = `${data.dirPath}/{{properCase name}}/index.vue` // dotCase、properCase、kebabCase、camelCase、lowerCase
    lessPath = `${data.dirPath}/{{properCase name}}/index.less`

    const actions = [
      {
        type: 'add',
        path: pagePath,
        templateFile: 'plop-tpls/page/index.hbs',
        data: {
          componentName: `${relativePath} ${data.name}`,
        },
      },
      {
        type: 'add',
        path: lessPath,
        templateFile: 'plop-tpls/page/less.hbs',
      },
    ]
    return actions
  },
}
```

修改package.json
```
{
    "scripts": {
        "plop": "plop"
    },
}
```

[创建文件](images/027.gif)
