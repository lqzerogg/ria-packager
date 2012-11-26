var fs = require('fs');
var path = require('path');
var cssMD5 = require('../../tools/md5.js').cssMD5;

var hash,md5URI;
module.exports = function(code, uri){
	fs.writeFileSync(uri, code);

	//md5 文件并且写入 a/b/c.css --> a/b/c_xxx.css xxx为c.css的md5 hash值
	hash = cssMD5(uri,code);
	md5URI = uri.replace(/\.css$/,'_' + hash)
	fs.writeFileSync(md5URI + '.css',code);
};