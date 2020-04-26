
var wsurl =  'wss://' + location.host + '/call';
var lockReconnect = false;  //避免ws重复连接
createWebSocket(wsurl);

function createWebSocket(url) {
    try{
        if ("MozWebSocket" in window) {
            window.WebSocket=window.MozWebSocket;
        }else if('WebSocket' in window){
            ws = new WebSocket(url);
        }else{
            layui.use(['layer'],function(){
                var layer = layui.layer;
                layer.alert("您的浏览器不支持websocket协议,建议使用新版谷歌、火狐等浏览器，请勿使用IE10以下浏览器，360浏览器请使用极速模式，不要使用兼容模式！");
            });
        }
        initEventHandle();
    }catch(e){
        reconnect(url);
        console.log(e);
    }
}
// 监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
window.onbeforeunload = function() {
    ws.close();
}

function reconnect(url) {
    if(lockReconnect) return;
    lockReconnect = true;
    setTimeout(function () {     //没连接上会一直重连，设置延迟避免请求过多
        createWebSocket(url);
        lockReconnect = false;
    }, 2000);
}