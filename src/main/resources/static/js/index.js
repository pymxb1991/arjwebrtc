
//var ws =  new WebSocket('wss://' + location.host + '/call');
var ws ;//=  new WebSocket('wss://' + location.host + '/call');
//var initWebSocket = function(){
 if(location.host.startsWith("local")
	|| location.host.startsWith("127")
	|| location.host.startsWith("10")){
	ws = new WebSocket('wss://' + location.host + '/call')
 }else if(location.host.startsWith("153")){
	ws = new WebSocket('wss://153.0.171.158:9091/call')
 }
//}

var iceservers={
	"iceServers":[
		{
			//urls:"stun:47.94.247.75:3478"
			urls:"stun:153.0.171.158:3478"
		},
		{
			//urls:["turn:47.94.247.75:3478"],
			urls:["turn:153.0.171.158:3478"],
			username:"mytest",
			credential: "123456"
		}
	]
}
var videoInput;
var videoOutput;
var webRtcPeer;
var response;
var callerMessage;
var from;

var registerName = null;
var registerState = null;
const NOT_REGISTERED = 0;
const REGISTERING = 1;
const REGISTERED = 2;

var param = {};// new Array();
var user = {};


var callState = null;
const NO_CALL = 0;
const PROCESSING_CALL = 1;
const IN_CALL = 2;
var caller ;//呼叫者
var callee ;// 被呼叫者

window.onload = function() {
	// 获取页面参数
	getUrlParemeter();

	//console = new Console();
	/*setRegisterState(NOT_REGISTERED);*/
	var drag = new Draggabilly(document.getElementById('videoSmall'));
	videoInput = document.getElementById('videoInput');
	videoOutput = document.getElementById('videoOutput');
	//document.getElementById('name').focus();

	//页面加载完毕之后直接获取用户进行注册,注册过后进行拨号
	
	if("caller" == param.callType){
		setTimeout(function () {
			register(param.userId);
		},5000);
	}else{
		setTimeout(function () {
			register(param.sendId);
		},5000);
	}
	
	

}
//设置onbeforeunload监听器，语意为关闭窗口前关掉 websocket
window.onbeforeunload = function() {
	ws.close();	
	setTimeout(function () {
		window.close();
	},2000);
	
}
//添加状态判断，当为OPEN时，发送消息
ws.onopen  = function(){
	console.log("ws.onopening doing……")

}
ws.close = function(){
	console.log("ws.close")
	console.log(e)
	
}
ws.error = function () {
	console.log("ws.error")
}
//当收到来自服务器的消息时被调用的
//// 响应onmessage事件:
var responseMsg ;
ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	/*console.info('Received message: ' + message.data);*/
	responseMsg = parsedMessage.id;
	console.log("iceCandidate-------------->: ",parsedMessage.candidate);
	switch (responseMsg) {
	case 'registerResponse'://呼叫者回调
		registerResponse(parsedMessage);
		break;
	case 'callResponse':
		callResponse(parsedMessage);
		break;
	case 'incomingCall':
		incomingCall(parsedMessage);
		break;
	case 'startCommunication':
		startCommunication(parsedMessage);
		break;
	case 'stopCommunication':
		/*console.info('Communication ended by remote peer');*/
		stop(true);
		window.close();
		break;
	case 'incomingCallError':
		incomingCallError();
		break;
	case 'iceCandidate':
		webRtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
			if (error)
				return console.error('Error adding candidate: ' + error);
		});
		break;
	default:
		console.error('Unrecognized message', parsedMessage);
	}
}

/**
 * 获取地址参数
 */

function getUrlParemeter() {
	var url = location.search;
	//var url = "?userId=1&sendId=6c5a486706574f7ebb3334e5ba6ecbb3&type=video";
	//var url = "?userId=1&sendId=6c5a486706574f7ebb3334e5ba6ecbb3&type=video";
	console.log("url-------->>>>>>>>>",url);
	if(url.indexOf("?")!= -1){
		var str = url.substr(1);
		console.log("str-------->>>>>>>>>",str);
		var strs = str.split("&");
		console.log("strs-------->>>>>>>>>",strs);
		for(var i = 0;i < strs.length; i++){
			param[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
			console.log("param["+strs[i].split("=")[0]+"]",unescape(strs[i].split("=")[1]));
		}
	}
}
function registerResponse(message) {
	if (message.response == 'accepted') {
		setRegisterState(REGISTERED);
		/*console.log("2、register complete Response………… --------- > ",message.userId);*/
		if("caller" == param.callType){
			call();
		}
	} else {
		setRegisterState(NOT_REGISTERED);
		var errorMessage = message.message ? message.message
				: 'Unknown reason for register rejection.';
		console.log(errorMessage);
		alert('Error registering user. See console for further information.');
	}
}

/**
 * 被呼叫者应答之后，回调
 * @param message
 */
function callResponse(message) {
	if (message.response != 'accepted') {
		/*console.info('Call not accepted by peer. Closing call');*/
		var errorMessage = message.message ? message.message
				: 'Unknown reason for call rejection.';
		console.log(errorMessage);
		stop();
	} else {
		setCallState(IN_CALL);
		//后者调用processAnswer()导致应答转发给KMS
		webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
			if (error)
				return console.error(error);
		});
	}
}

