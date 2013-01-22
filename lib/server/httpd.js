var path = require('path');
var fs = require('fs');
var express = require('express');
var less = require('less');

var config = require('./config');
var combineOneJS = require('../js/combineOne');
var combineOneCSS = require('../css/combineOne');
var renderMustache = require('./renderMustache');
var deploy = require('./deploy');

process.on('uncaughtException', function(err) {
    console.error('Caught exception: ', err);
});

var pidPath = path.join(__dirname, '.pid');
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

app.get('/favicon.ico', function(req, res) {
    fs.readFile(path.join(__dirname, 'favicon.ico'), function(err, data) {
        if (err) throw err;
        res.end(data);
    });
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

var url, project, root;
app.use(function(req, res, next) {
    project = req.url.split('?')[0].split('/')[1];
    root = path.join(config.documentRoot, project);
    if ('/' + project + '/deploy' === req.url.split('?')[0]) {
        return deploy(req, res, project, config);
    }

    //concat multi js or css. see nginx-http-concat module
    if (req.url.indexOf('??') !== -1) {
        var list = req.url.split('??')[1].split(',');
        var length = list.length, cssList = [];
        console.log(length)
        list.forEach(function(file) {
            length--;
            file = path.join(config.documentRoot, project, file.split('?')[0]);
            switch (path.extname(file)) {
            case '.js':
                res.write(combineOneJS(file, {
                    root: root,
                    debug: isDebug
                }), 'utf-8');
                if(length === 0){
                    res.end();
                }
                break;
            case '.css':
                res.write(combineOneCSS(file, {
                    root: root,
                    debug: isDebug
                }), 'utf-8');
                break;
            }
        });
        return res.end();
    }
    url = path.join(config.documentRoot, req.url.split('?')[0]);

    var ext = path.extname(req.url.split('?')[0]);

    if (ext === '.html') {
        return renderMustache(req, res, config);
    }
    if (ext === '.js' || ext === '.css') {
        switch (ext) {
        case '.js':
            res.header('Content-Type', 'application/x-javascript;Charset=UTF-8');
            if (fs.existsSync(url)) {
                res.write(combineOneJS(url, { //req.url.split('/')[1] is  the project path
                    root: root,
                    debug: isDebug
                }), 'utf-8');
                res.end();
            }
            break;
        case '.css':
            res.header('Content-Type', 'text/css;Charset=UTF-8');
            if (fs.existsSync(url)) {
                res.write(combineOneCSS(url, {
                    root: root,
                    debug: isDebug
                }), 'utf-8');
                return res.end();
            }

            //response with .less file
            url = url.replace('.css', '.less');
            fs.exists(url, function(exists){
                if(exists){
                    fs.readFile(url, "utf8", function(err, data) {
                        if (err) throw err;

                        //注意，less文件中不要@import .css文件,只能是.less文件，否则less不会自动合并它们
                        less.render(data, {
                            // Specify search paths for @import directives (相对路径的起始目录)
                            paths: [path.dirname(url)],
                            // Specify a filename, for better error messages
                            filename: path.basename(url),
                            compress: !isDebug
                        }, function(err, css) {
                            if (err) throw err;
                            res.end(css, 'utf-8');
                        });
                    });
                }else{
                    next();
                }
            });
            break;
        }
    } else {
        next();
    }
});
if (config.documentRoot) { //下面的2句必须在自定义路由规则之后
    app.use(express['static'](config.documentRoot));
    app.use(express.directory(config.documentRoot));
}

app.listen(config.port);
console.log('ria  server (pid: ' + process.pid + ') running on ' + config.port + ' port...');