var fs = require('fs');
var path = require('path');
var md5 = require('./md5');
module.exports = function(from,to){
	var mappingFile = path.join(to ,"md5_mapping.json");
	var mapping = md5.getMD5Mapping();
	fs.writeFileSync(mappingFile,JSON.stringify(mapping,null,3));
	mapping = null;
	console.log('\n######## MD5 mapping file is: ' + mappingFile + ' ########\n');
};