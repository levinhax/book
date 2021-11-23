最近做项目的时候，配置都是js文件格式，然而基于某种特殊原因，需要将这些文件改为json文件格式。
但是json字符串会挤压在一起，不美观。

我们只需要在转换的时候做一下配置。

```
JSON.stringify(value[, replacer [, space]])
```

```
let pkgFile = 'package.json';
const pkgJson = await fs.readJson('pkgFile', { throws: false })

fs.writeFileSync('pkgFile', JSON.stringify(pkgJson, null, 2))
```
