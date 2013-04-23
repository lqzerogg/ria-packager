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
