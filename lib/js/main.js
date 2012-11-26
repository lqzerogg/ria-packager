var fs = require('fs');
var path = require('path');
var pkg = require('./PKG/weiboPkgJs');
var log = require('../tools/log');
var cpf = require('./PKG/cpFile');
var walk = require('../tools/dirWalker');
var mkdirp = require('mkdirp');

console.time('Package-Time');

var conf = require("argsparser").parse();
var from = conf['-from'], to = conf['-to'], root = conf['-root'];

function showUsage(){
	console.error('Usage: node js/main.js -from fromDir -to toDir -root docRoot [-beautify] [-verbose or -v]');
	process.exit(1);
}

if(!from || !fs.existsSync(from)){
	console.log('need fromDir');
	showUsage();
}
from = path.join(path.resolve(from),path.sep);

if(!conf['-root']){
	conf['-root'] = from;
}

if(!to || !fs.existsSync(to)){
	console.log('need toDir');
	showUsage();
}
to = path.join(path.resolve(to),path.sep);

//获得打包路径的列表
console.log('Finding PKG. Please wait...\n');

var files = walk(from), jsList = files.js, otherFiles = files.other;
//先把目标目录建立好
var target;
jsList.concat(otherFiles).forEach(function(uri){
	target = uri.replace(from,to);
	if(!fs.existsSync(path.dirname(target))){
		mkdirp.sync(path.dirname(target),0777);
	}
});

//压缩,合并js
pkg(from,to,jsList,conf);

//复制非js文件(swf,图片等静态资源,同时计算其md5)
console.log('Copy files. Please wait...\n');
otherFiles.forEach(function(source){
	cpf(source,source.replace(from,to));
});


console.log('######## Package JS SUCCESS! ###########');
console.timeEnd('Package-Time');

//.packaged.txt表明可用于仿真测试,勿删!
fs.writeFileSync(path.join(path.resolve(to) ,".packaged.txt"), 'packaged at: ' + (new Date().getTime()) + '\n');
process.exit(0);