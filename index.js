#!/usr/bin/env node

var readline = require('readline');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var log = require('./lib/tools/log');
var walk = require('./lib/tools/dirWalker');

var pkgJs = require('./lib/js/PKG/pkgJs');
var pkgCss = require('./lib/css/PKG/pkgCss');
var pkgLess = require('./lib/less/combineAll');

var cpf = require('./lib/tools/cpFile');
var writeMappingFile = require('./lib/tools/md5').writeMappingFile;

var conf = require("argsparser").parse();

function release(conf){
    function showUsage() {
        console.error('Usage: node index.js -from fromDir -to toDir [-root srcRoot] [-verbose or -v]');
        process.exit(1);
    }

    var from = conf['-from'];
    var to = conf['-to'];

    if (!from || !fs.existsSync(from)) {
        console.log('need fromDir');
        showUsage();
    }
    from = path.join(path.resolve(from), path.sep);

    if (!conf['-root']) {
        conf['-root'] = from;
    }

    if (!to || !fs.existsSync(to)) {
        console.log('need toDir');
        showUsage();
    }
    to = path.join(path.resolve(to), path.sep);

    if(conf['-noReadline']){
        publish(conf,from,to);
    }else{
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question("please input the CDN host:\n \
            1 http://testrelease.lightinthbox.com\n \
            2 https://lightinthbox.com\n \
            3 http://(cloud~cloud8).lbox.me\n \
            or input custom CDN host:...\n\n", function(answer) {
            switch(answer.trim()) {
                case '1':
                    conf.cdnHost = 'http://testrelease.lightinthbox.com';
                    break;
                case '2':
                    conf.cdnHost = 'https://lightinthbox.com';
                    break;
                case '3':
                    break;
                default:
                    conf.cdnHost = answer.trim();
                    if(!conf.cdnHost){
                        conf.cdnHost = 'RELATIVE';//relative background-img
                    }
                    break;
            }
            
            publish(conf,from,to);

            rl.close();
        });
    }
}
function publish(conf,from,to) {
    console.time('Package-Time');

    //获得打包路径的列表
    console.log('Please wait...\n');

    var files = walk(from),
        jsList = files.js,
        cssList = files.css,
        lessList = files.less,
        htmlList = files.html,
        otherFiles = files.other;

    //1. 先把目标目录建立好
    var target;
    jsList.concat(cssList).concat(lessList).concat(htmlList).concat(otherFiles).forEach(function(uri) {
        target = uri.replace(from, to);
        if (!fs.existsSync(path.dirname(target))) {
            mkdirp.sync(path.dirname(target), 0777);
        }
    });

    //create  mustache html template dir.
    htmlList.forEach(function(uri) {
        target = uri.replace(from, path.join(to, path.sep, 'template', path.sep));
        if (!fs.existsSync(path.dirname(target))) {
            mkdirp.sync(path.dirname(target), 0777);
        }
    });

    //2. 复制非js,css,less文件(swf,图片等静态资源,同时计算其md5)
    otherFiles.forEach(function(source) {
        cpf(source, source.replace(from, to), to);
    });

    //3.压缩,合并css
    pkgCss(from, to, cssList);

    //4. 压缩,合并js
    pkgJs(from, to, jsList, conf);

    //5. parse,combine .less
    pkgLess(from, to, lessList, conf);

    //6 write md5Mapping.json
    writeMappingFile(from, to);

    //7 copy .html file,and replace the md5 version num.
    htmlList.forEach(function(source) {
        cpf(source, source.replace(from, to), to);
    });

    console.log('######## Package SUCCESS! ###########');
    console.timeEnd('Package-Time');
}

module.exports = release;
if(conf.node === __filename){
	release(conf);
    // process.exit(0);
}