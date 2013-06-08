var path = require('path');
var fs = require('fs');
var Mustache = require('mustache');
var removeBOMChar = require('../tools/removeBOMChar').removeBOMChar;
var render = {};


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
//modify by huajian --debug btn & onclick event
function showDebugBtn(){
    function _debugConsole_(event){
        var url = _debugurlparam_;
        url = encodeURI(url);
        document.getElementById('iframeDebug').innerHTML = '<iframe allowTransparency="true" frameborder="0" scrolling="no" src="/debug/debug.html?param=' + url + '" width="100%" height="100%"></iframe>';
        document.getElementById('iframeDebug').style.display = '';
    }
    var btnStr = '<input type="button" value="debug" onclick="_debugConsole_();" />';
    return btnStr + '\n<script>' + _debugConsole_.toString() + '</script>\n'
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

//递归获取mustache子模板原始内容
function getMustachePartials(html,root){
    var partial,partialTemplate;
    html = html.replace(/\{\{\>\s*(.+)\s*\}\}/g,function(){
        partial = RegExp.$1.trim();
        partialTemplate = fs.readFileSync(path.join(root,partial),'utf-8');
        return getMustachePartials(partialTemplate,root);
    });

    return html;     
}

//根据模板文件Path & template data来render data
//modify by huajian
function renderData(cfg){
    //get json Path with json
    var data = {};
    //get jsonData by path & params
    if(cfg.templateData && fs.existsSync(path.join(cfg.testDir, cfg.templateData))){
        try{
            /* eval字符串时会自动去掉字符串中的js注释。
             * 利用这个，可以允许json中有js式注释，用eval解析（用JSON.parse就不行了）这种不规范不合法的json
             */
            data = eval('(' + removeBOMChar(fs.readFileSync(path.join(cfg.testDir,cfg.templateData),'utf-8')) + ')');
        }catch(e){
            console.error(e);
            throw ('<p style="color:red;">Error when JSON.parse ' + path.join(cfg.testDir,cfg.templateData) + ': ' + e.toString() + 'with template</p>');
        }
    }else if(fs.existsSync(cfg.dataFile)){
        try{
            data = eval('(' + removeBOMChar(fs.readFileSync(cfg.dataFile,'utf-8')) + ')');
        }catch(e){
            console.error(e);
            throw ('<p style="color:red;">Error when JSON.parse ' + cfg.dataFile + ': ' + e.toString() + 'without template</p>');
        }
    }

    return mergeDataJson(data, cfg);
}

//generate数据源
//modify by huajian
function mergeDataJson(data, cfg){
    data = merge(data,{
        'mustache_page_title' : cfg.templateName,
        'cdn_base_url': "/" + cfg.project,
        'i': function () {// 模板引擎支持 '{{#i}} demo {{hello}} {{/i}}' 形式的国际化
            return function (text, render) {
                return data['I18N'] && data['I18N'][text] ? render(data['I18N'][text]) : render(text);
            }
        }
    });
     //dev mod: debug with phper
    var debugWithBackend = cfg.isDev, rawContent = cfg.isRaw;
    if(fs.existsSync(cfg.globalConfig)){
        data = merge(eval('(' + fs.readFileSync(cfg.globalConfig,'utf-8') + ')'), data);
    }

    data.main_css = cfg.templateName.replace('.html', '.css');
    data.main_js = cfg.templateName.replace('.html', '.js');
    data.theme_css = cfg.theme;
    if(cfg.query.i18n){
        data.language_js = '/js/i18n/' + cfg.query.i18n + '.js';
        data.language_css = '/less/i18n/' + cfg.query.i18n + '.css';
    }else{
        data.language_js = '/js/i18n/en.js';
        data.language_css = '/less/i18n/en.css';
    }

    
    data.main_css = cfg.prefix + data.main_css;
    data.main_js = cfg.prefix + data.main_js;
    data.theme_css = cfg.prefix + data.theme_css;
    data.language_js = cfg.prefix + data.language_js;
    data.language_css = cfg.prefix + data.language_css;
    
    if(cfg.url.match(/\/page\//)){//page
        data.cdn = "http://" + cfg.host;
        data.resource = cfg.project;
        data.md5_version = new Date().getTime();
    }
    return data;
}


function mergeDataFunction(data){
    data = merge(data,{
        'i': function () {// 模板引擎支持 '{{#i}} demo {{hello}} {{/i}}' 形式的国际化
            return function (text, render) {
                return data['I18N'] && data['I18N'][text] ? render(data['I18N'][text]) : render(text);
            }
        }
    });
    return data;
}

//initTemplateData & debug zone
function initTemplateData(data, cfg){
    //clear cache;
    Mustache.clearCache();
    //
    var content = fs.readFileSync(cfg.file, 'utf8').trim();
    //condition change zone
    if(path.basename(cfg.templateName) === 'main.html' && !cfg.isDev && !cfg.isRaw && cfg.query.iframe !== 'true'){
        content = content + '<div style="position:fixed;bottom:0px;">' 
        + '<script>var _debugurlparam_ = "' + cfg.url + '" ;sessionStorage && sessionStorage.setItem("' + cfg.url + '", "' + encodeURI(JSON.stringify(data)) +'");</script>'
        // + '<script>(' + (JSON.stringify(data)) +');</script>'
        + showDebugBtn()
        + onSelectChange()
        + showThemeList(cfg.project) 
        + showLanguageList(cfg.root, cfg.project)
        + showJsonDataList(cfg.testDir)
        + '</div><div id="iframeDebug" style="display:none; background-color: rgb(0, 0, 0); opacity: 0.9;width:100%;height:100%;overflow:scroll;position:fixed;top:0px;"></div>';
    }
    var output;
    if(cfg.isRaw){
        output = getMustachePartials(content, cfg.root);
    }else{
        if(cfg.isWidgetOrPagelet){
            var layout;
            if(fs.existsSync(path.join(cfg.testDir,'_layout.html'))){
                layout = fs.readFileSync(path.join(cfg.testDir,'_layout.html'), 'utf8');
            }else{//如果没有_test/_layout.html，就使用默认的ria-packager/lib/server/_layout.html
                layout = fs.readFileSync(path.join(__dirname,'_layout.html'), 'utf8');
            }

            if(cfg.isDev){
                output = layout.replace(/\{\{\>\s*main_widget_content\s*\}\}/g,'main_widget_content')
                    .replace(/\{\{\>\s*widget\/global_config\/main.html\s*\}\}/g,'global_config');
                
                output = Mustache.render(output, data);
                output = output.replace('main_widget_content', content)
                .replace('global_config',fs.readFileSync(path.join(cfg.root, 'widget/global_config/main.html'
                .replace(/\//g,path.sep)), 'utf8'));

                output = getMustachePartials(output, cfg.root);
            }else{
                output = Mustache.render(layout, data, function(partial) {//auto load partial template
                    return partial === 'main_widget_content' ? content : fs.readFileSync(path.join(cfg.root, partial), 'utf8').trim();
                }); 
            }
        }else{
            if(cfg.isDev){
                output = getMustachePartials(content, cfg.root);
            }else{
                output = Mustache.render(content, data, function(partial) {//auto load partial template
                    return fs.readFileSync(path.join(cfg.root, partial), 'utf8').trim();
                });
            }
        }
    }
    return output;
}

//init params
function initParams(reqCfg){
    var configInfo = {};
    configInfo.arr = reqCfg.url.split('/'), 
    configInfo.project = configInfo.arr[1], 
    configInfo.templateName = reqCfg.url.split(configInfo.project)[1].split('?')[0];
    configInfo.root = path.join(reqCfg.documentRoot, configInfo.project);
    configInfo.file = path.join(configInfo.root, configInfo.templateName);
    configInfo.dataFile = configInfo.file.replace('.html', '.json');
    configInfo.testDir = path.join(path.dirname(configInfo.file) , '_test');
    if(fs.existsSync(path.join(configInfo.testDir, path.basename(configInfo.file ,'.html')) + '.json')){
        configInfo.dataFile = path.join(configInfo.testDir,path.basename(configInfo.file,'.html')) + '.json'; // main template data (.json file)
    }
    configInfo.host = reqCfg.host;
    configInfo.url = reqCfg.url;
    if(!reqCfg.query){
        configInfo.query  = {};
    }else{
        configInfo.query = reqCfg.query;
    }
    if(configInfo.query.template_data){
        configInfo.templateData = reqCfg.query.template_data;
    }
    configInfo.iframe = configInfo.iframe;
    configInfo.dev = configInfo.query.dev == 'true';
    configInfo.rawContent = configInfo.query.raw == 'true';
    configInfo.globalConfig = path.join(configInfo.root, 'widget/global_config/_test/main.json'.replace(/\//g,path.sep));
    configInfo.theme = (configInfo.query.theme || ('/less/theme/default.css')).replace("/" + configInfo.project,'');
    configInfo.i18n = configInfo.i18n;
    configInfo.prefix = "http://" + configInfo.host + '/'+ configInfo.project ;
    configInfo.isWidgetOrPagelet = configInfo.url.match(/\/pagelet\/|\/widget\//);
    if(!fs.existsSync(configInfo.file) || !fs.statSync(configInfo.file).isFile()){
        throw configInfo.file + ' does not exists! \n <a href="/">return</a>';
    }
    return configInfo;
}

//generateHTML

function generateHTML(reqCfg, res, jsonInfo){
    res.header('Content-Type' , 'text/html;charset=utf-8');
    if(!jsonInfo){
        jsonInfo = generateJSON(reqCfg);
    }
    var data = mergeDataFunction(jsonInfo.data)
    var output = initTemplateData(data, jsonInfo.config);
    res.end(output);
}

//generateJSON
function generateJSON(reqCfg){
    var config = initParams(reqCfg);
    //hack rewrite require method for *.json;
    var _require_ = module.require;
    module.require = function(id){
        if(id.match(/\.json$/)){
            id = path.join(config.root,id);
            return eval('(' + fs.readFileSync(id, 'utf-8') + ')')
        }else{
            return _require_(id);
        }
    };
    return {
        'data' : renderData(config),
        'config' : config
    };
}

render.generateJSON = generateJSON;
render.generateHTML = generateHTML;
render.initParams = initParams;
module.exports = render;
