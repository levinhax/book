## CSRF 介绍

CSRF，是跨站请求伪造（Cross Site Request Forgery）的缩写，是一种劫持受信任用户向服务器发送非预期请求的攻击方式。

通常情况下，CSRF 攻击是攻击者借助受害者的 Cookie 骗取服务器的信任，在受害者毫不知情的情况下以受害者名义伪造请求发送给受攻击服务器，从而在并未授权的情况下执行在权限保护之下的操作。

什么是跨站请求伪造呢？比如用户登录一个正常的网站后，由于没有退出该正常网站，cookie信息还保留，然后用户去点击一个危险的网站页面，那么这个时候危险网站就可以拿到你之前登录的cookie信息。然后使用cookie信息去做一些其他事情。

## CSRF可以做什么

我们可以这么理解CSRF攻击：**攻击者盗用了你的身份，以你的名义发送恶意请求。**CSRF能够做的事情包括：以你名义发送邮件，发消息，盗取你的账号，甚至于购买商品，虚拟货币转账......造成的问题包括：个人隐私泄露以及财产安全。

## CSRF 攻击示例

### 示例1

银行网站A，它以GET请求来完成银行转账的操作，如：http://www.mybank.com/Transfer.php?toBankId=11&money=1000

危险网站B，它里面有一段HTML的代码如下：
```
<img src=http://www.mybank.com/Transfer.php?toBankId=11&money=1000>
```

首先，你登录了银行网站A，然后访问危险网站B，噢，这时你会发现你的银行账户少了1000块......

为什么会这样呢？原因是银行网站A违反了HTTP规范，使用GET请求更新资源。在访问危险网站B的之前，你已经登录了银行网站A，而B中的<img>以GET的方式请求第三方资源（这里的第三方就是指银行网站了，原本这是一个合法的请求，但这里被不法分子利用了），所以你的浏览器会带上你的银行网站A的Cookie发出Get请求，去获取资源"http://www.mybank.com/Transfer.php?toBankId=11&money=1000"，结果银行网站服务器收到请求后，认为这是一个更新资源操作（转账操作），所以就立刻进行转账操作......

### 示例2

为了杜绝上面的问题，银行决定改用POST请求完成转账操作。

但是B网站也与时俱进，也使用post请求接口，它使用的是隐藏form表单进行模拟post请求：
```
<form id="aaa" action="http://www.xxx.com/transfer.do" metdod="POST" display="none">
    <input type="text" name="accountNum" value="10001"/>
    <input type="text" name="money" value="10000"/>
</form>
<script>
    var form = document.forms('aaa');
    form.submit();
</script>
```
当我们点击危险链接的时候，很不幸，结果将会是再次不见1000块......因为这里危险网站B暗地里发送了POST请求到银行!

## CSRF 防范措施

### SameSite 属性

Cookie 的 SameSite 属性用来限制第三方 Cookie，从而减少安全风险，可以用来防止 CSRF 攻击和用户追踪。

#### Strict

Strict最为严格，完全禁止第三方 Cookie，跨站点时，任何情况下都不会发送 Cookie。换言之，只有当前网页的 URL 与请求目标一致，才会带上 Cookie。
```
Set-Cookie: CookieName=CookieValue; SameSite=Strict;
```

这个规则过于严格，可能造成非常不好的用户体验。比如，当前网页有一个 GitHub 链接，用户点击跳转就不会带有 GitHub 的 Cookie，跳转过去总是未登陆状态。

#### Lax

Lax 规则稍稍放宽，大多数情况也是不发送第三方 Cookie，但是导航到目标网址的 Get 请求除外。
```
Set-Cookie: CookieName=CookieValue; SameSite=Lax;
```

#### None

Chrome 计划将 Lax 变为默认设置。这时，网站可以选择显式关闭 SameSite 属性，将其设为 None 。不过，前提是必须同时设置 Secure 属性（Cookie 只能通过 HTTPS 协议发送），否则无效。
```
Set-Cookie: widget_session=abc123; SameSite=None; Secure
```

### 将cookie设置为HttpOnly

CRSF攻击很大程度上是利用了浏览器的cookie，为了防止站内的XSS漏洞盗取cookie,需要在cookie中设置“HttpOnly”属性，这样通过程序（如JavaScript脚本、Applet等）就无法读取到cookie信息，避免了攻击者伪造cookie的情况出现。

在Java的Servlet的API中设置cookie为HttpOnly的代码如下：
```
response.setHeader( "Set-Cookie", "cookiename=cookievalue;HttpOnly");
```

### 同源检测

在 HTTP 协议中，每一个异步请求都会携带两个 Header ，用于标记来源域名：

- Origin Header
- Referer Header

这两个 Header 在浏览器发起请求时，大多数情况会自动带上，并且不能由前端自定义内容。 服务器可以通过解析这两个 Header 中的域名，确定请求的来源域。

通过校验请求的该字段，我们能知道请求是否是从本站发出的。我们可以通过拒绝非本站发出的请求，来避免了 CSRF 攻击。

### 验证码

CSRF 攻击往往是在用户不知情的情况下成功伪造请求。而验证码会强制用户必须与应用进行交互，才能完成最终请求，而且因为 CSRF 攻击无法获取到验证码，因此通常情况下，验证码能够很好地遏制 CSRF 攻击。但是会影响用户体验。

### 添加 Token 验证

CSRF 攻击之所以能够成功，是因为攻击者可以完全伪造用户的请求，该请求中所有的用户验证信息都是存在于 Cookie 中，因此攻击者可以在不知道这些验证信息的情况下直接利用用户自己的 Cookie 来通过安全验证。
要抵御 CSRF，关键在于在请求中放入攻击者所不能伪造的信息，并且该信息不存在于 Cookie 之中。

可以在 HTTP 请求中以参数的形式加入一个随机产生的 Token，并在服务器端建立一个拦截器来验证这个 Token，如果请求中没有 Token 或者 Token 内容不正确，则认为可能是 CSRF 攻击而拒绝该请求。

### 尽量使用post，限制get
