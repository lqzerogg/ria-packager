var combineOne = require('./combineOne');
var writeFile = require('../tools/writeFile');
var log = require('../tools/log');

/**
 * combine and compress all .css file 
 */
module.exports = function(fromDir, toDir, cssList){
    log.info('parse .css file......');

    cssList.forEach(function(file){
        var css = combineOne(file,{
            debug : false,
            root : fromDir
        });
        writeFile(css,file.replace(fromDir, toDir),file);
    });

    log.info('all .css files processed!');
};