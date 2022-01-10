PyMuPDF（又称“ fitz”）：MuPDF的Python绑定，这是一种轻量级的PDF和XPS查看器。该库可以访问PDF，XPS，OpenXPS，epub，漫画和小说书格式的文件，并且以其最佳性能和高渲染质量而闻名。

PyMuPDF使用该方法简化了从PDF文档提取图像的过程getPageImageList()。如果图像具有CMYK色彩空间，则将首先将其转换为RGB。

### 具体实现

```
#!/usr/bin/python

import fitz

pdf_document = fitz.open("./images/20220110.pdf")
for current_page in range(len(pdf_document)):
    for image in pdf_document.get_page_images(current_page):
        xref = image[0]
        pix = fitz.Pixmap(pdf_document, xref)
        if pix.n < 5:        # this is GRAY or RGB
            pix.save("page%s-%s.png" % (current_page, xref))
        else:                # CMYK: convert to RGB first
            pix1 = fitz.Pixmap(fitz.csRGB, pix)
            pix1.save("page%s-%s.png" % (current_page, xref))
            pix1 = None
        pix = None
```
