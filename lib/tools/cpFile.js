var fs = require('fs');
var path = require('path');
var log = require('./log');
var md5 = require('./md5').md5;

var ext, file;
module.exports = function ( source, target ) {
	ext = path.extname(target);
	if(ext !== '.json'){
		file = fs.readFileSync(source,'binary');
		fs.writeFileSync(target, file, 'binary');
		if(ext !== '.html'){
			md5(file,source);
		}
		file = ext = null;
	}
	log.info('> copy to ' + target);
};