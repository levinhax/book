### 缘由

在做后台管理系统时，经常会遇到非常复杂的表单，比如：

- 表单项非常多
- 在表单项值不同时，会显示不同的表单项
- 在某些条件下，会关闭某些表单项的校验
- 每个表单项还会有其他自定义逻辑，比如 图片上传并显示、富文本、插入模板变量等
- 复杂情况下表单的验证和提交问题

### 方案一

所有的表单项显示隐藏、验证、数据获取、提交、自定义等逻辑放在一起

- v-if/v-show
- resetFields()
- validate()

你会发现最后实现下来，一个Vue文件轻松上千行，非常的乱！乱！乱！

### 方案二

分离组件，根据不同的表单类型，分离出多个相应类型的子表单，最重要的就是对父子表单验证、整体提交数据的获取等问题的处理。

#### 子组件

所有的子组件中都需要包含两个方法 validate 、 getData 供父组件调用。

**validate方法**

用于验证本身组件的表单项，并返回一个promise对象
```
vaildate() {
    // 返回`UI库`表单验证的结果（为`promise`对象）
    return this.$refs["ruleForm"].validate();
},
```

**getData方法**

返回子组件中的数据

```
getData() {
    // 返回子组件的form
    return this.ruleForm;
},
```

#### 父组件

**策略模式**

定义一系列的算法，把它们一个个封装起来，并且使它们可以相互替换，这种就是策略模式。

比如一个压缩文件的程序，既可以选择zip算法，也可以选择gzip算法。这些算法灵活多样，而且可以随意互相替换。

使用策略模式存储并获取子表单的ref(用于获取子表单的方法)和提交函数 。省略了大量的if-else判断。

```
data:{
    // type和ref名称的映射
    typeRefMap: {
        mail: 'mail',
        phone: 'phone',
    },
    // 模拟的不同类型表单的提交
    fakeSubmit: {
        mail: data => alert(`邮箱类型提交创建成功${JSON.stringify(data)}`),
        phone: data => alert(`手机类型提交创建成功${JSON.stringify(data)}`),
    },
}
```

**submit方法**

用于父子组件表单验证、获取整体数据、调用当前类型提交函数提交数据。

*因为 UI库 表单验证的 validate 方法可以返回 promise 结果，可以利用 promise 的特性来处理父子表单的验证。 比如 then 函数可以返回另一个 promise 对象、 catch 可以获取它以上所有 then 的 reject、 Promise.all。*

父表单验证通过才会验证子表单，存在先后顺序。
```
// 父表单验证通过才会验证子表单，存在先后顺序
submitForm() {
    const templateType = this.typeRefMap[this.formInline.type];
    this.$refs["ruleForm"]
    .validate()
    .then(res => {
        // 父表单验证成功后，验证子表单
        return this.$refs[templateType].vaildate();
    })
    .then(res => {
        // 全部验证通过
        // 获取整体数据
        const reqData = {
            // 获取子组件数据
            ...this.$refs[templateType].getData(),
            ...this.formInline
        };
        // 获取当前表单类型的提交函数，并提交
        this.fakeSubmit[this.formInline.type](reqData);
    })
    .catch(err => {
        console.log(err);
        this.$message.error('信息校验失败');
    });
},
```

父表单，子表单一起验证
```
    // 父表单，子表单一起验证
    handleSubmitForm1() {
      console.log('数据提交');
      const templateType = this.typeRefMap[this.formInline.type];
      const validate1 = this.$refs['ruleForm'].validate();
      const validate2 = this.$refs[templateType].vaildate();

      Promise.all([validate1, validate2])
        .then(res => {
          // 都通过时，发送请求
          console.log('res: ', res); // true
          if (res) {
            const reqData = {
              ...this.$refs[templateType].getData(),
              ...this.formInline,
            };
            this.fakeSubmit[this.formInline.type](reqData);
          }
        })
        .catch(err => {
          console.log('err: ', err);
          this.$message.error('信息校验失败');
        });
    },
```

### 方案三

把数据提交的方法放在每一个子组件中，公共的表单项数据通过props传递给子组件用于提交
