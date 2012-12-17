var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var log = require('./lib/tools/log');
var walk = require('./lib/tools/dirWalker');

var weiboPkgJs = require('./lib/js/PKG/weiboPkgJs');
var weiboPkgCss = require('./lib/css//PKG/weiboPkgCss');

var cpf = require('./lib/tools/cpFile');
var writeMappingFile = require('./lib/tools/md5').writeMappingFile;

console.time('Package-Time');

var conf = require("argsparser").parse();
var from = conf['-from'], to = conf['-to'];

function showUsage(){
	console.error('Usage: node js/main.js -from fromDir -to toDir [-root srcRoot] [-verbose or -v]');
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
console.log('Please wait...\n');

var files = walk(from), jsList = files.js, cssList = files.css, htmlList = files.html, otherFiles = files.other;

//1. 先把目标目录建立好
var target;
jsList.concat(cssList).concat(htmlList).concat(otherFiles).forEach(function(uri){
	target = uri.replace(from,to);
	if(!fs.existsSync(path.dirname(target))){
		mkdirp.sync(path.dirname(target),0777);
	}
});

//create  mustache html template dir.
htmlList.forEach(function(uri){
	target = uri.replace(from, path.join(to,path.sep,'template',path.sep));
	if(!fs.existsSync(path.dirname(target))){
		mkdirp.sync(path.dirname(target),0777);
	}
});

//2. 复制非js,css文件(swf,图片等静态资源,同时计算其md5)
console.log('Copy files. Please wait...\n');
otherFiles.forEach(function(source){
	cpf(source,source.replace(from,to),to);
});

//3.压缩,合并css
weiboPkgCss(from,to,cssList);

//4. 压缩,合并js
weiboPkgJs(from,to,jsList,conf);

//5 write md5Mapping.json
writeMappingFile(from,to);

//6 copy .html file,and replace the md5 version num.
htmlList.forEach(function(source){
	cpf(source,source.replace(from,to),to);
});

console.log('######## Package SUCCESS! ###########');
console.timeEnd('Package-Time');

process.exit(0);