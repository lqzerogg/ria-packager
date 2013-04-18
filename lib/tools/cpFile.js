var fs = require('fs');
var path = require('path');
var log = require('./log');
var md5 = require('./md5');

var ext, file,mapping;
module.exports = function ( source, target,outputDir) {
	ext = path.extname(target);
	if(ext !== '.json'){
		file = fs.readFileSync(source,'binary');
		fs.writeFileSync(target, file, 'binary');
		md5.md5(file,source);
		file = ext = null;
		log.info('> copy to ' + target);
	}
};