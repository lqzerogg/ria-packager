var fs = require('fs');
var path = require('path');
var pkg = require('./PKG/weiboPkgCss');
var log = require('../tools/log');
var cpf = require('./PKG/cpFile');
var writeMappingFile = require('./PKG/writeMappingFile')
var walk = require('../tools/dirWalker');
var mkdirp = require('mkdirp');

console.time('Package-Time');

var conf = require("argsparser").parse();
var from = conf['-from'], to = conf['-to'];

function showUsage(){
	console.error('Usage: node css/main.js -form fromDir -to toDir [-verbose or -v]');
	process.exit(1);
}

if(!from || !fs.existsSync(from)){
	console.log('need fromDir');
	showUsage();
}
from = path.join(path.resolve(from),path.sep);

if(!to || !fs.existsSync(to)){
	console.log('need toDir');
	showUsage();
}
to = path.join(path.resolve(to),path.sep);

//获得打包路径的列表
console.log('Finding files. Please wait...\n');

var files = walk(from), cssList = files.css, otherFiles = files.other;

//先把目标目录建立好
var target;
cssList.concat(otherFiles).forEach(function(uri){
	target = uri.replace(path.resolve(from),path.resolve(to));
	if(!fs.existsSync(path.dirname(target))){
		mkdirp.sync(path.dirname(target),0777);
	}
});


console.log('Copy files(images) . Please wait...\n');
//复制非css文件(图片等,同时计算图片md5,以后续在css中替换其路径)
otherFiles.forEach(function(uri){
	cpf(from,to,uri);
});


pkg(from,to,cssList);

writeMappingFile(from,to);

console.log('\n################ Package CSS SUCCESS! ##################\n');
console.timeEnd('Package-Time');

//.packaged.txt表明可用于仿真测试,勿删!
fs.writeFileSync(path.join(path.resolve(to) ,".packaged.txt"), 'packaged at: ' + (new Date().getTime()) + '\n');
process.exit(0);