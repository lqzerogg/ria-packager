var fs = require('fs');
var path = require('path');
var log = require('./log');
var md5 = require('./md5');
var render = require('../server/renderMustache');

var ext, file;
module.exports = function ( source, target,fromDir) {
	ext = path.extname(target);
	if(ext !== '.json'){
        if(ext === '.html'){
            file = fs.readFileSync(source,'utf-8');
            file = render.getMustachePartials(file,fromDir);
            fs.writeFileSync(target, file,'utf-8');
        }else{
            file = fs.readFileSync(source,'binary');
            fs.writeFileSync(target, file, 'binary');
            md5.md5(file,source);
        }
        
		file = ext = null;
		log.info('> copy to ' + target);
	}
};