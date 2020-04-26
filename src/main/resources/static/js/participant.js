/*
 * (C) Copyright 2014 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const PARTICIPANT_MAIN_CLASS = 'participant main';
const PARTICIPANT_CLASS = 'participant';

/**
 * 为新加入的成员创建一个视频元素
 *
 * @param {String} name - the name of the new participant, to be used as tag
 *                        name of the video element.
 *                        The tag of the new element will be 'video<name>'
 * @return
 */
function Participant(name,personName) {
	console.log("Participant ---->>>>   创建一个视频元素");

	this.name = name;
	var container = document.createElement('div'); //<div></div>
	container.className = isPresentMainParticipant() ? PARTICIPANT_CLASS : PARTICIPANT_MAIN_CLASS; //<div class="participant main"></div>
	container.id = name;
	var span = document.createElement('span');
	var video = document.createElement('video');
	var rtcPeer;

	container.appendChild(video);
	container.appendChild(span);

	container.onclick = switchContainerClass;
	document.getElementById('participants').appendChild(container);

	span.appendChild(document.createTextNode(personName));

	video.id = 'video-' + name;
	video.autoplay = true;
	video.controls = false;

	/**
	 <div class="participant main" id="maoxb">
		 <video id="video-maoxb" autoplay=""></video>
		 <span>maoxb</span>
	 </div>
	 */

	var len = $("#participants .participant").length
	console.log(len)
	if(len<=1){
		$("#participants .participant.main").css({
			"width":"100%"
			// "height":"20%",

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



	this.getElement = function() {
		return container;
	}

	this.getVideoElement = function() {
		return video;
	}

	/**
	 * 切换容器Container 的class 样式；
	 */
	function switchContainerClass() {
		console.log("switchContainerClass ---->>>>   遍历所有元素，设置class ");
		//container.className 当前所选container 中的Div
		if (container.className === PARTICIPANT_CLASS) {
			var elements = Array.prototype.slice.call(document.getElementsByClassName(PARTICIPANT_MAIN_CLASS));
			elements.forEach(function(item) {
					item.className = PARTICIPANT_CLASS;
				});

				container.className = PARTICIPANT_MAIN_CLASS;
			} else {
			container.className = PARTICIPANT_CLASS;
		}
	}

	/**
	 * 是否有主窗口元素，是则返回true
	 * @returns {boolean}
	 */
	function isPresentMainParticipant() {
		console.log("isPresentMainParticipant ---->>>>   返回Class??? ");
		return ((document.getElementsByClassName(PARTICIPANT_MAIN_CLASS)).length != 0);
	}

	this.offerToReceiveVideo = function(error, offerSdp, wp){
		if (error) return console.error ("sdp offer error")
		console.log('offerToReceiveVideo ---------》  Invoking SDP offer callback function');
		var msg =  { id : "receiveVideoFrom",
				sender : name,
				sdpOffer : offerSdp
			};
		sendMessage(msg);
	}


	this.onIceCandidate = function (candidate, wp) {
		  console.log("onIceCandidate -->  Local candidate" + JSON.stringify(candidate));

		  var message = {
		    id: 'onIceCandidate',
		    candidate: candidate,
		    name: name
		  };
		  sendMessage(message);
	}

	Object.defineProperty(this, 'rtcPeer', { writable: true});

	this.dispose = function() {
		console.log('Disposing participant ' + this.name);
		this.rtcPeer.dispose();
		container.parentNode.removeChild(container);
	};
}