function startCommunication(message) {
	/*console.log("10、startCommunication loading………… --------->");*/
	setCallState(IN_CALL);
	webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
		if (error)
			return console.error(error);
	});
	/*console.log("11、startCommunication complete………… --------->");*/
}

function incomingCall(message) {
	/*console.log("7、incomingCall loading………… --------->",message.to);*/
	showSpinner(videoInput, videoOutput);
	from = message.from;
	var options = {
		localVideo : videoInput,
		remoteVideo : videoOutput,
		onicecandidate : onIceCandidate,
		configuration: iceservers,
		onerror : onError
	}
	webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
		function(error) {
			if (error) {
				alert('没有发现设备，确认关闭窗口! ');
				var response = {
					id : 'incomingCallErrorResponse',
					from : param.userId,
					to : param.sendId,
					errorResponse : 'NoDevice'
				};
				sendMessage(response);
				setTimeout(function () {
					window.close();
				},4000);

			}
			webRtcPeer.generateOffer(onOfferIncomingCall);
		});
}

/**
 *
 * @param error
 * @param offerSdp
 */
function onOfferIncomingCall(error, offerSdp) {
	/*console.log("8、onOfferIncomingCall loading………… --------->");*/
	if (error)
		return console.error("Error generenerating the offer");
	var response = {
		id : 'incomingCallResponse',
		from : from,
		callResponse : 'accept',
		sdpOffer : offerSdp
	};
	sendMessage(response);
	/*console.log("9、onOfferIncomingCall complete………… --------->");*/
}

function register(userId) {
	if (userId == '') {
		window.alert('You must insert your user name');
		return;
	}
	setRegisterState(REGISTERING);
	var message = {
		id : 'register',
		name : userId
	};
	sendMessage(message);
	/*console.log("1、registering lodaing………… --------- > ",userId)*/
}

function call() {
	/*console.log("3、call loading………… --------->",param.userId);*/
	showSpinner(videoInput, videoOutput);
	var options = {
		localVideo : videoInput,
		remoteVideo : videoOutput,
		//mediaConstraints : getConstraints(),
		onicecandidate : onIceCandidate,
		configuration: iceservers,
		onerror : onError

	}
	//KMS生成一个SDP offer，此Offer返回给KMS客户端（应用服务器），再被转发给浏览器
	// 创建一个连接。注意，在双方都需要创建连接，创建的时机，就是服务器确认了两者要进行通信之后
	webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
			function(error) {
				if (error) {
					return  console.error(error);
				}
				// 生成本地的SDP Offer
				webRtcPeer.generateOffer(onOfferCall);
			});
}

function onOfferCall(error, offerSdp) {
	if (error)
		return console.error('Error generating the offer');
/*	console.log('Invoking SDP offer callback function');*/

	var message = {
		id : 'call',
		from : param.userId, // document.getElementById('name').value, caller, //
		to : param.sendId, //document.getElementById('peer').value, callee ,//
		//userId: param.userId,
		sdpOffer : offerSdp
	};
	sendMessage(message);
	/*console.log("4、onOfferCall offerSdp ………… --------- >");*/
}

function incomingCallError() {
	alert("对方没有视频设备!");
/*	stop(true);*/
	window.close();
}

function leave(message) {
	setCallState(NO_CALL);
	if (webRtcPeer) {
		webRtcPeer.dispose();
		webRtcPeer = null;

		if (!message) {
			var message = {
				id : 'stop'
			}
			sendMessage(message);
		}
	}
	hideSpinner(videoInput, videoOutput);
		
	setTimeout(function () {
		window.close();
	},2000);
	
}

function onError() {
	console.log("onError loading………… --------- >");
	setCallState(NO_CALL);
}

