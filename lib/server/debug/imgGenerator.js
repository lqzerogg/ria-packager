var gm = require("gm");

/**
 * @description 随机图片生成器。基本思路：通过graphic magic插件生成图片，由Math.random提供随机数   
 * @param  {object} req request 对象
 * @param  {object} res response 对象
 */
function generate(req, res) {
    var sizeParm = req.param("size");
    var sizeReg = /^\d{2,4}X\d{2,4}$/i;
    if(sizeReg.test(sizeParm)) {
        /*符合书写规则*/
        // creating an image
        var size = sizeParm.split(/X/i);        
        var width = parseInt(size[0]);
        var height = parseInt(size[1]);
        var randomColor = "#";

        /*添加随机颜色*/
        for(var i = 0; i !== 6; ++ i) {
            randomColor += Math.floor(Math.random() * 15).toString(16);
        }

        console.log("---------------generate image---------------")
        console.log("---------------color:" + randomColor + "---------------");
        console.log("---------------size:" + sizeParm + "---------------");

        res.set({
            "Content-Type": "image/png",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache", 
            "Expires": "0"
        }).status(200);

        var imageStream = gm(width, height, randomColor)  /*创建图像*/
        .font("Arial").fontSize(height/5)
        .drawText(0, 0, sizeParm, "Center")          /*设置字体*/
        .stream("png");                              /*返回png的stream*/

        /*通过管道方式把图片写到response里头，并添加上end监听以关闭response*/
        imageStream.pipe(res).on("end", function() {res.end();});
    }else {
        /*不符合书写规则，返回400错误*/
        res.set({
            "Content-Type": "image/png"
        }).status(400);
        res.end();
    }   
}

exports.generate = generate;