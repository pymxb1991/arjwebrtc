
//var ws = new WebSocket('wss://' + location.host + '/groupcall');
 var ws ;//=  new WebSocket('wss://' + location.host + '/call');
 if(location.host.startsWith("local")
 	|| location.host.startsWith("127")
 	|| location.host.startsWith("10")){
 	ws = new WebSocket('wss://' + location.host + '/groupcall')
 }else if(location.host.startsWith("153")){
 	ws = new WebSocket('wss://153.0.171.158:9091/groupcall')
 }
var participants = {};
var iceservers={
	"iceServers":[
		{
			urls:"stun:153.0.171.158:3478"
			//urls:"stun:47.94.247.75:3478"
		},
		{
			urls:["turn:153.0.171.158:3478"],
			//urls:["turn:47.94.247.75:3478"],
			username:"mytest",
			credential: "123456"
		}
	]
}
/*用户ID */
var name;
/* 用户名称 */
var personName;
var param = {};
var audioFlag = true;
var videoFlag = true;
window.onload = function() {

	// 获取页面参数
	getUrlParemeter();
	name = param.userId;
	personName = param.userName;
	//页面加载完毕之后直接获取用户房间进行注册,绑定房间
			
	setTimeout(function () {		
		register(name,personName,param.groupId,param.groupName);
	},2000);
}
/**
 * 获取地址参数
 */
function getUrlParemeter() {
	var url = decodeURI(location.search);
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
window.onbeforeunload = function() {
	leaveRoom();
	//ws.close();
};


ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);

	switch (parsedMessage.id) {
	case 'existingParticipants':////现参与者回调
		onExistingParticipants(parsedMessage);
		break;
	case 'newParticipantArrived': //新人加入
		onNewParticipant(parsedMessage);
		break;
	case 'participantLeft':
		onParticipantLeft(parsedMessage);
		break;
	case 'receiveVideoAnswer':
		receiveVideoResponse(parsedMessage);
		break;
		case 'iceCandidate':
		//parsedMessage: {id: "receiveVideoAnswer", name: "admin", sdpAnswer: ""}
		//participants: {admin: Participant}  Participant是一个窗体对象
		//participants[admin] = Participant
		participants[parsedMessage.name].rtcPeer.addIceCandidate(parsedMessage.candidate, function (error) {
	        if (error) {
		      console.error("Error adding candidate: " + error);
		      return;
	        }
	    });
	    break;
	default:
		console.error('Unrecognized message', parsedMessage);
	}
}
ws.close = function(){
	/*console.log("ws.close")*/
	console.log("关闭重进房间");
//	ws =  new WebSocket('wss://' + location.host + '/groupcall');
	//register(param.userId,param.userName,param.groupId,param.groupName);

}

function register(name,personName,room,groupName) {
	/*name = document.getElementById('name').value;
	var room = document.getElementById('roomName').value;*/

	document.getElementById('room-header').innerText = param.groupName;// 'ROOM ' + room;
	document.getElementById('join').style.display = 'none';
	document.getElementById('room').style.display = 'block';

	   /*
		*     
		*   0        CONNECTING        连接尚未建立
		    1        OPEN            WebSocket的链接已经建立
		    2        CLOSING            连接正在关闭
		    3        CLOSED            连接已经关闭或不可用
		* */
	console.log("readyState:"+ws.readyState);
	if (ws.readyState != 1) {
		setTimeout(register, 3000);
		return;
	}

	var message = {
		id : 'joinRoom',
		name : param.userId,
		personName : param.userName,
		room : param.groupId
	}
	sendMessage(message);
}

function onNewParticipant(request) {
	console.log("onNewParticipant ---->>>> receiveVideo(request.name);");
	console.log("onNewParticipant ---->>>> receiveVideo(request.name);",request.personName);
	receiveVideo(request.name,request.personName);
}

function receiveVideoResponse(result) {
	// result： {id: "receiveVideoAnswer", name: "admin", sdpAnswer: ""}
	//participants: {admin: Participant}  Participant是一个窗体对象
	//participants[admin] = Participant
	participants[result.name].rtcPeer.processAnswer (result.sdpAnswer, function (error) {
		if (error) return console.error (error);
	});
}

function callResponse(message) {
	if (message.response != 'accepted') {
		console.info('Call not accepted by peer. Closing call');
		stop();
	} else {
		webRtcPeer.processAnswer(message.sdpAnswer, function (error) {
			if (error) return console.error (error);
		});
	}
}

/**
 * 建立本地视频窗体
 * @param msg
 */
