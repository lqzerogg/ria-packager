var path = require('path');
var fs = require('fs');
var less = require('less');

/**
 * 计算图片在合并后的文件中相对路径: 先根据图片和父级css的相对路径计算出图片路径,然后计算该路径与顶级css路径的相对路径.
 * @param{String}rootPath: 顶级css路径(rootNode of .less @import Tree )
 * @param{String}imported: @import引用的css路径
 * @param{String}imgPath: @import引用的css文件中原始图片路径
 * */
var relative = function(rootPath,imported,imgPath){
    //解决windows平台下path.relative带来的bug(先替换全部'\'为'/', 再去掉一个 '../' )
    return path.relative(rootPath,path.resolve(imported,'..',imgPath)).replace(/\\/g,'/').replace('../','');
};

/**
 * 计算图片在合并后的文件中相对路径
 * @param  {String} str          
 * @param  {String} imported 
 * @param  {String} rootPath     
 * @return {String}             
 */
var replaceBackgroundURL = function(str,imported,rootPath){
    if(imported === rootPath){
        return str;
    }
    return str.replace(/url\s*\(\s*(['|"]?)([^\)|\:]+)\1\s*\)/ig, function(){
        if(arguments[2].match(/^\s*@+|\.less*/)){// if is less variables(@abc)
            return 'url(' + arguments[2] + ') ';
        }
        return 'url(' + relative(rootPath,imported,arguments[2]) + ') ';
    });
};


//start overwrite----------------------------------------------------------------------------------------
//@see less.js/lib/less/index.js
var isUrlRe = /^(?:https?:)?\/\//i;
less.Parser.importer = function (file, paths, callback, env) {
    var pathname, dirname, data;

    function parseFile(e, data) {
        if (e) return callback(e);
        
        var rootpath = env.rootpath,
            j = file.lastIndexOf('/');

        if(env.relativeUrls && !/^(?:[a-z-]+:|\/)/.test(file) && j != -1) {
            rootpath = rootpath + file.slice(0, j+1); // append (sub|sup) directory path of imported file
        }

        //replace img's background url with new path relative to root .less file.
        data = replaceBackgroundURL(data,pathname,env.files['_root_less_']);

        env.contents[pathname] = data;      // Updating top importing parser content cache.
        
        new(less.Parser)({
                paths: [dirname].concat(paths),
                filename: pathname,
                contents: env.contents,
                files: env.files,
                syncImport: env.syncImport,
                relativeUrls: env.relativeUrls,
                rootpath: rootpath,
                dumpLineNumbers: env.dumpLineNumbers
        }).parse(data, function (e, root) {
            callback(e, root, pathname);
        });
    };
    
    var isUrl = isUrlRe.test( file );
    if (isUrl || isUrlRe.test(paths[0])) {

        var urlStr = isUrl ? file : url.resolve(paths[0], file),
            urlObj = url.parse(urlStr),
            req = {
                host:   urlObj.hostname,
                port:   urlObj.port || 80,
                path:   urlObj.pathname + (urlObj.search||'')
            };

        http.get(req, function (res) {
            var body = '';
            res.on('data', function (chunk) {
                body += chunk.toString();
            });
            res.on('end', function () {
                if (res.statusCode === 404) {
                    callback({ type: 'File', message: "resource '" + urlStr + "' was not found\n" });
                }
                if (!body) {
                    sys.error( 'Warning: Empty body (HTTP '+ res.statusCode + ') returned by "' + urlStr +'"' );
                }
                pathname = urlStr;
                dirname = urlObj.protocol +'//'+ urlObj.host + urlObj.pathname.replace(/[^\/]*$/, '');
                parseFile(null, body);
            });
        }).on('error', function (err) {
            callback({ type: 'File', message: "resource '" + urlStr + "' gave this Error:\n  "+ err +"\n" });
        });

    } else {
        var paths = [].concat(paths);
        paths.push('.');

        for (var i = 0; i < paths.length; i++) {
            try {
                pathname = path.join(paths[i], file);
                fs.statSync(pathname);
                break;
            } catch (e) {
                pathname = null;
            }
        }
        
        paths = paths.slice(0, paths.length - 1);

        if (!pathname) {
            if (typeof(env.errback) === "function") {
                env.errback(file, paths, callback);
            } else {
                callback({ type: 'File', message: "'" + file + "' wasn't found.\n" });
            }
            return;
        }
        
        dirname = path.dirname(pathname);
        if (env.syncImport) {
            try {
                data = fs.readFileSync(pathname, 'utf-8');
                parseFile(null, data);
            } catch (e) {
                parseFile(e);
            }
        } else {
            fs.readFile(pathname, 'utf-8', parseFile);
        }
    }
}
//end overwrite----------------------------------------------------------------------------------------


module.exports = function(config){
    var file = config.file;
    fs.exists(file, function(exists) {
        if (exists) {
            fs.readFile(file, "utf8", function(err, data) {
                onLessError(err,config);
                var parser = new(less.Parser)({
                    // Specify search paths for @import directives (相对路径的起始目录)
                    paths       : [path.dirname(file)],
                    // Specify a filename, for better error messages
                    filename    : file,
                    files      : {
                        '_root_less_' : file //refrence the root .less file in every @import call.
                    }
                });
                
                parser.parse(data,function(e,root){
                    onLessError(e,config);
                    var css;
                    
                    try{
                        css = root.toCSS({
                            compress: !config.debug,
                            yuicompress: !config.debug
                        });
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