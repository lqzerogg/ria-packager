var jsp = require('uglify-js').parser;
var pro = require('uglify-js').uglify;
var path = require('path');
var fs = require('fs');
var removeBOMChar = require('../tools/removeBOMChar.js').removeBOMChar;

var reg = /require\s*\(\s*(['|"])([\w\-\.\/]+)\1\s*\)\s*;?/gi;
var combine = function(filePath, beCombined,baseJsDir,config) {
	if(fs.existsSync(filePath)) {
		var str = fs.readFileSync(filePath, 'utf-8');
		str = removeBOMChar(str);
		try{
			var ast = jsp.parse(str);
			if(config.mangle){
				ast = pro.ast_mangle(ast);
			}
			if(config.squeeze){
				ast = pro.ast_squeeze(ast,{
					make_seqs   : false,
		            dead_code   : true,
		            no_warnings : false,
		            keep_comps  : true
				});
			}
			str = pro.gen_code(ast,{
				'beautify'	: config.beautify
			});
			ast = null;
		}catch(err){
			console.error('error in ' + filePath + " :\n",err);
			return ';alert(\'' + 'error in ' + filePath + '\\n' + JSON.stringify(err) + '\');' ;
		}
		
		return str.replace(reg, function() {
			var key = arguments[2];
			if(key) {
				if(beCombined[key] !== 0 ) {
					beCombined[key] = 0;
					key = path.join(baseJsDir, key);
					return combine(key, beCombined,baseJsDir,config) + '\n';
				}else{
					return ' ';//忽略重复require()
				}
			}
		});
	} else {
		console.error(filePath + ' does not exsist!');
		return ';alert("' + filePath + ' does not exsist!");';
	}
};
/*
 * 用于开发模式下合并单个js文件,不压缩
 * @param{String}filePath : js文件的#绝对路径#
 * @param{Object}config : {beautify:true,mangle:false,squeeze:false,root:'/data/ria/mobile'} 控制是否压缩|格式化代码
 * @return{String}合并后的js内容.
 */
module.exports = function(filePath,config) {
	var beCombined = {};
	return combine(filePath,beCombined,config.root,config);
};