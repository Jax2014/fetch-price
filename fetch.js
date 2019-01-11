let fs = require('fs')
let https = require('https')
let compressing = require('compressing')

let SECOND = 5000
let LOG_FILE_NAME = './log/log.txt'
let URL_ALL_TICKER = 'https://www.okex.me/api/futures/v3/instruments/ticker'
let URL_ALL_DEEP = 'https://www.okex.me/api/futures/v3/instruments/{{}}/book?size=1000'
let ALL_TARGET = []
let TIME = ''

init()

function init(){
    
    createCatalog('./log')
    createCatalog('./data')
    createCatalog('./zip')
    get(URL_ALL_TICKER,function(data){
        ALL_TARGET = JSON.parse(data)
        for(let i=0;i<ALL_TARGET.length;i++){
            createCatalog('./data/'+ALL_TARGET[i].instrument_id)
            createCatalog('./zip/'+ALL_TARGET[i].instrument_id)
        }
        setInterval(main, SECOND)
    })
}

function createCatalog(name){
    fs.exists(name,function(exists){
        if(exists){
            console.log('文件夹存在')
        }
        if(!exists){
            fs.mkdir(name,function(err){
                if (err) {
                    write(LOG_FILE_NAME,new Date() +'\n创建目录'+name+'失败')
                }else{
                    console.log('目录创建成功。')
                    write(LOG_FILE_NAME,new Date() +'\n创建目录'+name+'成功')
                }
            })
        }
    })
}
function write(file_name,val,func){
    fs.appendFile(file_name, val+'\n',  function(err) {
        if (err) {
            return write(LOG_FILE_NAME,new Date() +'\n写入'+file_name+'成功')
        }
        if(func){func()}
    });
}
function get(url,func){
    https.get(url, function (res) {  
        let datas = []
        let size = 0
        res.on('data', function (data) { 
            datas = datas + data
        });  
        res.on('end', function () {
            func(datas)
        });  
    }).on('error', function (err) {
       write(LOG_FILE_NAME,new Date() +'\n'+JSON.stringify(err))
    }); 
}

function mkdir(){
    let date = new Date()
    let y = date.getFullYear()    
    let m = date.getMonth() + 1  
    m = m < 10 ? ('0' + m) : m  
    let d = date.getDate()   
    d = d < 10 ? ('0' + d) : d
    let result = y + '-' + m + '-' + d

    return result
}

function getItem(key,val,arr){
    for(let i=0;i<arr.length;i++){
        if(val===arr[i][key]){
            return arr[i]
        }
    }
}
function zip(name){
    compressing.zip.compressDir('./data/'+name+'.data', './zip/'+name+'.zip')
    .then(() => {
         write(LOG_FILE_NAME,new Date() +'\n压缩文件'+name+'成功')
    })
    .catch(err => {
         write(LOG_FILE_NAME,new Date() +'\n压缩文件'+name+'失败')
    });
}

function main(){
    try{
        let file_name = mkdir()
        get(URL_ALL_TICKER,function(data){
            ALL_TARGET = JSON.parse(data)
            ALL_TARGET.count = ALL_TARGET.length
            for(let i=0 ; i < ALL_TARGET.length ; i++){
                get(URL_ALL_DEEP.replace('{{}}',ALL_TARGET[i].instrument_id),function(data){
                    
                    let d = JSON.parse(data)
                    let item = getItem('instrument_id',ALL_TARGET[i].instrument_id,ALL_TARGET)
                    d.last = parseFloat(item.last)
                    d.best_bid      = parseFloat(item.best_bid)
                    d.best_ask      = parseFloat(item.best_ask)
                    d.high_24h      = parseFloat(item.high_24h)
                    d.low_24h       = parseFloat(item.low_24h)
                    d.volume_24h    = parseFloat(item.volume_24h)
                    d.timestamp     = Date.parse(new Date(item.timestamp))
                    
                    if(TIME!==file_name&&TIME!==''){
                        write('./data/'+ALL_TARGET[i].instrument_id+'/'+TIME+'.data',']')
                        zip(ALL_TARGET[i].instrument_id+'/'+TIME)
                    }
                    let frefix = TIME !== file_name?'[':','
                    
                    write('./data/'+ALL_TARGET[i].instrument_id+'/'+file_name+'.data',frefix+JSON.stringify(d),
                    function(){
                        ALL_TARGET.count--
                        if( ALL_TARGET.count <= 0){
                            TIME = file_name
                        }
                    })
                    
                })
            }
        })
    }catch(e){
        console.log('error..'+new Date());
    }
 
}