function onIceCandidate(candidate) {
	/*console.log("5、onIceCandidate loading………… --------- >" + JSON.stringify(candidate));*/

	var message = {
		id : 'onIceCandidate',
		candidate : candidate
	};
	// 把本地candidate发送给Peer，基于Trickle ICE，也就是说，一旦发现一个候选，就立即发送
	// 不等待所有候选收集成功，这样效率更高。此回调可能被调用多次
	sendMessage(message);
	/*console.log("6、onIceCandidate loading………… --------- >" + JSON.stringify(candidate));*/
}

/**
 * 注意：发送消息时，必须要延时发送，延时时候需要根据现场环境配置一下
 * @param message
 */
/*function sendMessage(message) {
	setTimeout(function () {
		if (ws.readyState===1) {
			ws.send(JSON.stringify(message));
		}else{
			//alert("连接已经断开!!!")
			console.log("连接已经断开!!!")
			window.location.href = window.location.href;
			//window.close();
		}
	}, 5000);
}*/
function sendMessage(message) {
	//如果退出成功 不在发送消息
	var jsonMessage = JSON.stringify(message);
	console.log('Sending message: ' + jsonMessage);
	console.log('ws.readyState= : ' + ws.readyState);
	ws.send(jsonMessage);
//try {
//	setTimeout(function () {
//		if (ws.readyState===1) {
//			ws.send(jsonMessage);
//		}else{
//			console.log("连接已经断开!!!")
//			window.location.href = window.location.href;
//		}
//	}, 500);
//} catch(err) {
//	console.log(err);
//	if(err.toString().indexOf("CLOSED")!==-1){//1秒后重连
//		window.setTimeout(function (){sendMessage()},1000);
//	}
//}

}

function showSpinner() {
	debugger
	for (var i = 0; i < arguments.length; i++) {
		if(arguments[i].id === 'videoInput'){
			arguments[i].poster = './img/transparent-1px.png';
			arguments[i].style.background = 'center transparent url("./img/loading.gif") no-repeat';
			arguments[i].style.backgroundSize = '40px'
		}else{
			arguments[i].poster = './img/transparent-1px.png';
			arguments[i].style.background = 'center transparent url("./img/loading.gif") no-repeat';
			arguments[i].style.backgroundSize = '80px'
		}

	}
}

function hideSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].src = '';
		arguments[i].poster = './img/BG.png';
		arguments[i].style.background = '';
	}
}

function disableButton(id) {
	$(id).attr('disabled', true);
	$(id).removeAttr('onclick');
}

function enableButton(id, functionName) {
	$(id).attr('disabled', false);
	$(id).attr('onclick', functionName);
}

//静音功能
function excuteAudioStream() {
	var trackArray = [];
	trackArray = webRtcPeer.getLocalStream().getAudioTracks();
	trackArray.forEach((track) => {
		if (track.kind === 'audio' && track.enabled) {
			$('#videoOnly').text("解除静音");
			track.enabled = false;
		}else if (track.kind === 'audio' && !track.enabled) {
			$('#videoOnly').text("静音");
			track.enabled = true;
		}
	});
}
//关闭视频画面，语音功能
function excuteVideoStream() {
	var trackArray = [];
	trackArray = webRtcPeer.getLocalStream().getVideoTracks();
	trackArray.forEach((track) => {
		if (track.kind === 'video' && track.enabled) {
			$('#audioOnly').text("开启画面");
			track.enabled = false;
			//然后生成一个div 进行遮罩
			divUtil.createDiv("videoSmall","videoMask");


		}else if (track.kind === 'video' && !track.enabled) {
			$('#audioOnly').text("关闭画面");
			track.enabled = true;
			divUtil.delDiv("videoSmall");
		}
	});
}

function setCallState(nextState) {
	switch (nextState) {
	case NO_CALL:
		enableButton('#call', 'call()');
		disableButton('#terminate');
		disableButton('#play');
		break;
	case PROCESSING_CALL:
		disableButton('#call');
		disableButton('#terminate');
		disableButton('#play');
		break;
	case IN_CALL:
		disableButton('#call');
		enableButton('#terminate', 'stop()');
		disableButton('#play');
		break;
	default:
		return;
	}
	callState = nextState;
}
function setRegisterState(nextState) {
	switch (nextState) {
	case NOT_REGISTERED:
		enableButton('#register', 'register()');
		setCallState(NO_CALL);
		break;
	case REGISTERING:
		disableButton('#register');
		break;
	case REGISTERED:
		disableButton('#register');
		setCallState(NO_CALL);
		break;
	default:
		return;
	}
	registerState = nextState;
}
/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
	event.preventDefault();
	$(this).ekkoLightbox();
});
