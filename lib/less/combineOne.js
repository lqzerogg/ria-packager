var path = require('path');
var fs = require('fs');
var less = require('less');

module.exports = function(config){
    var file = config.file;
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