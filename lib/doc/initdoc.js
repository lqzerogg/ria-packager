var path = require('path');
var os = require('os');
var fs = require('fs');
var Mustache = require('mustache');
var docbase = require('./base.js');
var Converter = require("./Markdown.Converter").Converter;
var getSanitizingConverter = require("./Markdown.Sanitizer").getSanitizingConverter;

var DEFAULT_THEME_LIST = [
	{
		'key' : '/lightsource/less/theme/default.css',
		'value' : 'default',
		'selected' : 'checked'
	},
	{
		'key' : '/lightsource/less/theme/newblue.css',	
		'value' : 'newblue',
		'selected' : ''
	}
];
var MARKDOWN_NEED = ['list','init', 'event', 'intro', 'data', 'notice'];

var DEFAULT_DESCRIPTION = {"list":"","template":"","init":"","time":"0","event":"","intro":"","data":"","notice":""};
//scan info && merge info
var encodeHTML = function (a){if(typeof a!="string")throw"encodeHTML need a string as parameter";return a.replace(/\&/g,"&amp;").replace(/"/g,"&quot;").replace(/\</g,"&lt;").replace(/\>/g,"&gt;").replace(/\'/g,"&#39;").replace(/\u00A0/g,"&nbsp;").replace(/(\u0020|\u000B|\u2028|\u2029|\f)/g,"&#32;")}

function initJSON(dir, documentRoot, source){
	var filepath = path.join(documentRoot, dir, '_description');
	var data = {}, orginData;
	if(fs.existsSync(filepath)){
		orginData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
	}
	if(orginData){
		data = merge(orginData, data);
	}
	data.widget = dir.split('/')[dir.split('/').length-1];
	// data.require_html = data.require_html || [];
	// data.require_js = data.require_js || [];
	// data.require_css = data.require_css || [];
	data.description = data.description || DEFAULT_DESCRIPTION;
	var htmlpath = path.join(documentRoot, dir, 'main.html'),
		htmlArr = (fs.existsSync(htmlpath) && fs.readFileSync(htmlpath, 'utf-8').match(/\{\{\>\s*(.+)\s*\}\}/g)) || [];
	data.require_html = docbase.getIncludeInfo(htmlpath, htmlArr, 'html');
	var jspath = path.join(documentRoot, dir, 'main.js'),
		jsArr = (fs.existsSync(jspath) && fs.readFileSync(jspath, 'utf-8').match(/require\s*\(\s*(['|"])([\w\-\.\/]+)\1\s*\)\s*;?/gi)) || [];
	data.require_js = docbase.getIncludeInfo(jspath, jsArr, 'js');
	var csspath = path.join(documentRoot, dir, 'main.less'),
		// cssArr = fs.readFileSync(csspath, 'utf-8').match(/@import(?:-(once))?\s*(url\s*\()*\s*(['|"]?)([\w\?\=\,\-\.\:\/\\\s]+)\2\s*(\))*\s*(['|"]?);?/igm);
		cssArr = (fs.existsSync(csspath) && fs.readFileSync(csspath, 'utf-8').match(/@import(?:-(once))?\s*(url\s*\()*\s*(['|"]?)([\w\?\=\,\-\.\:\/\\\s]+)\s*(['|"]?)(\))?\s*;?/igm)) || [];
	data.require_css = docbase.getIncludeInfo(csspath, cssArr, 'css');
	data.path = path.join(documentRoot, dir);
	data.name = dir;
	var testcase = [];
	var testcasePath = path.join(documentRoot, dir, '_test');
	data.testcase = data.testcase || {} ;
	data.testcase.theme = docbase.getTheme(DEFAULT_THEME_LIST, data.testcase.theme);
	var templateList = [];
	if(fs.existsSync(testcasePath)){
        var list = fs.readdirSync(testcasePath);
        for(var i = 0; i < list.length; i++){
        	var filename = list[i];
        	if(filename.indexOf('.json') > -1 && filename !== 'doc.json'){
        		templateList.push({
	        		'key' : filename,
	        		'value' : filename.split('.json')[0],
	        		// 'selected' : 'selected',
	        		'descript' : docbase.getIncludeInfo(path.join(testcasePath,filename), [], 'json')
	        	});	
        	}
        	
        }
    }
	data.lastmodify = new Date().getTime();
	if(data.testcase.i18n){
		data.testcase.i18n = docbase.getI18N(path.join(documentRoot, 'lightsource'), data.testcase.i18n);	
	}else{
		data.testcase.i18n = docbase.getI18N(path.join(documentRoot, 'lightsource'));	
	}
	data.testcase.template = templateList;
	return data;
}

function initEditPage(options){
	var arr = options.url.split('/');
	var dir = '';
	for(var i = 1; i< arr.length - 1; i++){
		dir = path.join(dir, arr[i]);
	}
	var data = initJSON(dir, options.documentRoot, arr[1]);
	data.testcase.theme.shift();
	data.testcase.i18n.shift();
	data.includecss = fs.readFileSync(path.join(__dirname, 'include.css'), 'utf8');
	data.includejs = fs.readFileSync(path.join(__dirname, 'include.js'), 'utf8');
	data.type = options.query.type || 'widget';
	var templateHtml = fs.readFileSync(path.join(__dirname, 'edit.html'), 'utf8');
	return Mustache.render(templateHtml, data);
}

function initGenerPage(options){
	var data = {};
	var type = options.type || 'widget';
	data.widgetList = docbase.getWidgets(path.join(options.documentRoot, options.source, type));
	data.includecss = fs.readFileSync(path.join(__dirname, 'include.css'), 'utf8');
	data.includejs = fs.readFileSync(path.join(__dirname, 'include.js'), 'utf8');
	data.type = type;
	var templateHtml = fs.readFileSync(path.join(__dirname, 'generWidget.html'), 'utf8');
	return Mustache.render(templateHtml, data);
}

function decodeURIData(data){
	for(var x in data){
		if(typeof data[x] === 'string'){
			data[x] = decodeURIComponent(data[x]);
		}else if(typeof data[x] === 'object'){
			data[x] = decodeURIData(data[x]);
		}
	}
	return data;
}

function generateDoc(data, root, url){
	var arr = url.split('/');
	var dir = '';
	for(var i = 1; i< arr.length - 1; i++){
		dir = path.join(dir, arr[i]);
	}
	var filepath = path.join(root, dir, '_description');
	data = decodeURIData(data);
	fs.writeFile(filepath, JSON.stringify(data));
}

function generateWidget(data, root, source, type){
	data = decodeURIData(data);
	var dir = path.join(root, source, type, data.dir,  data.widget);
	var list = data.testcase && data.testcase.template;
	if(fs.existsSync(dir)){
		throw (dir + ' exists;create failed');
	}else{
		fs.mkdir(dir, 0777, function(){
			//make file
			var testDir = path.join(dir, '_test');
			var mainHTML = path.join(dir, 'main.html');
			var mainCSS = path.join(dir, 'main.less');
			var mainJS = path.join(dir, 'main.js');
			fs.writeFileSync(mainHTML, '');
			fs.writeFileSync(mainCSS, '');
			fs.writeFileSync(mainJS, '');
			fs.mkdir(testDir, 0777, function(){
				for(var i = 0; i <  list.length; i++){
					fs.writeFile(path.join(testDir, list[i].name + '.json'), '/*litb-json' + list[i].description + '*/');		
				}
			})
			fs.writeFile(path.join(dir, '_description'), JSON.stringify(data));		
		});
	}
}	

function merge(source,target){
    for(var k in source){
    	target[k] = source[k];	
    }
    return target;
}


function getData(root, dir, rootsource, hash, type){
	var orginData = initJSON(dir, root, rootsource);
	var data = orginData;
    var conv = new Converter();
    // var saneConv = getSanitizingConverter();
    var descriptions = data.description;
    if(descriptions){
       data.description.show = [];
       for(var i = 0; i < MARKDOWN_NEED.length; i++){
        var orgin = descriptions[MARKDOWN_NEED[i]];
        if(orgin !=''){
            data.description.show.push({
                'key' : MARKDOWN_NEED[i],
                'value' : conv.makeHtml(orgin)
            });
        }
       }
       //template
       if(descriptions.template && descriptions.template !=''){
            data.description.show.push({
                'key' : 'template',
                'value' : descriptions.template
            });
       }

    }
    if( data.pagelets && (typeof  data.pagelets === 'string')){
    	 data.pagelets = [data.pagelets];
    }
    //init iframe
    var iframeUrl = '/' + rootsource + '/' + type + '/';
    for(var i = 0; i < hash.split('||').length; i++){
    	iframeUrl = iframeUrl + hash.split('||')[i] + '/';
    }
    data.used = docbase.getRelPage(hash.split('||'), path.join(root, rootsource), type)
    data.iframes = [];
    var template = data.testcase.template, i18n = data.testcase.i18n, theme = data.testcase.theme;
    if(template.length === 0){
    	data.iframes.push({
            'name' : 'default',
            'descript' : '',
            'url' : iframeUrl + 'main.html?iframe=true'
        });
    }
    for(var k = 0; k < template.length; k++){
        var templateName = template[k].value;
        var description = template[k].descript;
        var json = template[k].key;
        if(i18n.length > 1){
        	for(var j = 0; j < i18n.length; j++){
        		if(i18n[j].selected === 'checked'){
        			var url = (i18n[j].key == 0) ? '' : '&i18n=' + i18n[j].value;
        			for(var i=0; i < theme.length; i++){
		        		if(theme[i].selected === 'checked'){
		        			data.iframes.push({
				                'name' : templateName + '-' + i18n[j].value + '-' + theme[i].value,
				                'descript' : description,
				                'url' : iframeUrl + 'main.html?iframe=true&template_data=' + json + url + '&theme=' + theme[i].key
				            });
		        		}	
		        		
		        	}
        		}
        	}
        }else if(theme.length > 1){
        	for(var i=0; i < theme.length; i++){
        		if(theme[i].selected === 'checked'){
        			var url = (theme[i].value == 0) ? '' : '&theme=' + theme[i].key
        			data.iframes.push({
		                'name' : templateName + '-' + theme[i].value,
		                'descript' : description,
		                'url' : iframeUrl + 'main.html?template_data=' + json + url
		            });
        		}	
        		
        	}
        }else{
            data.iframes.push({
                'name' : templateName,
                'descript' : description,
                'url' : iframeUrl + 'main.html?iframe=true&template_data=' + json
            });
        }
    }
    return data;
}

function getList(root, source, type){
	var dir = path.join(root, source, type);
	return docbase.getAllWidgetList(dir);
}


module.exports = {
	'initEditPage' : initEditPage,
	'initGenerPage' : initGenerPage,
	'generateDoc' : generateDoc,
	'generateWidget' : generateWidget,
	'getList' : getList,
	'getData' : getData
}


//test unit
// generateDir({
// 	'testcase' : {
// 		'template'	: [
// 			'main'
// 		]
// 	}
// }, '/data/work/', 'testDir', '/lightsource/widget/qa/')
// console.log(getPagelet('/data/work/lightsource/pagelet/'));
// console.log(getWidgetList('/data/work/lightsource/widget/'));