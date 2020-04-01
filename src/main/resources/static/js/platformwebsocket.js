// platformsocket
var platformsocket ;
var platformsocketurl = "wss://192.168.1.231:8081/ws";
var reconnplatformflag = false;

var initEventHandle = function(){
	platformsocket.onopen = function(){
		console.log("platformsocket onopen success --------->>")

		/*setTimeout(function () {
			platformsocket.send();
			console.log("onopen send success")
		}, 5000)*/
	};
	platformsocket.onmessage = function(event) {

	}
	platformsocket.onclose = function (e) {
		console.log('platformsocket onmessage onclose 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
		console.log(e)
	}
	platformsocket.onerror = function () {
		console.log('platformsocket onerror  websocket 尝试重连中……')
		reconnect(websocketurl,initEventHandle);
	};
}

function createWebSocket(url,callbak) {
	try {
		if (window.WebSocket) {
			platformsocket = new WebSocket(url);
			callbak();
		}
	} catch (e) {
		reconnect(url,callbak);
	}
}
createWebSocket(platformsocketurl , initEventHandle);
function reconnect(url,callbak) {
	if(reconnplatformflag) return;
	reconnplatformflag = true;
	//没连接上会一直重连，设置延迟避免请求过多
	setTimeout(function () {
		createWebSocket(url,callbak);
		reconnplatformflag = false;
	}, 2000);
}

function sendPlatformMessage() {
	var message = {
		from : param.userId,
		to: param.sendId,
		text: 'register'
	};
	var jsonMessage = JSON.stringify(message);

	console.log("send paltformMessage to platformws");

	setTimeout(function () {
		platformsocket.send("hello websocket");
	}, 5000)
}

