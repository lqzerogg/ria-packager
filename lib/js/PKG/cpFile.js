var fs = require('fs');
var path = require('path');
var log = require('../../tools/log');
var syncMD5forFile = require('../../tools/md5.js').syncMD5forFile;

var ext, encode = 'binary';//图片和swf等应该以binary编码读写;文本文件使用utf-8编码
var file,hash,index;
module.exports = function ( from, to ) {
	ext = path.extname(to);
	if(ext === '.js' || ext === '.css'){
		encode = 'utf-8';
	}
	file = fs.readFileSync(from,encode);
	fs.writeFileSync(to, file, encode);
	
	hash = syncMD5forFile(file,to);
	index = to.lastIndexOf('.');
	
	fs.writeFileSync(to.substr(0,index) + '_' + hash + to.substr(index), file, encode);
	file = hash = index = null;
	log.info('> copy ' + to + ' done.');
};