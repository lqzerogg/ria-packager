(function (tree) {
    var path = require('path');

    /**
     * 计算图片绝对路径
     * @param{String}imported: @import引用的css路径
     * @param{String}imgPath: @import引用的css文件中原始图片路径
     * */
    function absolute(imported,imgPath){
        return path.resolve(path.dirname(imported),imgPath);
    }

    tree.URL = function (val, rootpath, env) {
        this.value = val;
        this.rootpath = rootpath;

        this.env = env;
    };
    tree.URL.prototype = {
        toCSS: function () {
            return "url(" + this.value.toCSS() + ")";
        },
        eval: function (ctx) {
            var val = this.value.eval(ctx), rootpath;

            // Add the base path if the URL is relative
            if (typeof val.value === "string" && !/^(?:[a-z-]+:|\/)/.test(val.value)) {
                rootpath = this.rootpath;
                if (!val.quote) {
                    rootpath = rootpath.replace(/[\(\)'"\s]/g, function(match) { return "\\"+match; });
                }
                val.value = rootpath + val.value;
            }
            
            var config = this.env.files._config_, host;
            host = config.debug ? 'http://' + config.req.headers.host : 
                (typeof config.cdnHost === 'function' ? config.cdnHost.call() : config.cdnHost);

            val.value = host + absolute(this.env.filename, val.value)
                    .replace(config.documentRoot, '')
                    .replace(/\\/g,'/');

            return new(tree.URL)(val, this.rootpath);
        }
    };

})(require('../tree'));
