/*var partChildNodes =  document.getElementById('participants').childNodes;
var screenHeight =  window.screen.height ;

if(partChildNodes.length == 2){
    //添加新元素，删除旧元素
    $('.participant.main').classList.add('first');
    $('.participant.first').classList.remove('main');

}*/
var winWidth = 0;
var winHeight = 0;
function findDimensions(){ //函数：获取尺寸
    //获取窗口宽度
    if (window.innerWidth)
        winWidth = window.innerWidth;
    else if ((document.body) && (document.body.clientWidth))
        winWidth = document.body.clientWidth;
    //获取窗口高度
    if (window.innerHeight)
        winHeight = window.innerHeight;
    else if ((document.body) && (document.body.clientHeight))
        winHeight = document.body.clientHeight;

    //通过深入Document内部对body进行检测，获取窗口大小
    if (document.documentElement  &&
        document.documentElement.clientHeight &&
        document.documentElement.clientWidth){
        winHeight = document.documentElement.clientHeight;
        winWidth = document.documentElement.clientWidth;
    }

}

findDimensions(); //调用函数，获取数值
window.οnresize=findDimensions;
console.log(winWidth);
console.log(winHeight);