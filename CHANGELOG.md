v2.1.5
==================
1. shwo file size before and after compressing .png 
2. windows下打包时,生成md5_mapping.json时文件路径统一使用`/` 

v2.1.4
==================
1. js目录下仅保留i18n子目录下js
2. less目录下仅保留i18n and theme 子目录下js

v2.1.3
==================
1. fix bug when encode img


v2.1.2
==================
1. default will rewrite static file name(.js, .css, img. but does't rewrite .html file name)
2. you can pass `-noRewriteFileName` option to avoid rewrite file name.
3. img name in .less will also be rewrited(if no `-noRewriteFileName` option).

v2.0.9
==================
1. fix bug when process .css

v2.0.8
==================
1. 打包时不处理widget和pagelet这2个目录
2. 简化js和css批处理逻辑
3. add debugWindow to edit json data.
4. 把page目录下的mustache模板引用的子模板合并到page mustache .html

v2.0.7
==================
1. fix bug in @import,eg: @import url("http://fonts.googleapis.com/css?family=Lato:400,700,700italic,900,400italic,300");

v2.0.6
==================
1. add <meta http-equiv="X-UA-Compatible" content="IE=edge" /> to fix IE9's bug.

v2.0.5
==================
1. add tools/compressImg.js to compress *.png

v2.0.4
==================
1. merge global_config  .json  to data

v2.0.3
==================
1. less中背景图片自动加md5版本号

v2.0.2
==================
1. 打包时不再分离mustache模板和静态资源

v2.0.1
==================
1. 使用相对路径，不做静态资源的动态合并

v2.0.0
==================
1. url请求参数有?dev=true 时递归获取mustache子模板原始内容.并且在widget和pagelet模块上下附加头尾，引入静态资源

v1.9.9
==================
1. url请求参数有?raw=true 时递归获取mustache子模板原始内容.如 http://127.0.0.1:8888/lightsource/widget/reviews/helpful_item/main.html?raw=true 

v1.9.8
==================
1.json文件中可以使用`require('a/b/c.json')`形式嵌套加载子.json文件。如`"attachments" : require("widget/reviews/attachments/_test/main.json").attachments`

v1.9.5
==================
1. can use relative background-img


v1.9.4
==================
1. add readline for cli


v1.9.3
==================
1. generate absolute background-img url for combined .less

v1.9.0 
==================
1. 彻底解决背景图片在合并后的less文件中相对路径问题: modify less/lib/less/parser.js and less/tree/url.js
2. 静态文件目录列表兼容ie浏览器: modify express/node_modules/connect/lib/public/directory.html
3. 支持page动态合并js，css URL. modify lib/server/renderMustache.js
