
var ws = new WebSocket('wss://' + location.host + '/groupcall');
var participants = {};
/*用户ID */
var name;
/* 用户名称 */
var personName;
var param = {};
var audioFlag = true;
window.onload = function() {

	// 获取页面参数
	getUrlParemeter();
	name = param.userId;
	personName = param.userName;
	//页面加载完毕之后直接获取用户房间进行注册,绑定房间
	register(name,personName,param.groupId,param.groupName);
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
	sendMessage({
		id : 'leaveRoom'
		//userId: $('.participant.main').getAttribute('id')
	});
	ws.close();
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

function register(name,personName,room,groupName) {
	/*name = document.getElementById('name').value;
	var room = document.getElementById('roomName').value;*/

	document.getElementById('room-header').innerText = groupName;// 'ROOM ' + room;
	document.getElementById('join').style.display = 'none';
	document.getElementById('room').style.display = 'block';

	var message = {
		id : 'joinRoom',
		name : name,
		personName : personName,
		room : room,
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
			 	maxWidth : 320,
				 maxHeight : 240,
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
	window.close();
}
//静音功能
function silentMode() {
	if(audioFlag){
		audioFlag = false;
	}else{
		audioFlag = true;
	}
}
//关闭视频功能
function closeVideo() {
	if(audioFlag){
		audioFlag = false;
	}else{
		audioFlag = true;
	}
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
		audio : true,
		video : {
			width:640,
			height:480,
			framerate : 15
		}
	};
	var options = {
      remoteVideo: video,
		mediaConstraints: constraints,
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
			"height":"auto",

		})
	}else if(len<=2){
		$("#participants .participant").css({
			"width":"100%"
			// "height":"100%"

		})
		$("#participants .participant.main").css({
			"width":"20%",
			"height":"20%",
			"position":"absolute",
			"right":"10px",
			"top":"10px",
			"zIndex":"10"
		})
	}else if(len<=4 && len>2){
		$("#participants .participant").css({
			"width":"calc(50% - 16px)",
			"height":"auto",
			"marginRight":"16px",
			"marginBottom":"16px"
		})
		$("#participants .participant.main").css({
			"position":"sticky",
		})
	}else if(len<=6 && len>4){
		$("#participants .participant").css({
			"width":"calc(33.3333% - 16px)",
			// "height":"calc(50% - 16px)",
			"marginRight":"16px",
			"marginBottom":"16px"

		})
		$("#participants .participant.main").css({
			"position":"sticky",
		})
	}else if(len<=9 && len>6){
		$("#participants .participant").css({
			"width":"calc(33.3333% - 16px)",
			// "height":"calc(33.3333% - 16px)",
			"marginRight":"16px",
			"marginBottom":"16px"
		})
		$("#participants .participant.main").css({
			"position":"sticky",
		})
	}

}

function sendMessage(message) {
	//var jsonMessage = JSON.stringify(message);
	console.log('Sending message: ' + message);
	console.log('Sending message: ' + ws.readyState);
	setTimeout(function () {
		if (ws.readyState===1) {
			ws.send(JSON.stringify(message));
		}else{
			alert("连接已经断开!!!")
			window.close();
		}
	}, 5000);
}
