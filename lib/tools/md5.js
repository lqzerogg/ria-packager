var fs = require('fs'), path = require('path'), crypto = require('crypto');

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

exports.writeMappingFile = function(from,to){
	var mappingFile = path.join(to ,"md5_mapping.json");
	fs.writeFileSync(mappingFile,JSON.stringify(mapping,null,3));
	mapping = null;
	console.log('\n######## MD5 mapping file is: ' + mappingFile + ' ########\n');
};