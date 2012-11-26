var fs = require('fs');
var log  = require('./log');
var md5 = require('./md5').md5;

module.exports = function(code, target,source){
	md5(code,source)
	fs.writeFileSync(target,code);
	log.info('> write to ' + target );
};
