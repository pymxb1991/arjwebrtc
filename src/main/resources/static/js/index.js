
var ws =  new WebSocket('wss://' + location.host + '/call');
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
var callState = null;
const NO_CALL = 0;
const PROCESSING_CALL = 1;
const IN_CALL = 2;
var caller ;//呼叫者
var callee ;// 被呼叫者

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

window.onload = function() {

	// 获取页面参数
	getUrlParemeter();

	console = new Console();
	/*setRegisterState(NOT_REGISTERED);*/
	var drag = new Draggabilly(document.getElementById('videoSmall'));
	videoInput = document.getElementById('videoInput');
	videoOutput = document.getElementById('videoOutput');
	//document.getElementById('name').focus();

	//页面加载完毕之后直接获取用户进行注册,注册过后进行拨号

	if("caller" == param.callType){
		register(param.userId);
	}else{
		register(param.sendId);
	}

}

window.onbeforeunload = function() {
	ws.close();
}

//当收到来自服务器的消息时被调用的
//// 响应onmessage事件:
var responseMsg ;
ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);
	responseMsg = parsedMessage.id;
	console.log("iceCandidate-------------->: ",responseMsg);
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
		console.info('Communication ended by remote peer');
		stop(true);
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
//添加状态判断，当为OPEN时，发送消息

ws.close = function(){
	console.log("ws.close")
	ws =  new WebSocket('wss://' + location.host + '/call');
}
ws.error = function () {
	console.log("ws.error")
	ws =  new WebSocket('wss://' + location.host + '/call');
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
		console.log("2、register complete Response………… --------- > ",message.userId);
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
		console.info('Call not accepted by peer. Closing call');
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
	console.log("10、startCommunication loading………… --------->");
	setCallState(IN_CALL);
	webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
		if (error)
			return console.error(error);
	});
	console.log("11、startCommunication complete………… --------->");
}

function incomingCall(message) {
	console.log("7、incomingCall loading………… --------->",message.to);
	/*if (callState != NO_CALL) {
		console.log("7.1、incomingCall loading………… --------->",message.to);
		var response = {
			id : 'incomingCallResponse',
			from : message.from,
			callResponse : 'reject',
			message : 'bussy'
		};
		return sendMessage(response);
	}*/
	console.log("7...1、incomingCall loading………… --------->",message.to);
	//setCallState(PROCESSING_CALL);
	/*if (confirm('User ' + message.from
		+ ' is calling you. Do you accept the call?')) {*/
		showSpinner(videoInput, videoOutput);
		console.log("7...2、incomingCall loading………… --------->",message.to);
		from = message.from;
		var options = {
			localVideo : videoInput,
			remoteVideo : videoOutput,
			onicecandidate : onIceCandidate,
			onerror : onError
		}
		debugger
		console.log("7...3、incomingCall loading………… --------->",message.to);
		webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
			function(error) {
				if (error) {
					console.log("7...4、webRtcPeer error loading………… --------->",message.to);
					return console.error(error);
				}
				debugger
				console.log("7...5、webRtcPeer error loading………… --------->",message.to);
				webRtcPeer.generateOffer(onOfferIncomingCall);
			});

	/*} else {
		console.log("7.5、incomingCall loading………… --------->",message.to);
		var response = {
			id : 'incomingCallResponse',
			from : message.from,
			callResponse : 'reject',
			message : 'user declined'
		};
		sendMessage(response);
		stop();
	}*/
	console.log("7....6 incomingCall loading………… --------->",message.to);
}

/**
 *
 * @param error
 * @param offerSdp
 */
function onOfferIncomingCall(error, offerSdp) {
	console.log("8、onOfferIncomingCall loading………… --------->");
	if (error)
		return console.error("Error generenerating the offer");
	var response = {
		id : 'incomingCallResponse',
		from : from,
		callResponse : 'accept',
		sdpOffer : offerSdp
	};
	sendMessage(response);
	console.log("9、onOfferIncomingCall complete………… --------->");
}

function register(userId) {
	//param.callInfo = 'incomingCall'; //标识用户call 过;
	debugger
	//var name = userId ;// document.getElementById('name').value;
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
	console.log("1、registering lodaing………… --------- > ",userId)
}

function call() {
	console.log("3、call loading………… --------->",param.userId);

	//setCallState(PROCESSING_CALL);
	showSpinner(videoInput, videoOutput);

	var options = {
		localVideo : videoInput,
		remoteVideo : videoOutput,
		//mediaConstraints : getConstraints(),
		onicecandidate : onIceCandidate,
		onerror : onError
	}
	//KMS生成一个SDP offer，此Offer返回给KMS客户端（应用服务器），再被转发给浏览器
	// 创建一个连接。注意，在双方都需要创建连接，创建的时机，就是服务器确认了两者要进行通信之后
	webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
			function(error) {
				if (error) {
					return console.error(error);
				}
				// 生成本地的SDP Offer
				webRtcPeer.generateOffer(onOfferCall);
			});
}

function onOfferCall(error, offerSdp) {
	if (error)
		return console.error('Error generating the offer');
	console.log('Invoking SDP offer callback function');

	var message = {
		id : 'call',
		from : param.userId, // document.getElementById('name').value, caller, //
		to : param.sendId, //document.getElementById('peer').value, callee ,//
		//userId: param.userId,
		sdpOffer : offerSdp
	};
	sendMessage(message);
	console.log("4、onOfferCall offerSdp ………… --------- >");
}

function stop(message) {
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
}

function onError() {
	console.log("onError loading………… --------- >");
	setCallState(NO_CALL);
}

function onIceCandidate(candidate) {
	console.log("5、onIceCandidate loading………… --------- >" + JSON.stringify(candidate));

	var message = {
		id : 'onIceCandidate',
		candidate : candidate
	};
	// 把本地candidate发送给Peer，基于Trickle ICE，也就是说，一旦发现一个候选，就立即发送
	// 不等待所有候选收集成功，这样效率更高。此回调可能被调用多次
	sendMessage(message);
	console.log("6、onIceCandidate loading………… --------- >" + JSON.stringify(candidate));
}

/**
 * 注意：发送消息时，必须要延时发送，延时时候需要根据现场环境配置一下
 * @param message
 */
function sendMessage(message) {
	setTimeout(function () {
		if (ws.readyState===1) {
			ws.send(JSON.stringify(message));
		}else{
			alert("websocket connect error !!!")
		}
	}, 4000);
}

function showSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].poster = './img/transparent-1px.png';
		arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
	}
}

function hideSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].src = '';
		arguments[i].poster = './img/webrtc.png';
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

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
	event.preventDefault();
	$(this).ekkoLightbox();
});