var fs = require('fs'), crypto = require('crypto');

//同步式计算字符串md5,并且保留文件名称
var mapping = {};
exports.md5 = function(str,key){
	var hash = crypto.createHash('md5').update(str).digest("hex").substr(0,16);//hex为32位
	mapping[key] = hash;
	return hash;
};
exports.getMD5Mapping = function(){
	return mapping;
};
