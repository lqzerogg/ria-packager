#前端打包系统:批量压缩,合并js,css. #
 1. 合并require('a/b/c.js');
 2. 合并@import url("a/b/c.css"); 其中会重新计算背景图片相对地址
 3. 计算文件md5值，用于缓存版本号。
    1. 替换背景图片地址 background-image: url(../../img/sprite-new.png?v=md5-hash);
    2. 生成js，css 文件内容md5映射，可用于更新或者回滚版本号。

#通过npm安装:
  npm install ria-packager 