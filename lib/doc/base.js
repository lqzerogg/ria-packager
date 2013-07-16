var path = require('path');
var os = require('os');
var fs = require('fs');
var MAP = {
    "html" : {
        "reg" : /<!--litb-html[\S\s]*?-->/g ,
        "replaceBegin" : "<!--litb-html",
        "replaceEnd" : "-->"
    },
    "js" : {
        "reg" : /\/\*litb-js[\S\s]*?\*\//g ,
        "replaceBegin" : "/*litb-js",
        "replaceEnd" : "*/"
    },
    "css" : {
        "reg" : /\/\*litb-css[\S\s]*?\*\//g ,
        "replaceBegin" : "/*litb-css",
        "replaceEnd" : "*/"
    },
    "json" : {
        "reg" : /\/\*litb-json[\S\s]*?\*\//g ,
        "replaceBegin" : "/*litb-json",
        "replaceEnd" : "*/"
    }
}




//get 18n list
function getI18N(root, data){
    if(data && typeof data === 'string'){
        data = [data];
    }
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

    var select = [];
    select.push({
    	'key' : 0,
    	'value' : 'default',
    	'selected' : 'checked'
    })
    Object.keys(language).sort().forEach(function(lang){
        var flag = false;
        if(data){
            flag = inArray(lang, data);
        }
        select.push(
        	{
		    	'key' : lang,
		    	'value' : lang,
		    	'selected' : (flag === false) ? '' : 'checked'
		    }
        );
    });
    return select;
};

function getRelPage(name, dir, type){
    type = type || 'widget';
    var relArr = [];
    dir = path.join(dir, type =='pagelet' ? 'page' : 'pagelet');
    var url = type + '/' + name.join('/') + '/main.html';    
    if(fs.existsSync(dir) && type !='pagelet'){
        var list = fs.readdirSync(dir);
        for(var i = 0; i < list.length; i++){
            var str = fs.readFileSync(path.join(dir, list[i], 'main.html'), 'utf-8');
            if(str.indexOf(url)>-1){
                relArr.push({'name' : list[i]});    
            }
        }
    }else if(fs.existsSync(dir)){
        var list = getAllWidgetList(dir);
        for(var i = 0; i< list.length; i++){
            var name = list[i].name;
            var child = list[i].list;
            for(var j = 0; j < child.length; j++){
                if(fs.existsSync(path.join(dir, name, child[j], 'main.html'))){
                    var str = fs.readFileSync(path.join(dir, name, child[j], 'main.html'), 'utf-8');
                    if(str.indexOf(url)>-1){
                        relArr.push({'name' : [name, child[j]]});    
                    }  
                }
            }
        }
    }
    return relArr;
}

function getTheme(orgin, theme){
    var arr = [];
    arr = orgin.slice(0);
    if(theme){
        theme = (typeof theme === 'string') ? [theme] : theme;
        for(var i = 0; i < orgin.length; i++){
            var flag = inArray(orgin[i].key, theme);
            if(flag !== false){
                orgin[i].selected = 'checked';
            }

        }
    }
    return arr;
}

//get widegetlist
function getWidgets(dir){
    var widgetlist = [];
    widgetlist.push({'name':'default', 'value' : ''});
    if(fs.existsSync(dir)){
        var list = fs.readdirSync(dir);
        for(var i = 0; i < list.length; i++){
            if(!isWidget(path.join(dir, list[i]))){
                widgetlist.push({
                    'name' : list[i],
                    'value' : list[i]
                });
            }
        }
    }
    return widgetlist;
}

//get widegetlist
function getAllWidgetList(dir){
    var widgetlist = [];
    if(fs.existsSync(dir)){
        var list = fs.readdirSync(dir);
        for(var i = 0; i < list.length; i++){
            if(isWidget(path.join(dir, list[i]))){
                widgetlist.push({
                    'name' : list[i],
                    'value' : list[i]
                });
            }else{
                // var templist = getAllWidgetList(path.join(dir, list[i]));
                widgetlist.push({
                    'name' : list[i],
                    'value' : list[i],
                    'list' : fs.readdirSync(path.join(dir, list[i]))
                });
            }
        }
    }
    return widgetlist;
}


// is widget
function isWidget(dir){
    var filepath = path.join(dir, 'main.html');
    if(fs.existsSync(filepath)){
        return true;
    }else{
        return false;
    }
}

//writed file;
function writePage(data, filepath){
    fs.writeFile(filepath, JSON.stringify(data), function(err){
        console.log('file writed');
    })
}

//init list
function checkList(checkedList ){
    if(fs.existsSync(testcasePath)){
        var list = fs.readdirSync(testcasePath);
        for(var i = 0; i < list.length; i++){
            templateList.push({
                'key' : list[i],
                'value' : list[i],
                'selected' : 'selected'
            });
        }
    }
}



function getComments(filepath, type){
    var map = MAP[type];
    if(!fs.existsSync(filepath)){
        return [];
    }
    var str = fs.readFileSync(filepath, 'utf-8');
    var reg = map["reg"];
    var comments = str.match(reg) || [];
    for(var i = 0; i < comments.length; i++){
        comments[i] = comments[i].replace(map["replaceBegin"], '');
        comments[i] = comments[i].replace(map["replaceEnd"], '');
    }
    return (comments);
}



// not used any more;
function getInclude(orgArr, scanArr){
    var newArr = [];
    for(var i = 0; i < scanArr.length; i++){
        var num = inArray(scanArr[i], orgArr, 'key');
        if(num !== false){
            newArr.push({
                'url' : scanArr[i],
                'description' : orgArr[i]['value']
            });
        }else{
            newArr.push({
                'url' : scanArr[i],
                'description' : ''
            });
        }
    }
    return newArr;
}

function inArray(value ,arr, key){
    for(var i = 0; i < arr.length; i++){
        var compareValue = key ? arr[i][key] : arr[i];
        if(compareValue == value){
            return i;
        }
    }
    return false;
}

function getIncludeInfo(filepath, orgArr, type){
    var newArr = [];
    var scanArr = getComments(filepath, type);
    if(type === 'json'){
        return getComments(filepath, type).join('<br/>');
    }
    for(var i = 0; i < orgArr.length; i++){
        newArr.push({
            'url' : orgArr[i],
            'description' : scanArr[i] || ''
        });
    }
    return newArr;
}

module.exports = {
    'getI18N' : getI18N,
    'getWidgets' : getWidgets,
    'getTheme' : getTheme,
    'getIncludeInfo' : getIncludeInfo,
    'getAllWidgetList' : getAllWidgetList,
    'getRelPage' : getRelPage
}