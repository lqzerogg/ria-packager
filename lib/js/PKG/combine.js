var path = require('path');
var log = require('../../tools/log');
var reg = /require\s*\(\s*(['|"])([\w\-\.\/]*)\1\s*\)\s*;?/gi;

var combine = function(uri,str, jsMap, baseJsDir,beCombined){
	return str.replace(reg, function(){
		var key = arguments[2];
		if(key){
			key = path.join(baseJsDir,key);
			if(typeof jsMap[key] === 'string'){
				if(beCombined[key] !== 0){
					beCombined[key] = 0;
					return combine(key,jsMap[key], jsMap, baseJsDir,beCombined);
				}else{
					return '';
				}
			}else{
				log.error(uri + ' required file ' + key + ' do not exist!!!!');
				return '';
			}
		}
	});
};

module.exports = function(uri,code, jsMap,conf){
	var baseJsDir = conf['-root'];
	var beCombined = {};
	return combine(uri,code, jsMap, baseJsDir,beCombined);
};