学习了canvas的相关知识点后还没有怎么应用，现在开始一系列的实战练习，利用简单的数学和物理知识点实现一些比较有趣的动画效果。

在一步一步进行代码具体实践的同时，让我们一起进入神奇的Canvas动画世界，先从实现一个进度条的开始。

代码整理已上传至 [Github](https://github.com/levinhax/mback-opens)，可以拉下来后直接运行。

### 一、复习requestAnimationFrame

window.requestAnimationFrame()方法提供了更加平缓并更加有效率的方式来执行动画，当系统准备好了重绘条件的时候，才调用绘制动画帧。一般每秒钟回调函数执行60次，也有可能会被降低。

函数使用注意点:

1. 若想在浏览器下次重绘之前继续更新下一帧动画，那么回调函数自身必须再次调用requestAnimationFrame();
2. 为了提高性能和电池寿命，因此在大多数浏览器里，当requestAnimationFrame() 运行在后台标签页或者隐藏的iframe里时，requestAnimationFrame() 会被暂停调用以提升性能和电池寿命;

### 二、分析

水平进度条就像画一个矩形，矩形慢慢的变长，同时数字在不停的变大直到100%。

分析结果：

- 先画一条宽度12px的灰色线;
- 再画一条同样宽度同样长度且同样位置的进度线，且使用 requestAnimationFrame 让进度线慢慢增长;
- 在画进度线段的同时，绘制变化的数值;

### 三、实现

```
function LineProgressBar() {
    const canvasRef = useRef(undefined);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        let myReq: number;
        const animate = () => {
            if (progress <= 300) {
                setProgress(progress + 1);
                drawProgress(ctx, progress, width, height);
                drawText(ctx, progress, width);
                myReq = requestAnimationFrame(animate);
            }
        }
        myReq = requestAnimationFrame(animate);
        // 最后要return一下，清除定时器
        return () => window.cancelAnimationFrame(myReq);
    }, [progress]);

    const drawBg = (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#ccc';
        ctx.lineTo(30, 120);
        ctx.lineTo(330, 120);
        ctx.stroke();
        ctx.closePath();
    };

    function drawProgress(ctx: CanvasRenderingContext2D, progress: number, width: number, height: number) {
        ctx.clearRect(0, 0, width, height);
        drawBg(ctx);
        // 开始绘制绿色线段
        ctx.beginPath();
        ctx.lineWidth = 12; // 设置线宽
        ctx.strokeStyle = '#dd6200'; // 画笔颜色
        ctx.lineTo(30, 120);
        ctx.lineTo(30 + progress, 120);
        ctx.stroke();
        ctx.closePath();
    }

    const drawText = (ctx: CanvasRenderingContext2D, progress: any, width: number) => {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.fillStyle = '#4a4a4a';
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((progress / 3).toFixed(0) + '%', width / 2, 160);
        ctx.fill();
        ctx.closePath();
    };

    return <canvas ref={canvasRef} width='360' height='320'></canvas>;
}
```
