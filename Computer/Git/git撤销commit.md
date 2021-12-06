我们写完代码后，一般会执行
```
git add .
git commit -m 'xxx'
```
如果我们commit后，还没有执行git push，想修改/撤销这个commit，怎么办？

### 只修改commit注释

git commit --amend
这个时候进入vim编辑，直接修改即可，修改完注释，退出vim编辑
:wq保存已编辑的注释，重新git push即可

### 要撤回commit

git reset --soft HEAD^
这样就能成功的撤回你刚刚的commit操作。

**补充**

--mixed

不删除工作空间改动代码，撤销commit，并且撤销git add . 操作
这个为默认参数，git reset --mixed HEAD^ 和 git reset HEAD^ 效果是一样的。

--soft  
不删除工作空间改动代码，撤销commit，不撤销git add .

--hard
删除工作空间改动代码，撤销commit，撤销git add .
