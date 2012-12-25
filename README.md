#前端打包系统:批量压缩,合并js,css. #
 1. 合并`require('a/b/c.js');`
 2. 合并`@import url("a/b/c.css");` 重新计算背景图片相对地址. 剔除重复@import (目前策略是保留第一个css；以前是保留最后一个)
 3. 计算文件md5值，用于缓存版本号。
    1. 替换背景图片地址 `background-image: url(../../img/sprite-new.png?v=md5-hash);`
    2. 生成js，css 文件内容md5映射(`md5_mapping.json`)，可用于更新或者回滚版本号。

#通过npm安装:
  `npm install ria-packager` 

#构建静态资源（合并，压缩js，css）:
 `node index.js -from ~/workspace/litb_ria/mobile/trunk/   -to /tmp/mobile/ -v `
 1. -from 参数 指明要打包的工程根目录
 2. -to 参数 指明输出目录（可以是任意临时目录）
 
#辅助开发服务器（用于开发测试，联调）
1. 修改lib/server/config.js
2. 启动服务器: `node lib/server/httpd.js` or `sh lib/server/restart.sh`
3. 浏览器访问 /admin/debug 即可设置服务器环境为开发模式，此时按需动态合并js，css，但不压缩不混淆代码。
4. 浏览器访问 /admin/release 即可设置服务器环境为生产发布模式，此时按需动态合并，压缩（混淆）js，css。

##模板测试数据及自定义模板容器：##
1. 渲染widget和pagelet时，会在模板文件父目录下查找_test/_layout.html，如果存在该模板，就使用它作为wiget的父模板。
2. 模板文件父目录下 _test/下所有.json文件会自动显示在模板数据select中，供切换以测试不同数据渲染效果。
3. 模板文件父目录下 _test/下与模板文件同名的.json文件为默认渲染模板所使用的数据文件。
