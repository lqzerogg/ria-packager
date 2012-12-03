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

process.on('uncaughtException', function(err) {
    console.error('Caught exception: ', err);
});

var pidPath = path.join(__dirname,'.pid');
fs.writeFile(pidPath, process.pid);

process.on('SIGTERM', function() {//SIGKILL是kill -9 的信号,无法捕获; SIGTERM是kill的信号,可以捕获
  console.log('HTTPD killed');
  
  fs.unlink(pidPath,function(){
    process.exit(0);
  });
});

process.title = 'ria-server';//linux only


var app = express();
app.use(app.router);

app.get('/favicon.ico',function(req, res){
    fs.readFile(path.join(__dirname,'favicon.ico'), function (err, data) {
      if (err) throw err;
      res.end(data);
    });
});

var isDebug = true;
app.get('/admin/:mod',function(req, res){
    res.writeHead(200, {
        'Content-Type': 'text/html;charset=utf-8'
    });
    var mod = req.params['mod'];
    if(mod === 'debug'){
        isDebug = true;
        res.write('<b>server running in debug mod.</b>');
    }
    if(mod === 'release'){
        isDebug = false;
        res.write('<b>server running in release mod.</b>');
    }
    res.end('<ul><li><a href="/admin/debug">set debug mod</a></li><li><a href="/admin/release">set release mod</a></li></ul>');
});


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
    var ext  = path.extname(req.url.split('?')[0]);
    if(ext === '.html'){
        return renderMustache(req,res,config);
    }
    if (ext === '.js' || ext === '.css') {
        if (ext === '.js') {
            res.header('Content-Type', 'application/x-javascript;Charset=UTF-8');
            if (fs.existsSync(url)) {
                res.write(combineOneJS(url,{//req.url.split('/')[1] is  the project path
                    root:path.join(config.documentRoot,project),
                    debug : isDebug
                }), 'utf-8');
                return res.end();
            }
        } else {
            res.header('Content-Type', 'text/css;Charset=UTF-8');
            if (fs.existsSync(url)) {
                res.write(combineOneCSS(url,{
                    debug : isDebug
                }), 'utf-8');
                return res.end();
            }
        }
        config.autoProxy ? proxyRequest(req, res, cdnServerIP, config.port) : next();
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
console.log('ria  server (pid: ' + process.pid + ') running on ' + config.port + ' port...');