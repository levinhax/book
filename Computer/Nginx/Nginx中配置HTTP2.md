HTTP/2是HTTP协议的最新标准，它是HTTP/1.1的继承者。

在HTTP/2之上有很多特性可以为您提供更多优化网站/应用程序的可能性。它提供真正的多路复用和并发、更好的报头压缩（二进制编码）、更好的优先级、更好的流控制机制，以及一种称为“服务器推送”的新交互模式，使服务器能够将响应推送到客户端。**因此，HTTP/2的主要重点是减少整体网页加载时间，从而提高性能。它还关注网络和服务器资源的使用以及安全性，因为对于HTTP/2，SSL/TLS加密是强制性的。**

可以通过在所有的监听指令中添加http2参数来启用HTTP/2支持

```
# 主应用
server {
    listen    80  ssh http2;
    ssl       on;
    ssl_certificate  conf.d/cert.crt;
    ssl_certificate_key  conf.d/rsa_private.key;
    ssl_protocols TLSv1.2;

    server_name    localhost;
    location /{
        root    /root/aisort/front;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;

        expires -1;                          # 首页一般没有强制缓存
        add_header Cache-Control no-cache;
    }

    location /asset {
        proxy_pass http://asset:9012; # 接口地址(变量名为docker服务名)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header x_real_ipP $remote_addr;
        proxy_set_header remote_addr $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
        proxy_connect_timeout 3000s;
        proxy_read_timeout 3000s;
        proxy_send_timeout 3000s;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
    }
}
```
