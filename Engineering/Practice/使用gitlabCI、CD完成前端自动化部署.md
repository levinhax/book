.gitlab-ci.yml
```
stages: # 分段
  - preInstall
  - install
  - build
  - deploy

cache: # 缓存
  paths:
    - node_modules
    - admin

preInstall-job:
  stage: preInstall
  only:
    refs:
      - prod-pre
    changes:
      - package.json
  script:
    - echo "依赖发生变化,开始install🔥🔥🔥"
    - cnpm install
    - echo "完成install🔥🔥🔥"

install-job:
  stage: install
  only:
    refs:
      - prod-pre
  script:
    - echo "开始install🔥🔥🔥"
    - if [ ! -d "./node_modules/" ];then   cnpm install;   else   echo "缓存存在,跳过install"; fi
    - echo "完成install🔥🔥🔥"

build-job:
  stage: build
  only:
    - prod-pre
  script:
    - echo "开始代码打包💪💪💪"
    - npm run build
    - echo "完成代码打包💪💪💪"

deploy-job:
  stage: deploy
  only:
    - prod-pre
  before_script:
    - echo "发射到目标服务器✨✨✨"
  script:
    - sshpass -p $PASSWORD scp -o StrictHostKeyChecking=no -r ./admin/. $USERNAME@$HOST:$UPLOADDIR/dist/ # 将打包完成的文件复制到目标服务器
    - sshpass -p $PASSWORD ssh -o StrictHostKeyChecking=no $USERNAME@$HOST rm -rf $UPLOADDIR/dist_plus # 删除原有文件
    - sshpass -p $PASSWORD ssh -o StrictHostKeyChecking=no $USERNAME@$HOST mv $UPLOADDIR/dist $UPLOADDIR/dist_plus # 将目标文件改为服务端真正文件
  after_script:
    - echo "完成更新👏👏👏"
```


Dockerfile
```
# 这里说明我们的基础镜像是nginx
# 如同上面所说，不懂的可以简单理解为我们下面的所有任务是在一个有nginx环境的虚拟机里完成的
FROM nginx
# nginx的默认访问目录是/usr/share/nginx/html
# 所以我们只要把打包好的dist复制到对应目录下就可以
COPY dist /usr/share/nginx/html
```
