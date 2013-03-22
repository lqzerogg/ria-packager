/**
 * generate http://cloud.lbox.me...http://cloud8.lbox.me
 * @return {Function} 
 */
function randomHostBuilder(){
    return function(){
        //0 ~ 8
        var num = Math.round(Math.random()*10)%9;
        num = num === 0 ? '' : num;
        return 'http://cloud' + num + '.lbox.me';
    }
}
module.exports = {
    /**
     * cdnHost may be the following:
     * 1. http://testrelease.lightinthbox.com
     * 2. https://lightinthbox.com  (Note the HTTPS!)
     * 3. Function(such as: randomHostBuilder, will )
     *
     * typeof cdnHost === 'function';// or 'string'
     */
    'cdnHost' : randomHostBuilder()
    // 'cdnHost' : 'http://testrelease.lightinthbox.com'
    // 'cdnHost' : 'https://lightinthbox.com'
};