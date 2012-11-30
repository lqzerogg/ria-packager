var path = require('path');
var fs = require('fs');
var dns = require('dns');
var qs = require('querystring');
var express = require('express');
var proxyRequest = require('./proxy');
var config = require('./config');
var combineOneJS = require('../js/combineOne');
var combineOneCSS = require('../css/combineOne');
var renderMustache = require('./renderMustache');

// host?a/b/c.js?v=123abc&debug
function isDebug(url) {
	return  ( 'debug' in qs.parse(url.split('?')[1]) );
}

module.exports = function() {
	var app = express();
    app.use(app.router);

    var url, project, cdnServerIP = config.ip;
    dns.resolve4(config.cdn, function(err, addresses) {
        if (err) {
            throw err;
        }
        cdnServerIP = addresses[0];
    });
    app.use(function(req, res, next) {
        //仿真模式,直接读取打包合并后的静态js,css,image
        url = config.documentRoot + req.url.split('?')[0];
        project = req.url.split('/')[1];
        if(req.url.lastIndexOf('.html') !== -1){
        	return renderMustache(req,res,config);
        }
        if (req.url.lastIndexOf('.js') !== -1 || req.url.lastIndexOf('.css') !== -1) {
            if (isDebug(req.url)) { //开发模式或者没有部署目标工程 
            	if (req.url.lastIndexOf('.js') !== -1) {
                    res.header('Content-Type', 'application/x-javascript;Charset=UTF-8');
                    if (fs.existsSync(url)) {
                        res.write(combineOneJS(url,{//req.url.split('/')[1] is  the project path
                        	root:path.join(config.documentRoot,project),
                        	beautify:true,//默认格式化输出代码
							mangle:false,//默认不压缩
							squeeze:false//默认不压缩优化
                        }), 'utf-8');
                        return res.end();
                    }
                } else {
                    res.header('Content-Type', 'text/css;Charset=UTF-8');
                    if (fs.existsSync(url)) {
                        res.write(combineOneCSS(url), 'utf-8');
                        return res.end();
                    }
                }
                config.autoProxy ? proxyRequest(req, res, cdnServerIP, config.port) : next();
            }else{//已经打包过,仿真模式
                next();
            }
        } else {
            if (fs.existsSync(url)) {
                next();
            } else {
            	//自动代理请求不存在的图片,swf等静态资源
                config.autoProxy ? proxyRequest(req, res, cdnServerIP, config.port) : next();
            }
        }
    });
    if (config.documentRoot) { //下面的2句必须在自定义路由规则之后
        app.use(express['static'](config.documentRoot));
        app.use(express.directory(config.documentRoot));
    }

    app.listen(config.port);
    console.log('ria worker server ' + process.pid + ' running on ' + config.port + ' port...');
};