function onExistingParticipants(msg) {
	// getUserMedia约束条件
	var constraints = {
		audio : true,
		video : {
			 mandatory : {
			 	maxWidth : 640,
				maxHeight : 480,
			 	maxFrameRate : 15,
			 	minFrameRate : 15
			 },
			// width:640,
			// height:480,
			//framerate : 15
		}
	};
	console.log(name + " registered in room " + room);
	var participant = new Participant(name,personName);//窗体对象元素创建

	participants[name] = participant;//窗体对象赋值给当前用户
	var video = participant.getVideoElement();

	var options = {
	      localVideo: video,
	      mediaConstraints: constraints,
		  configuration: iceservers,
	      onicecandidate: participant.onIceCandidate.bind(participant)
	    }
	// 仅仅需要发送数据，不需要接收
	participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
		function (error) {
		  if(error) {
			  return console.error(error);
		  }
		  this.generateOffer (participant.offerToReceiveVideo.bind(participant));
	});
   //participantsArray 除当前用户外的所有人
	msg.data.forEach(item=>{
		receiveVideo(item.name,item.personName);
	});
}

function leaveRoom() {
	sendMessage({
		id : 'leaveRoom'
	});

	for ( var key in participants) {
		participants[key].dispose();
	}
	ws.close();
		
	setTimeout(function () {
		window.close();
	},2000);
}
/**
 * 建立远程视频元素来展示流
 * @param sender
 */
function receiveVideo(sender,senderName) {
	console.log("receiveVideo ---->>>>   ;");
	var participant = new Participant(sender,senderName);
	participants[sender] = participant;
	var video = participant.getVideoElement();
	var constraints = {
		audio: true,
		video: {
			frameRate: {
				min: 1, ideal: 15, max: 30
			},
			width: {
				min: 32, ideal: 50, max: 640
			},
			height: {
				min: 32, ideal: 50, max: 480
			}
		}
	};
	var options = {
      remoteVideo: video,
	  mediaConstraints: constraints,
	  configuration: iceservers,
      onicecandidate: participant.onIceCandidate.bind(participant)
    }

	participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
			function (error) {
			  if(error) {
				  return console.error(error);
			  }
			  this.generateOffer (participant.offerToReceiveVideo.bind(participant));
	});
}

function onParticipantLeft(request) {
	console.log('Participant ' + request.name + ' left');
	var participant = participants[request.name];
	participant.dispose();
	delete participants[request.name];
	var len = $("#participants .participant").length
	console.log(len)
	if(len<=1){
		$("#participants .participant.main").css({
			"width":"100%",
			"height":"100%"
		})
		$(".participant span").css({
			"line-height": "180px",
		})
	}else if(len<=2 && len>1 ){
		$("#participants .participant").css({
			"width":"100%",
			"height":"100%"

		})
		$(".participant span").css({
			"line-height": "180px",
		})
		$("#participants .participant.main").css({
			"width":"20%",
			"height":"20%",
			"position":"absolute",
			"right":"10px",
			"top":"10px",
			"zIndex":"10"
		})
		$(".participant.main span").css({
			"line-height": "50px",
		})
	}else if(len<=4 && len>2){
		$("#participants .participant").css({
			"width":"calc(50% - 16px)",
			"height":"calc(50% - 16px)",
			"marginRight":"16px",
			"marginBottom":"16px"
		})
		$("#participants .participant.main").css({
			"position":"sticky",
		})
	}else if(len<=6 && len>4){
		$("#participants .participant").css({
			"width":"calc(33.3333% - 16px)",
			"height":"calc(50% - 16px)",
			"marginRight":"16px",
			"marginBottom":"16px"

		})
		$("#participants .participant.main").css({
			"position":"sticky",
		})
	}else if(len<=9 && len>6){
		$("#participants .participant").css({
			"width":"calc(33.3333% - 16px)",
			"height":"calc(33.3333% - 16px)",
			"marginRight":"16px",
			"marginBottom":"16px"
		})
		$("#participants .participant.main").css({
			"position":"sticky",
		})
	}

}

function sendMessage(message) {
	//如果退出成功 不在发送消息
	var jsonMessage = JSON.stringify(message);
	console.log('Sending message: ' + jsonMessage);
	console.log('Sending message: ' + ws.readyState);
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

//静音功能
function excuteAudioStream() {
	var participant = participants[name];//获取当前用户窗体对象
	var video = participant.getVideoElement();
	var trackArray = [];
	trackArray = participant.rtcPeer.getLocalStream().getAudioTracks();
	trackArray.forEach((track) => {
		if (track.kind === 'audio' && track.enabled) {
			$('#videoOnly').text("开启声音");
			track.enabled = false;
		}else if (track.kind === 'audio' && !track.enabled) {
			$('#videoOnly').text("关闭声音");
			track.enabled = true;
		}
	});
}
//关闭视频画面，语音功能
function excuteVideoStream() {
	var participant = participants[name];//获取当前用户窗体对象
	var video = participant.getVideoElement();
	var trackArray = [];
	trackArray = participant.rtcPeer.getLocalStream().getVideoTracks();
	trackArray.forEach((track) => {
		if (track.kind === 'video' && track.enabled) {
			$('#audioOnly').text("开启画面");
			track.enabled = false;
		}else if (track.kind === 'video' && !track.enabled) {
			$('#audioOnly').text("关闭画面");
			track.enabled = true;
		}
	});
}