var path = require('path');
var fs = require('fs');
var Mustache = require('mustache');
var removeBOMChar = require('../tools/removeBOMChar').removeBOMChar;

function merge(source,target){
	for(var k in source){
		target[k] = source[k];
	}
	return target;
}

function showThemeList(project){
    var str = '\n<select name="theme" onchange="_onChange_(this)" >'+
        '<option value="-1">switch theme </option>'+
        '<option value="/project/less/theme/default.css">default</option>'+
        '<option value="/project/less/theme/newblue.css">newblue</option>'+
    '</select>\n';
    str = str.replace(/project/g,project);

    return str;
}
function showLanguageList(root,project){
    var language = {};
    var list = [];
    var dir = path.join(root,'js','i18n');
    if(fs.existsSync(dir)){
        list = fs.readdirSync(dir);
    }
    dir = path.join(root,'less','i18n');
    if(fs.existsSync(dir)){
        list = list.concat(fs.readdirSync(dir));
    }
    list.sort().forEach(function(file){
        var ext = path.extname(file);
        if(ext === '.less' || ext === '.js'){
            var i18n = path.basename(file).replace('.js','').replace('.less','');
            language[i18n] = file;
        }
    });

    var str;
    var select = ['\n<select name="i18n" onchange="_onChange_(this)" > <option value="-1">switch i18n language</option>'];
    Object.keys(language).sort().forEach(function(lang){
        select.push('<option value="'+ lang + '" >' + lang +  '</option>');
    });
    select.push('</select>\n');
    str = select.join('');
    str = str.replace(/project/g,project);

    return str;
}

function showJsonDataList(dir){
    if(fs.existsSync(dir)){
        var list = fs.readdirSync(dir);
        var select = ['\n<select name="template_data" onchange="_onChange_(this)" > <option value="-1">switch data for template </option>'];
        list.sort().forEach(function(file){
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
                /* eval字符串时会自动去掉字符串中的js注释。
                 * 利用这个，可以允许json中有js式注释，用eval解析（用JSON.parse就不行了）这种不规范不合法的json
                 */
                data = eval('(' + removeBOMChar(fs.readFileSync(path.join(testDir,req.query.template_data),'utf-8')) + ')');
            } catch (e) {
                console.error(e);
                res.write('<p style="color:red;">Error when JSON.parse ' + path.join(testDir,req.query.template_data) + ': ' + e.toString() + '</p>');
            }
        }else if(fs.existsSync(dataFile)){
            try {
                data = eval('(' + removeBOMChar(fs.readFileSync(dataFile,'utf-8')) + ')');
            } catch (e) {
                console.error(e);
                res.write('<p style="color:red;">Error when JSON.parse ' + dataFile + ': ' + e.toString() + '</p>');
            }
        }
        data = merge(data,{
            'cdn_base_url': "/" + project,
            'i': function () {// 模板引擎支持 '{{#i}} demo {{hello}} {{/i}}' 形式的国际化
                return function (text, render) {
                    return data['I18N'] && data['I18N'][text] ? render(data['I18N'][text]) : render(text);
                }
            }
        });

        data.main_css = '/'+ project +  templateName.replace('.html', '.css');
        data.main_js = '/'+ project + templateName.replace('.html', '.js');
        data.theme_css = req.query.theme || ('/' + project + '/less/theme/default.css');
        if(req.query.i18n){
            data.language_js = '/' + project + '/js/i18n/' + req.query.i18n + '.js';
            data.language_css = '/' + project + '/less/i18n/' + req.query.i18n + '.less';
        }else{
            data.language_js = '/' + project + '/js/i18n/en.js';
            data.language_css = '/' + project + '/less/i18n/en.less';
        }

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
