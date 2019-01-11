var fs = require('fs');
var path = require('path');
const compressing = require('compressing');

var filePath = path.resolve('./data');
//调用文件遍历方法
fileDisplay(filePath);

/**
 * 文件遍历方法
 * @param filePath 需要遍历的文件路径
 */
function fileDisplay(filePath){
    //根据文件路径读取文件，返回文件列表
    fs.readdir(filePath,function(err,files){
        if(err){
            console.warn(err)
        }else{
            //遍历读取到的文件列表
            files.forEach(function(filename){
                console.log(filename)
                compressing.zip.compressDir('./data/'+filename+"/2018-12-15.data", './zip/'+filename+"/2018-12-15.zip")
                .then(() => {
                    console.log('success');
                })
                .catch(err => {
                    console.error(err);
                });

                
            });
        }
    });
}