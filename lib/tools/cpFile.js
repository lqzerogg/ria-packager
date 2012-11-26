var fs = require('fs');
var path = require('path');
var log = require('./log');
var md5 = require('./md5').md5;

var ext, file;
module.exports = function ( source, target ) {
	file = fs.readFileSync(source,'binary');
	fs.writeFileSync(target, file, 'binary');
	
	ext = path.extname(target);
	if(ext !== '.html' &&  ext !== '.json'){
		md5(file,source);
	}
	file = ext = null;
	
	log.info('> copy to ' + target);
};