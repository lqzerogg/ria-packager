var path = require('path');
var os = require('os');
var fs = require('fs');
var express = require('express');
var less = require('less');

var combineOneJS = require('../js/combineOne');
var combineOneCSS = require('../css/combineOne');
var combineOneLess = require('../less/combineOne');
var renderMustache = require('./renderMustache');
var deploy = require('./deploy');

var conf = require("argsparser").parse();
var config = {
    documentRoot    : conf['-root'] && conf['-root'] !== 'undefined'? conf['-root'] : process.cwd(),
    port            : parseInt(conf['-port']) || 8888
};

process.on('uncaughtException', function(err) {
    console.error('Caught exception: ', err);
});

var pidPath = path.join(os.tmpDir(), '.node_pid');
fs.writeFile(pidPath, process.pid);

process.on('SIGTERM', function() { //SIGKILL是kill -9 的信号,无法捕获; SIGTERM是kill的信号,可以捕获
    console.log('HTTPD killed');

    fs.unlink(pidPath, function() {
        process.exit(0);
    });
});

process.title = 'ria-server'; //linux only
var app = express();
app.use(app.router);

var isDebug = true;
app.get('/admin/:mod', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html;charset=utf-8'
    });
    var mod = req.params['mod'];
    if (mod === 'debug') {
        isDebug = true;
        res.write('<b>server running in debug mod.</b>');
    }
    if (mod === 'release') {
        isDebug = false;
        res.write('<b>server running in release mod.</b>');
    }
    res.end('<ul><li><a href="/admin/debug">set debug mod</a></li><li><a href="/admin/release">set release mod</a></li></ul>');
});

app.get('/favicon.ico', function(req, res) {
    res.end('');
});
app.get('/download/:file(*)', function(req, res) {
    var file = req.params.file;
    if (fs.existsSync(file)) {
        res.download(file, path.basename(file), function(err) {
            if (err) {
                throw err;
            }
            fs.unlinkSync(file);
        });
    } else {
        res.send(404, 'Sorry,cannot find ' + file + ' <a href="/">return</a>');
    }
});

app.get('*.css',function(req, res){
    var file = path.join(config.documentRoot, req.url.split('?')[0]);
    if (fs.existsSync(file)) {
        res.header('Content-Type', 'text/css;Charset=UTF-8');
        res.end(combineOneCSS(file, {
            root : config.documentRoot,
            debug : isDebug
        }), 'utf-8');
    }else{
        res.redirect(req.url.split('?')[0].replace('.css', '.less'));
    }
});

app.get("*.less", function(req, res) {
    var file = path.join(config.documentRoot, req.url.split('?')[0]);
    combineOneLess({
        file    : file,
        req     : req,
        res     : res,
        debug   : isDebug,
        callback: function(css){
            res.header("Content-Type", "text/css");
            res.end(css, 'utf-8');
        }
    });
});

var url, project, root;
app.use(function(req, res, next) {
    project = req.url.split('?')[0].split('/')[1];
    root = path.join(config.documentRoot, project);
    if ('/' + project + '/deploy' === req.url.split('?')[0]) {
        return deploy(req, res, project, config);
    }

    //concat multi js or css. see `nginx-http-concat` module
    if (req.url.indexOf('??') !== -1) {
        var list = req.url.split('??')[1].split(',');
        if(list[0] && path.extname(list[0]) === '.js'){
            res.header('Content-Type', 'application/x-javascript;Charset=UTF-8');
        }else{
            res.header('Content-Type', 'text/css;Charset=UTF-8');
        }

        var length = list.length;
        list.forEach(function(file,index) {
            file = path.join(config.documentRoot, project, file.split('?')[0]);
            switch (path.extname(file)) {
            case '.js':
                res.write(combineOneJS(file, {
                    root: root,
                    debug: isDebug
                }), 'utf-8');

                if(index === length -1){
                    res.end();
                }
                break;
            case '.css':
                if (fs.existsSync(file)) {
                    res.write(combineOneCSS(file, {
                        root: root,
                        debug: isDebug
                    }), 'utf-8');

                    if(index === length -1){
                        res.end();
                    }
                }else{
                    combineOneLess({
                        file    : file.replace('.css','.less'),
                        req     : req,
                        res     : res,
                        debug   : isDebug,
                        callback: function(css){
                            res.write(css, 'utf-8');
                            if(index === length -1){
                                res.end();
                            }
                        }
                    });
                }
                
                break;
            }
        });
        return;
    }
    url = path.join(config.documentRoot, req.url.split('?')[0]);

    var ext = path.extname(req.url.split('?')[0]);

    if (ext === '.html') {
        return renderMustache(req, res, config);
    }
    if (ext === '.js' && fs.existsSync(url)) {
        res.header('Content-Type', 'application/x-javascript;Charset=UTF-8');
        res.end(combineOneJS(url, {
            root: root,
            debug: isDebug
        }), 'utf-8');
    }else {
        next();
    }
});
if (config.documentRoot) { //下面的2句必须在自定义路由规则之后
    app.use(express['static'](config.documentRoot));
    app.use(express.directory(config.documentRoot));
}

app.listen(config.port);
console.log('################################################');
console.log('ria  server (pid: ' + process.pid + ') started! please visit http://127.0.0.1:' 
    + config.port + ' . documentRoot is: ' + config.documentRoot);
console.log('################################################');