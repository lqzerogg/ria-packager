var path = require('path');
var fs = require('fs');
var less = require('less');

var mainLessFile;

var readFile = fs.readFile;
fs.readFile = function(filename, encoding, callback){
    var cb;
    if(path.extname(filename) === '.less'){//计算图片在合并后的.less文件中相对路径
        cb = function(err, data){
            if (err) throw err;
            if(data && mainLessFile){
                data = replaceURL(data,filename,mainLessFile);
            }
            callback(err, data);
        }
    }else{
        cb = callback;
    }
    readFile.call(fs,filename, encoding, cb);
};

var urlReg = /url\s*\(\s*(['|"]?)([^\)|\:]+)\1\s*\)/ig;
/**
 * 计算图片在合并后的文件中相对路径
 * @param  {String} str          
 * @param  {String} importedPath 
 * @param  {String} topPath     
 * @return {String}             
 */
var replaceURL = function(str,importedPath,topPath){
    if(importedPath === topPath){
        return str;
    }
    return str.replace(urlReg, function(){
        if(arguments[2].match(/^\s*@+/)){// if is less variables(@abc)
            return arguments[2]; 
        }
        return 'url(' + relative(topPath,importedPath,arguments[2]) + ') ';
    });
};

/**
 * 计算图片在合并后的文件中相对路径: 先根据图片和父级css的相对路径计算出图片路径,然后计算该路径与顶级css路径的相对路径.
 * @param{String}topPath: 顶级css路径
 * @param{String}importedPath: @import引用的css路径
 * @param{String}imgPath: @import引用的css文件中原始图片路径
 * */
var relative = function(topPath,importedPath,imgPath){
    //解决windows平台下path.relative带来的bug(先替换全部'\'为'/', 再去掉一个 '../' )
    return path.relative(topPath,path.resolve(importedPath,'..',imgPath)).replace(/\\/g,'/').replace('../','');
};


module.exports = function(config){
    var file = mainLessFile = config.file;
    fs.exists(file, function(exists) {
        if (exists) {
            fs.readFile(file, "utf8", function(err, data) {
                onLessError(err,config);
                var parser = new(less.Parser)({
                    // Specify search paths for @import directives (相对路径的起始目录)
                    paths: [path.dirname(file)],
                    // Specify a filename, for better error messages
                    filename: path.basename(file),
                    compress: !config.debug
                });
                
                parser.parse(data,function(e,root){
                    onLessError(e,config);
                    var css;
                    
                    try{
                        css = root.toCSS();
                    }catch(error){
                        onLessError(error,config);
                    }
                    if(typeof css === 'string'){
                        css = '/*\n' +  JSON.stringify(Object.keys(parser.imports.files),null,3) + '\n*/\n' + css;
                        config.callback && config.callback(css);
                    }
                });
            });
        } else {
            console.error('cannot find ', file);
            if(config.res){
                config.res.send(404, 'Sorry,cannot find ' + file + ' <a href="/">return</a>');
            }
        }
    });
}

function onLessError(e,config){
    if(e){
        if(config.res){
            config.res.end('<pre style="color:red;">Error when handle ' + config.file + ' : ' + JSON.stringify(e,null,3) + '</pre>');
        }
        throw e;
    }
}