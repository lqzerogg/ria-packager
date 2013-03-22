var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var pkg = require('../../index');
var log = require('../tools/log');

module.exports = function(req, res, project, config) {
    res.writeHead(200, {
        'Content-Type': 'text/html;charset=utf-8'
    });
    res.write('<script>window._timer_ = setInterval(function(){try{document.body.scrollTop = document.body.offsetHeight;}catch(e){}},20);</script>', 'utf-8');
    res.write('begin package,please wait...');
    var from = path.join(config.documentRoot, project);
    var to = path.join(from, project);
    var conf = {
        '-from': from,
        '-to': to
    };

    if (fs.existsSync(to)) {
        rmDir(to, function() {
            packageDir(res, project, conf);
        });
    } else {
        packageDir(res, project, conf);
    }
}

function rmDir(dir, callback) {
    var cmd = ['rm', '-rf', dir].join(' ');
    exec(cmd, function(error, stdout, stderr) {
        if (error) {
            throw error;
        }
        callback && callback();
    });
}

function packageDir(res, project, conf) {
    var dir = conf['-to'];
    fs.mkdir(dir, 0777, function() {
        var zipFile = path.join(conf['-from'], project + '.zip');
        if (fs.existsSync(zipFile)) {
            fs.unlinkSync(zipFile);
        }
        // 重新定向log到浏览器再复原-----------------------
        var info = log.info;
        log.info = function(msg){
            res.write('<li>' + msg + '</li>', 'utf-8');
        };

        conf['-noReadline'] = true;
        pkg(conf);
        
        log.info = info;
        //----------------------------------------------

        var cwd = process.cwd();
        process.chdir(dir);

        var cmd = ['zip', '-r', project + '.zip', './*'].join(' ');

        res.write('<li><strong>' + cmd + '</strong></li>', 'utf-8');

        exec(cmd, function(error, stdout, stderr) {
            if (error) {
                stderr.toString().split('\n').forEach(function(line) {
                    line && res.write('<li style="color:red;">' + line + '</li>', 'utf-8');
                });
                res.end('', 'utf-8');
                throw error;
            }
            stdout.toString().split('\n').forEach(function(line) {
                line && res.write('<li>' + line + '</li>', 'utf-8');
            });
            res.write(('<a href="url">' + 'download ' + project + '.zip' + '</a>').replace('url', '/download/' + zipFile, 'utf-8'));
            res.end('<script>clearInterval(window._timer_); document.body.scrollTop = document.body.offsetHeight;</script>', 'utf-8');
            exec(['mv ',project + '.zip','../'].join(' '), function(error, stdout, stderr) {
                if (error) {
                    throw error;
                }

                rmDir(dir);

                process.chdir(cwd);
            });
        });
    });
}