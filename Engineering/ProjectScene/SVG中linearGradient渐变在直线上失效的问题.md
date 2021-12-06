## 问题描述

对 x1=x2（没有宽度）或者 y1=y2（没有高度）的直线（line 以及 path，如果，stroke 里使用的是渐变效果，那么，在各种浏览器上都会出现同一个 BUG，这条线会消失。

## 解决方案

为 linearGradient 加上属性 gradientUnits="userSpaceOnUse"

关键字 objectBoundingBox，在元素没有宽度或者高度的时候，会失去作用。
linearGradient 渐变又依赖这个属性，所以失效了。

gradientUnits 是用于规定元素的坐标系统的，有两个属性值 userSpaceOnUse 和 objectBoundingBox，后者是默认值。

```
<div class="box1">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <!-- 水平渐变 -->
          <linearGradient
            id="grad1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0%"
              style="stop-color: rgba(217, 165, 53, 0.1); stop-opacity: 1"
            />
            <stop
              offset="100%"
              style="stop-color: rgba(244, 186, 62, 1); stop-opacity: 1"
            />
          </linearGradient>
        </defs>

        <!-- 直线水平渐变 -->
        <line
          x1="0"
          y1="0"
          x2="200"
          y2="0"
          stroke="url(#grad1)"
          fill="none"
          stroke-dasharray="5 2"
          stroke-width="5"
        />
      </svg>
    </div>

    <div class="box2">
        <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <!-- 水平渐变 -->
          <linearGradient
            id="grad2"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              style="stop-color: rgba(217, 165, 53, 0.1); stop-opacity: 1"
            />
            <stop
              offset="100%"
              style="stop-color: rgba(244, 186, 62, 1); stop-opacity: 1"
            />
          </linearGradient>
        </defs>

        <!-- 直线水平渐变 -->
        <!-- 如果没有 gradientUnits="userSpaceOnUse"属性，x1=x2或者y1=y2会消失线条，只可以画斜线的渐变   -->
        <line
          x1="0"
          y1="0"
          x2="200"
          y2="1"
          stroke="url(#grad2)"
          fill="none"
          stroke-dasharray="5 2"
          stroke-width="5"
        />
      </svg>
    </div>
```

## 参考

gradientUnits[https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/gradientUnits]
