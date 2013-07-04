var path = require('path'), fs = require('fs');

var root, widget, pagelet,js,less;
function walk(uri,filter,files) {
	widget = widget || path.join(root,'widget');
	pagelet = pagelet || path.join(root,'pagelet');
	js = js || path.join(root,'js');
	less = less || path.join(root,'less');

	var stat = fs.lstatSync(uri);
	if(filter(uri)){
		if(stat.isFile()){
			//转换成绝对路径
			uri = path.resolve(uri);
			//打包时排除widget|pagelet 目录
			if([widget,pagelet].every(function(item,i){
				return uri.indexOf(item) === -1;
			})){
				switch(path.extname(uri)){
					case '.js':
						//js目录下仅保留i18n子目录下js
						if(uri.indexOf(js) !== -1){
							if(uri.indexOf(path.join(js,'i18n')) !== -1){
								files.js.push(uri);
							}
						}else{
							files.js.push(uri);
						}
						break;
					case '.css':
						files.css.push(uri);
						break;
					case '.less':
						//less目录下仅保留i18n and theme 子目录下js
						if(uri.indexOf(less) !== -1){
							if(uri.indexOf(path.join(less,'i18n')) !== -1
							   || uri.indexOf(path.join(less,'theme')) !== -1){
								files.less.push(uri);
								console.log(uri);
							}
						}else{
							files.less.push(uri);
						}
						break;
					case '.html':
						files.html.push(uri);
						break;
					default:
						files.other.push(uri);
				}
			}
		}
		if(stat.isDirectory()){
			fs.readdirSync(uri).forEach(function(part){
				walk(path.join(uri, part),filter,files);
			});
		}
	}
	stat = null;
}

//排除basename以.或者_开头的目录|文件(如.svn,_html,_psd, _a.psd等)
function defaultFilter(uri){
	var start = path.basename(uri).charAt(0);
	if(start === '.' || start === '_'){
		start = null;
		return false;
	}
	return true;
}

/**
 * 递归遍历目录文件,获取所有文件路径;并且分成 "js|css|other" 三组.
 * @param{String}rootDir
 * @param{Function}filter:过滤函数,返回false就排除目录|文件
 * @return{Object}
 * */
module.exports = function(rootDir, filter) {
	root = rootDir;
	filter = filter || defaultFilter;
	
	var files = {
		css 	: [],
		less 	: [],
		js 		: [],
		html 	: [],
		other 	: []
	};
	
	walk(rootDir,filter,files);
	
	return files;
};
