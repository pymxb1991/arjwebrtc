// platformsocket
var nettysocket ;
var nettysocketurl = "wss://192.168.1.231:2048/ws";
var reconnectflag = false;

/*function platFrom(){
	nettysocket= new WebSocket('wss://192.168.1.231:2048/ws'); //平台socket
	nettysocket.binaryType = 'arraybuffer';
	nettysocket.onopen=function () {
		console.log("[open] Connection successful -> 平台socket server");

		//sendPlatformMessage();
	};

}*/

//平台socket 设置连接成功后的回调函数
/*var initEventHandle = function () {
	//收到消息后
	nettysocket.onmessage = function(event) {
		console.log("onmessage receive");
		if (event.data instanceof ArrayBuffer){
			console.log("onmessage receive ArrayBuffer");
		}else {
			var data = event.data;                //后端返回的是文本帧时触发
			console.log("onmessage receive text");

		}
	}
	//连接后
	nettysocket.onopen = function(event) {
		console.log("onopen successful");
/!*		var message = new proto.Model();
		var browser=BrowserUtil.info();
		message.setVersion("1.0");
		message.setDeviceid("")
		message.setCmd(1);
		message.setSender(currentsession);
		message.setMsgtype(1);
		message.setFlag(1);
		message.setPlatform(browser.name);
		message.setPlatformversion(browser.version);
		message.setToken(currentsession);
		var bytes = message.serializeBinary();
		nettysocket.send(bytes);*!/

	};
	//连接关闭
	nettysocket.onclose = function(event) {
		console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
		console.log(e)
	};
	nettysocket.onerror = function () {
		console.log('websocket 尝试重连中……')
		reconnect(websocketurl,initEventHandle);
	};

}*/
var initEventHandle = function(){
	nettysocket.onopen = function(){
		console.log("onopen success")
		var message = new proto.Model();
		var browser=BrowserUtil.info();
		message.setVersion("1.0");
		message.setDeviceid("")
		message.setCmd(1);
		message.setSender(param.userId);
		message.setToken(param.userId);
		message.setMsgtype(1);
		message.setFlag(1);
		message.setPlatform(browser.name);
		message.setPlatformversion(browser.version);
		var bytes = message.serializeBinary()
		console.log("bytes --> ", bytes)
		setTimeout(function () {
			nettysocket.send(bytes);
			console.log("onopen send success")
		}, 5000)

	};
	nettysocket.onmessage = function(event) {
		debugger
		var msg =  proto.Model.deserializeBinary(event.data);      //如果后端发送的是二进制帧（protobuf）会收到前面定义的类型
		var msgCon =  proto.MessageBody.deserializeBinary(msg.getContent());
		/*var parsedMessage = JSON.parse(event.data);*/
		console.info('nettysocket Received message: ' + event.data);

		if(param.userId == msg.getReceiver()){ //回调用户是呼叫者的时候，发起呼叫
			call();
		}
	}
	nettysocket.onclose = function (e) {
		console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
		console.log(e)
	}
}

function createWebSocket(url,callbak) {
	try {
		if (window.WebSocket) {
			nettysocket = new WebSocket(url);
			nettysocket.binaryType = "arraybuffer";
			callbak();
		} else {
			var isClose =false;
			window.onbeforeunload =function() {
				if(!isClose){
					return "确定要离开当前聊天吗?";
				}else{
					return "";
				}
			}
			window.onunload =function() {
				if(!isClose){
					Imwebserver.closeconnect();
				}
			}
			dwr.engine.setActiveReverseAjax(true);
			dwr.engine.setNotifyServerOnPageUnload(true);
			dwr.engine.setErrorHandler(function(){
			});
			dwr.engine._errorHandler = function(message, ex) {
				//alert("服务器出现错误");
				//dwr.engine._debug("Error: " + ex.name + ", " + ex.message, true);
			};
			Imwebserver.serverconnect();
		}
	} catch (e) {
		reconnect(url,callbak);
	}
}
createWebSocket(nettysocketurl , initEventHandle);
function reconnect(url,callbak) {
	if(reconnectflag) return;
	reconnectflag = true;
	//没连接上会一直重连，设置延迟避免请求过多
	setTimeout(function () {
		createWebSocket(url,callbak);
		reconnectflag = false;
	}, 2000);
}

function sendPlatformMessage() {
	console.log("send paltformMessage to netty");
	var message = new proto.Model();
	var content = new proto.MessageBody();
	message.setMsgtype(4);
	message.setCmd(5);
	message.setGroupid('video');//系统用户组
	message.setToken(param.userId);
	message.setSender(param.userId);
	message.setReceiver(param.sendId);//好友ID
	content.setContent('userRegister');
	//message.setAudioOrVideo(2);
	content.setType(0)
	message.setContent(content.serializeBinary())
	setTimeout(function () {
		nettysocket.send(message.serializeBinary());
	}, 5000)
}
function sendPlatformMessage2() {
	console.log("send paltformMessage to receiver",param);
	var message = new proto.Model();
	var content = new proto.MessageBody();
	message.setMsgtype(4);
	message.setCmd(5);
	message.setGroupid(param.type);
	message.setToken("param.userId");
	message.setSender("param.userId");
	message.setReceiver(param.sendId);//好友ID
	let con = {
		sender: param.sendId,
		content:param.type
	}
	content.setContent(JSON.stringify(con));
	//content.setContent(param.type);
	content.setType(0);
	message.setContent(content.serializeBinary());
	console.log("转之前",message)
	nettysocket.send(message.serializeBinary());
	var msg =  proto.Model.deserializeBinary(message.serializeBinary());
	console.log("转之后",msg)
	console.log("send paltformMessage to receiver successful ", param.userId);
}

