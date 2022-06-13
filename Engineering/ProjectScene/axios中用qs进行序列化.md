## 什么时候需要用qs进行序列化

axios中的post请求方式在body中传输数据，在body中的数据格式又有两种，一种是 json 数据格式，另一种是 字符串。具体要用哪种格式取决于后端入参的格式。

如果后端接收json数据类型，post 的 headers 需要设置 { 'content-type': 'application/json' }，传给后端的数据就形如 { name: '名称', status: 1 };
如果后端接收的是（表单）字符串类型，post 的 headers 需设置 { 'content-type': 'application/x-www-form-urlencoded' }，传输给后端的数据就形如 'name=名称&status=1';

使用qs.stringfy() 可以将对象序列化成url的形式。

axios默认的content-type是application/json，所以:

1. 当后端需要接收json格式的数据时,post请求头不需要设置请求头，数据格式也不需要我们去转换(若数据已经是json);
2. 当后端需要接收字符串格式的数据时，我们需要给post请求头设置{ ‘content-type’: ’application/x-www-form-urlencoded’ }，
这个时候如果我们传的入参是一个 js 对象，这时候我们就需要用 qs 转换数据格式;

```
axios({
    url: '/asset/api/oauth/sso/v1/login',
    method: 'post',
    data: qs.stringify({
        username: 'admin',
        password: 'Dknh2yc!',
    }),
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
})
.then(function(response) {
    const { data: { data: { tokenValue }  } } = response;
    console.log('tokenValue: ', tokenValue);
})
.catch(function(error) {
    console.log(error);
});
```

## qs.parse方法

qs.parse()将URL解析成对象的形式；
```
let url = 'name:xxx&status:xxx'
console.log(qs.parse(url));
输出：
{
    name: xxx,
    status: xxx
}
```
