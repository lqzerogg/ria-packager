#前端打包系统:批量压缩,合并js,css. #
 1. 合并`require('a/b/c.js');`
 2. 合并`@import url("a/b/c.css");` 其中会重新计算背景图片相对地址
 3. 计算文件md5值，用于缓存版本号。
    1. 替换背景图片地址 `background-image: url(../../img/sprite-new.png?v=md5-hash);`
    2. 生成js，css 文件内容md5映射(`md5_mapping.json`)，可用于更新或者回滚版本号。

#通过npm安装:
  npm install ria-packager 

#usage:
 `node index.js -from ~/code/litb-fe-prototype/src/ -to /tmp/dist/ -v `
 
#辅助开发服务器
1. 启动服务器: `node httpd.js` or `sh restart.sh`
2. 浏览器访问 /admin/debug 即可设置服务器环境为开发模式，此时按需动态合并js，css，但不压缩不混淆代码。
3. 浏览器访问 /admin/release 即可设置服务器环境为生产发布模式，此时按需动态合并，压缩（混淆）js，css。


#note:
安装express 3.0.3
`npm install -g express@3.0.3`