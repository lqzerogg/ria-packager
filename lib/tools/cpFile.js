var fs = require('fs');
var path = require('path');
var log = require('./log');
var md5 = require('./md5');

var ext, file,mapping;
module.exports = function ( source, target,outputDir) {
	ext = path.extname(target);
	if(ext !== '.json'){
		file = fs.readFileSync(source,'binary');
		if(ext !== '.html'){
			fs.writeFileSync(target, file, 'binary');
			md5.md5(file,source);
		}else{//replace js and css md5 version string in html(src="a/b/c.js?v={{page/demo/demo.js}}")
			file = file.replace(/\?v=\{\{\s*([\w\-\.\/]+)\s*\}\}/g,function(){
				mapping = mapping || md5.getJsAndCssMapping();
				return '?v=' + (mapping[RegExp.$1] || '');
			});
			fs.writeFileSync(target, file, 'binary');
		}
		file = ext = null;
	}
	log.info('> copy to ' + target);
};