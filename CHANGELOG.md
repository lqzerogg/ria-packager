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