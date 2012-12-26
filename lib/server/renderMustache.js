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

function showThemeList(project){
    var str = '\n<select name="theme" onchange="_onChange_(this)" >'+
        '<option value="-1">switch theme </option>'+
        '<option value="/project/theme/default/skin.css">default</option>'+
        '<option value="/project/theme/blue/skin.css">blue</option>'+
        '<option value="/project/theme/newblue/skin.css">newblue</option>'+
    '</select>\n';
    str = str.replace(/project/g,project);

    return str;
}

function showLanguageList(root,project){
    var list = fs.readdirSync(path.join(root,'i18n','js'));
    var select = ['\n<select name="language" onchange="_onChange_(this)" > <option value="-1">switch language </option>'];
    list.forEach(function(file){
        select.push('<option value="/project/i18n/js/'+ file + '" >' + file.replace('.js','') +  '</option>');
    });
    select.push('</select>\n');
    var str = select.join('');
    str = str.replace(/project/g,project);
    return str;
}


function showJsonDataList(dir){
    if(fs.existsSync(dir)){
        var list = fs.readdirSync(dir);
        var select = ['\n<select name="template_data" onchange="_onChange_(this)" > <option value="-1">switch data for template </option>'];
        list.forEach(function(file){
            path.extname(file) === '.json' && select.push('<option value="'+ file + '" >' + file +  '</option>');
        });
        select.push('</select>\n');
        return select.join('');
    }
    return '';
}

function onSelectChange(){
    function _onChange_(el){
        if(el.value != '-1'){
            var name = el.name;
            var gap = location.href.indexOf('?') === -1 ? '?' : '&'; 
            var list = location.href.split(name + '=');
            if(list[1]){
                var old = list[1].split('&')[0];
                location.href = location.href.replace(old,el.value);
            }else{
                location.href = location.href + gap + name + '=' + el.value;
            }
        }
    }
    return '\n<script>' + _onChange_.toString() + '</script>\n'
}

module.exports = function(req, res,config) {
    res.header('Content-Type' , 'text/html;charset=utf-8');

    var arr = req.url.split('/'), project = arr[1], templateName = req.url.split(project)[1].split('?')[0];
    var root = path.join(config.documentRoot,project);

    var file = path.join(root, templateName);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.end(file + ' does not exists! \n <a href="/">return</a>');
    } else {
        var dataFile = file.replace('.html', '.json'),data = {};
        var testDir = path.join( path.dirname(file) , '_test');
        if(fs.existsSync(path.join(testDir,path.basename(file,'.html')) + '.json')){
            dataFile = path.join(testDir,path.basename(file,'.html')) + '.json'; // main template data (.json file)
        }
        if(req.query.template_data && fs.existsSync(path.join(testDir,req.query.template_data))){
            try {
                data = JSON.parse(fs.readFileSync(path.join(testDir,req.query.template_data)));
            } catch (e) {
                console.error(e);
                res.write('<p style="color:red;">Error when JSON.parse ' + path.join(testDir,req.query.template_data) + ': ' + e.toString() + '</p>');
            }
        }else if(fs.existsSync(dataFile)){
            try {
                data = JSON.parse(fs.readFileSync(dataFile));
            } catch (e) {
                console.error(e);
                res.write('<p style="color:red;">Error when JSON.parse ' + dataFile + ': ' + e.toString() + '</p>');
            }
        }
        
        data = merge(data,{
            'cdn_base_url': "/" + project,
            'i18n': function () {
                return function (text, render) {
                    return data['I18N'] && data['I18N'][text] ? render(data['I18N'][text]) : render(text);
                }
            }
        });

        data.main_css = '/'+ project +  templateName.replace('.html', '.css');
        data.main_js = '/'+ project + templateName.replace('.html', '.js');
        data.theme_css = req.query.theme || ('/' + project + '/theme/default/skin.css');
        data.language_js = req.query.language ||  '/' + project + '/i18n/js/en.js';

        Mustache.clearCache();

        var content = fs.readFileSync(file, 'utf8').trim() 
            + '\n<div style="position:fixed;bottom:0px;">\n' 
            + onSelectChange()
            + showThemeList(project) 
            + showLanguageList(root,project)
            + showJsonDataList(testDir)
            + '</div>\n';

        var isWidgetOrPagelet = req.url.match(/\/pagelet\/|\/widget\//);

        if (isWidgetOrPagelet) {
            if(fs.existsSync(path.join(testDir,'_layout.html'))){
                var layout = fs.readFileSync(path.join(testDir,'_layout.html'), 'utf8');
            }else{
                var layout = fs.readFileSync(path.join(__dirname,'_layout.html'), 'utf8');
            }
            var output = Mustache.render(layout, data, function(partial) {//auto load partial template
                return partial === 'main_widget_content' ? content : fs.readFileSync(path.join(root, partial), 'utf8').trim();
            });  

        }else{
            var output = Mustache.render(content, data, function(partial) {//auto load partial template
                return fs.readFileSync(path.join(root, partial), 'utf8').trim();
            });
        }
        res.end(output);
    }
};
