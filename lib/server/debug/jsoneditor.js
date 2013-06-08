//onchange --
function onchangeJSON(){
}

function initJSON(){
    var testJSON = {};
    $('#editor').children().each(function(i){
        var type = $(this).attr('class').split('item ')[1];
        if(type.indexOf('object') >-1  || type.indexOf('array') >-1){
            testJSON[$(this).children('input.property').val()] = JSON.parse($(this).children('input.value').val());
        }else if(type.indexOf('string') >-1 || type.indexOf('boolean') >-1){
            testJSON[$(this).children('input.property').val()] = eval($(this).children('input.value').val());
            // testJSON[$(this).children('input.property').val()] = $(this).children('input.value').val();
        }else{
            testJSON[$(this).children('input.property').val()] = $(this).children('input.value').val();
        }
    });
    return testJSON;
}

/**
 * query to json
 * @param {Json} JSON
 * @param {Boolean} isEncode
 * @return {String} querystring
 * @author Robin Young | yonglin@staff.sina.com.cn
 * @example
 * var q1 = 'a=1&b=2&c=3';
 * queryToJson(q1) === {'a':1,'b':2,'c':3};
 */

function queryToJSON(QS, isDecode){
    var _Qlist = $.trim(QS).split("&");
    var _json  = {};
    var _fData = function(data){
        if(isDecode){
            return decodeURIComponent(data);
        }else{
            return data;
        }
    };
    for(var i = 0, len = _Qlist.length; i < len; i++){
        if(_Qlist[i]){
            var _hsh = _Qlist[i].split("=");
            var _key = _hsh[0];
            var _value = _hsh[1];
            
            // 如果只有key没有value, 那么将全部丢入一个$nullName数组中
            if(_hsh.length < 2){
                _value = _key;
                _key = '$nullName';
            }
            // 如果缓存堆栈中没有这个数据
            if(!_json[_key]) {
                _json[_key] = _fData(_value);
            }
            // 如果堆栈中已经存在这个数据，则转换成数组存储
            else {
                if($.core.arr.isArray(_json[_key]) != true) {
                    _json[_key] = [_json[_key]];
                }
                _json[_key].push(_fData(_value));
            }
        }
    }
    return _json;
};

/**
 * parse URL
 * @id parseURL
 * @param {String} str
 * @return {Object} that
 * @author Robin Young | yonglin@staff.sina.com.cn
 * @notice:not working while host is 'localhost'
 * @example
 * parseURL('http://t.sina.com.cn/profile?beijing=huanyingni') === 
    {
        hash : ''
        host : 't.sina.com.cn'
        path : 'profile'
        port : ''
        query : 'beijing=huanyingni'
        scheme : http
        slash : '//'
        url : 'http://t.sina.com.cn/profile?beijing=huanyingni'
    }
 */
function parseURL(url){
    var parse_url = /^(?:([A-Za-z]+):(\/{0,3}))?([0-9.\-A-Za-z]+\.[0-9A-Za-z]+)?(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
    var names = ['url', 'scheme', 'slash', 'host', 'port', 'path', 'query', 'hash'];
    var results = parse_url.exec(url);
    var that = {};
    for (var i = 0, len = names.length; i < len; i += 1) {
        that[names[i]] = results[i] || '';
    }
    return that;
};

//init data over

$(document).ready(function() {
    //expander all function
    $('#expander').click(function() {
        var editor = $('#editor');
        editor.toggleClass('expanded');
        $(this).text(editor.hasClass('expanded') ? 'Collapse' : 'Expand all');
    });
    
    //getUrl;
    var originURLParam = parseURL(window.location.href).query.split('param=')[1];
    //get json decode from sessionStorage;
    var json = sessionStorage.getItem(originURLParam) === true ? {} : sessionStorage.getItem(originURLParam);
    //for '<scirpt></script>' bug in Firefox
    json = decodeURI(json);
    json = JSON.parse(json);
    var originURL = window.location.origin + originURLParam;
    var queryCollection = originURLParam.split('?');
    var query = queryCollection.length > 1 ? queryToJSON(queryCollection[1]) : {};
    $('#editor').jsonEditor(json, { change: onchangeJSON });

    //btn function zone
    //reset
    $('#resetJSON').click(function(){
        var jsonStorage = sessionStorage.getItem(originURLParam) === true ? {} : sessionStorage.getItem(originURLParam);
        jsonStorage = decodeURI(jsonStorage);
        jsonStorage = JSON.parse(jsonStorage);
        $('#editor').jsonEditor(jsonStorage, { change: onchangeJSON });
    });
    //save
    $('#saveJSON').click(function(){
        //stringify json and encodeURI for sringify string in json;
        var obj = encodeURI(JSON.stringify(initJSON()));
        $.post("/debug/save.ajax",{
            'url' : originURLParam,
            'query' : query,
            'host' : window.location.host,
            'data' : obj,
            'project' : originURLParam.split('?')[0].split('/')[1]
            },function(data){
                //rewrite location - before doc write for hack pushStage bug in Firefox;
                var state = {
                    title: document.title,  
                    url: originURLParam,  
                    otherkey: null };
                window.history.pushState(state, null, state.url);
                //write doc
                var newDoc = window.parent.document.open("text/html", "");
                newDoc.write(data);
                newDoc.close();
            });
    });
    //hide iframe;
    $('#cancelJSON').click(function(){
        window.parent.document.getElementById('iframeDebug').style.display = 'none';
    });
});


