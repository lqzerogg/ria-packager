var path = require('path');
var fs = require('fs');
var util = require('util');
var Mustache = require('mustache');

function merge(source,target){
	for(var k in source){
		target[k] = source[k];
	}
	return target;
}

module.exports = function(req, res,config) {
    res.header('Content-Type' , 'text/html;charset=utf-8');

    var arr = req.url.split('/'), project = arr[1], templateName = req.url.split(project)[1];
    var root = path.join(config.documentRoot,project);

    var file = path.join(root, templateName);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.end(file + ' does not exists! \n <a href="/">return</a>');
    } else {
        var dataFile = file.replace('.html', '.json'),data = {};
        if (fs.existsSync(dataFile)) {
            try {
                data = JSON.parse(fs.readFileSync(dataFile));
            } catch (e) {
                console.error(e);
            }
        }


        if (req.url.match(/\/pagelet\/|\/widget\//)) {
            res.write('<link href="SRC" rel="stylesheet">'.replace('SRC', '/'+ project +  templateName.replace('.html', '.css')));
            res.write('<script src="SRC"></script>'.replace('SRC', '/'+ project + '/base/jquery.1.8.1.js'));
            res.write('<script src="SRC"></script>'.replace('SRC', '/'+ project + templateName.replace('.html', '.js')));
        }

        data['I18N'] = {
        	'hello world!' : '你好，世界!'
        };
        data = merge(data,{
        	'cdn_base_url': "/" + project,

            "name": "dongyuwei",
            "i18n": function() {
                return function(text, render) {
                    text = data['I18N'][text] || text;
                    return render(text);
                }
            }
        });
        var output = Mustache.render(fs.readFileSync(file, 'utf8'), data, function(partial) {//auto load partial template
            return fs.readFileSync(path.join(root, partial), 'utf8');
        });
        res.end(output);
    }
};

