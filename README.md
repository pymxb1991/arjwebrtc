# arjwebrtc
# 视频一对一请求逻辑

### 一、 弹出页面之后进行注册用户（弃用）
  1. A 用户发起
  2. B 用户收到请求，然后弹出页面，提示：A用户在请求发起视频，B是否同意；
  3. B 用户同意，则进行弹出页面 
  4. B 用户进行注册，注册成功返回回调
  5. A 用户收到B 用户的 回调，然后弹出页面
  6. A 用户进行注册，
  7. A 用户注册成功，收到回调之后直接发起call 呼叫视频
  B. B 用户响应视频,执行 incommingcall 进行视频
### 二、 弹出页面之后进行注册用户（使用中……）
  1. A 用户发起
  2. B 用户收到请求，然后弹出页面，提示：A用户在请求发起视频，B是否同意；  
  3. B 用户同意，则进行弹出页面 ，同时进行注册，返回回调信息；  
  4. B 接受视频呼叫的同时给A 用户发消息，告知B 用户已经同意视频连接
  5. A 用户收到B 用户的 回调，然后弹出页面
  6. A 弹出页面之后，A用户进行注册，
  7. A 用户注册成功，收到回调之后直接发起call 呼叫视频
  B. B 用户响应视频,执行 incommingcall 进行视频
### 目前业务逻辑修改
  
  问题：
  1. wss 协议，高级设置允许问题；
     * 已经解决，
     * 问题原因：  
        ``
        由于服务端同时连接IM Netty服务  Kurento websocket 服务，为了支持wss协议，所以
             配置了Netty 服务支持wss服务，目前使用上述二方案之后，完全可以避免此现象发生；
        ``
        
  2. 发起视频，点击确认弹窗口问题；
     
  3. 视频过程中，websocket 发送消息 延时发送时间问题
     * 需要根据现场环境配置时间
     * 问题原因：  
         ``由于本地网络问题导致，现场部署需要测试，关注延时时间，如果websocket 一直连接不上，
      可以调整时间长一些``
  4. 发起视频，没有任何反应，需要有一个提示： 正在呼叫中…… 提示
     解决方案：增加消息提示
  5. 接收方如果没有视频，程序会异常，发送方的视频也会看不到；
     * 已经解决
     * 增加异常逻辑  
     ``  1. 当被呼叫方没有视频时，给发起方提示：“对方没有视频”，并且也提示自己：“没有发现设备，确认关闭窗口”
     ``
     
# 视频Group-All请求逻辑分析
### register() 
1、创建房间入口
2、创建用户实例入口 ：用户实例--pipeline实例--房间实例" 就串起来
3、sendParticipantNames在加入成功后，给房间里的其它人发通知
   sendParticipantNames后，会给js发送各种消息，
   existingParticipants(其它人加入)、
   newParticipantArrived(新人加入) 这二类消息，就会触发generateOffer，开始向服务端发送SDP
4、SDP交换的入口 conferenceroom.js 中有一段监听websocke
   ws.onmessage = function (message) {}
5、服务端回应各种websocket消息
   handleTextMessage();
   其中user.receiveVideoFrom方法，就会回应SDP
   SDP和ICE信息交换完成，就开始视频通讯了
6、
7、
   
1. 创建房间入口 ``register()``
   ```javascript 1.5
      var message = {
          id : 'joinRoom',
          name : name,
          room : room,
      } 
   sendMessage(message);
   ```
2. 后端核心处理器执行 
    - 1、 ``joinRoom()``   获取房间，然后加入 
       ``` 
          Room room = roomManager.getRoom(roomName);
          final UserSession user = room.join(name, session);
       ```
     
    - 2、  ``getRoom()``   如果获取不到房间，则创建房间
       ```
        private final ConcurrentMap<String, Room> rooms = new ConcurrentHashMap<>();
             if (room == null) {
               每个房间实例创建时，都绑定了一个对应的MediaPipeline（用于隔离不同房间的媒体信息等）
               room = new Room(roomName, kurento.createMediaPipeline());
               rooms.put(roomName, room);
             }
       ```
    - 2.1、 ``Room(roomName, kurento.createMediaPipeline())`` 
        初始化房间，媒体管道 ;
        ``` 
            this.name = roomName;
            this.pipeline = pipeline;
        ```
    
    - 3、``join()``   用户加入房间
        ```
            final UserSession participant = new UserSession(userName, this.name, session, this.pipeline);
            joinRoom(participant);
            participants.put(participant.getName(), participant);
            sendParticipantNames(participant); 
        ```
    - 3.1、初始化： 用户实例--pipeline实例--房间实例  进行关联    
        ``final UserSession participant = new UserSession(userName, this.name, session, this.pipeline);``   
        ``` 
           this.pipeline = pipeline;
           this.name = name;
           this.session = session;
           this.roomName = roomName;
           //，把房间实例的pipeline做为入参传进来，然后上行传输的WebRtcEndPoint实例outgoingMedia又跟pipeline绑定
           //WebRtc端点跟媒体管道绑定
           this.outgoingMedia = new WebRtcEndpoint.Builder(pipeline).build();
           //绑定到当前用户中的其它WebRtc 端点
           final ConcurrentMap<String, WebRtcEndpoint> incomingMedia = new ConcurrentHashMap<>();
           //监听ICE 事件
           this.outgoingMedia.addIceCandidateFoundListener(new EventListener<IceCandidateFoundEvent>() {}
           《iceCandidate回调》: session.sendMessage --》 iceCandidate
        ``` 
    - 3.2、  加入房间并 通知其他在房间中的用户，通知他们有新的参与者   
         `joinRoom(participant);`
        ```
            final JsonObject newParticipantMsg = new JsonObject();
            newParticipantMsg.addProperty("id", "newParticipantArrived"); //新人加入消息
            newParticipantMsg.addProperty("name", newParticipant.getName());
           
            final List<String> participantsList = new ArrayList<>(participants.values().size());   
            for (final UserSession participant : participants.values()) {
                participant.sendMessage(newParticipantMsg); //在发起人页面初始化Video窗体
            }
             participantsList.add(participant.getName());
            《用户joinRoom回调》: session.sendMessage --》newParticipantArrived
        ```
    - 4、将当前用户加入到`全局`参与者用户列表中；
        `participants.put(participant.getName(), participant);`
    - 5、在加入成功后，给当前用户发送房间里的其它人消息 
        ``sendParticipantNames(UserSession user)``
        ```
           final JsonArray participantsArray = new JsonArray();
           for (final UserSession participant : this.getParticipants()) {
             if (!participant.equals(user)) {
               final JsonElement participantName = new JsonPrimitive(participant.getName());
               participantsArray.add(participantName);
             }
           }
       
           final JsonObject existingParticipantsMsg = new JsonObject();
           existingParticipantsMsg.addProperty("id", "existingParticipants");//其他人参与者
           existingParticipantsMsg.add("data", participantsArray);
           user.sendMessage(existingParticipantsMsg);     
          《用户sendParticipantNames回调》: session.sendMessage --》existingParticipants
        ```
    - 6、 最后进行注册（用户加入全局缓存中）
          `registry.register(user);`
        ```
           usersByName.put(user.getName(), user);
           usersBySessionId.put(user.getSession().getId(), user);
        ```

3. 前端 `Js websocket` 回调
  -  1、 响应回调
     -  1.1、 当前用户的回调  构造本地视频元素来输出视频流
        ``existingParticipants``
         ```javascript 1.5
             // getUserMedia约束条件
               var constraints = { //约束
                    audio : true,
                    video : { mandatory : {maxWidth : 320,maxFrameRate : 15,minFrameRate : 15} }
                };
                var participant = new Participant(name);//窗体对象元素创建
                participants[name] = participant;//窗体对象赋值给当用用户
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
                      //生成SDP 请求应答
                      this.generateOffer (participant.offerToReceiveVideo.bind(participant));
                });
              
                msg.data.forEach(receiveVideo);
         ```
     -  1.2、 SDP 响应回调
            ``receiveVideoAnswer``
           ``` javascript 1.5
                function receiveVideoResponse(result) {
                // result： {id: "receiveVideoAnswer", name: "admin", sdpAnswer: ""}
                //participants: {admin: Participant}  Participant是一个窗体对象
                //participants[admin] = Participant
                participants[result.name].rtcPeer.processAnswer (result.sdpAnswer, function (error) {
                    if (error) return console.error (error);
                });
           ```
     -  1.3、  ICE 回调,添加候选
            ``iceCandidate``   
           ```
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
           ```
     
  -  2、当有用户再次加入一个房间时；后端调用 `joinRoom`,给房间所有已经存在的人发消息，发完消息之后页面监听事件立马响应，执行操作，加入新人
     -  2.1、 新参与者加入
        ``newParticipantArrived`` 响应
        ```javascript 1.5
            function onNewParticipant(request) {
             receiveVideo(request.name);
            }
        ```          
     -  2.2、构造远程视频元素来输出视频流
         `receiveVideo(request.name);`
         ```javascript 1.5
             var participant = new Participant(sender);
             participants[sender] = participant;
             var video = participant.getVideoElement();
     
             var options = {
                remoteVideo: video,
                onicecandidate: participant.onIceCandidate.bind(participant)
              }
             //// 仅仅需要接收数据，不需要发送
             participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
                     function (error) {
                       if(error) {
                           return console.error(error);
                       }
                       this.generateOffer (participant.offerToReceiveVideo.bind(participant));
             });
         ```
     -  2.3、为新加入的成员创建一个视频对象窗体 
         ``Participant(name)`` 
         -  2.3.1、 窗体构建 
             ```javascript 1.5
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
                    span.appendChild(document.createTextNode(name));
                
                    video.id = 'video-' + name;
                    video.autoplay = true;
                    video.controls = false;
                    /**
                     <div class="participant main" id="maoxb">
                         <video id="video-maoxb" autoplay=""></video>
                         <span>maoxb</span>
                     </div>
                     */
             ```
         -  2.3.2、 窗体元素引用赋值 
             ```javascript 1.5
                this.getElement = function() {
                    return container;
                }
            
                this.getVideoElement = function() {
                    return video;
                }
             ```
         -  2.3.3、 窗体对象内部方法
             ```javascript 1.5
                function switchContainerClass() {}; //切换容器Container 的class 样式；
                function isPresentMainParticipant() {};//是否有主窗口元素，是则返回true
             ```
         - 2.3.4、 窗体对象内部成员变量引用
             ```javascript 1.5
                this.offerToReceiveVideo =function(error, offerSdp, wp){}; //SDP
                this.onIceCandidate = function (candidate, wp) {};//ICE
                this.dispose = function() {}; //释放
             ```
  -  3 离开房间
     -  3.1、页面执行`leaveRoom`
        ```javascript 1.5
        sendMessage({id : 'leaveRoom'}); //发送消息
        //清除用户
        for ( var key in participants) {
            participants[key].dispose();
        }
        document.getElementById('join').style.display = 'block';
        document.getElementById('room').style.display = 'none';
        ws.close();
        ```
     -  3.2、后端接收消息 
        ```
             final Room room = roomManager.getRoom(user.getRoomName());
             room.leave(user);
             if (room.getParticipants().isEmpty()) {
               roomManager.removeRoom(room);
         }
        ```
        -  3.2.1、房间中清除用户`room.leave`
            ```
              public void leave(UserSession user) throws IOException {
                this.removeParticipant(user.getName());
                user.close();
              }
            ```
        -  3.2.2、 移除参与者 ，并向所有参与人发送消息
            ``` 
                participants.remove(name); // 从全局Map 中删除用户
               
               //构建回调消息
                final List<String> unnotifiedParticipants = new ArrayList<>();
                final JsonObject participantLeftJson = new JsonObject();
                participantLeftJson.addProperty("id", "participantLeft");
                participantLeftJson.addProperty("name", name);
                
                for (final UserSession participant : participants.values()) {
                  try {
                    participant.cancelVideoFrom(name);
                    participant.sendMessage(participantLeftJson);
                  } catch (final IOException e) {
                    unnotifiedParticipants.add(participant.getName());
                  }
                }
            
                if (!unnotifiedParticipants.isEmpty()) {
                  log.debug("ROOM {}: The users {} could not be notified that {} left the room", this.name,
                      unnotifiedParticipants, name);
                }
            ```
        -   3.2.3、 移除WebRtc 端点
            ``` 
                final WebRtcEndpoint incoming = incomingMedia.remove(senderName);
                //释放连接
                incoming.release(new Continuation<Void>() {
                  @Override
                  public void onSuccess(Void result) throws Exception {
                    log.trace("PARTICIPANT {}: Released successfully incoming EP for {}",
                        UserSession.this.name, senderName);
                  }
                  @Override
                  public void onError(Throwable cause) throws Exception {
                    log.warn("PARTICIPANT {}: Could not release incoming EP for {}", UserSession.this.name,
                        senderName);
                  }
                });
            ```
     -  3.3、 页面收到消息，执行回调  ``participantLeft`` 
        ```
            var participant = participants[request.name];
            participant.dispose();//释放资源
            delete participants[request.name]; //删除节点
        ```
  -  4 页面构建    
     ```html  //一大两小
        <div id="participants">
            <div class="participant main" id="admin">
                 <video id="video-admin" autoplay=""></video>
                 <span>admin</span>
            </div>
            <div class="participant" id="maoxb">
                 <video id="video-maoxb" autoplay=""></video>
                 <span>maoxb</span>
            </div>
            <div class="participant" id="cby">
                 <video id="video-cby" autoplay=""></video>
                 <span>cby</span>
            </div>
        </div>
     ```

#  遗留问题处理：
   - 1. 单聊/群聊，点击发起 被接收方如果迟一些时间点接收，那么，发起方将收不到被接收方的回调消息； 
          此问题是由于浏览器拦截的原因，
         解决方式：需要设置浏览器允许即可；
   - 2. 视频，如果对方不再线，提示不能视频；
          跟踪点击视频 obj.data.id 状态值问题{单聊：id代表值 ，群
          21聊状态值 ：}
         解决方式：不在线的，提示msg 消息
   - 3. 点击按钮，关闭正在连接中……
         解决方式：直接在页面上增加点击事件，然后直接写隐藏事件；
   - 4. 群聊用户拒绝的情况下，提示……
         需要增加用户名，图片，然后获取IP和端口号
         解决方式：增加返回名称，提示：用户名+已经退出视频
 
   - 6. 视频时，对方如果关闭页面，需要发消息提示，用户已经即出视频；
        关闭窗口时，给好友发送消息即可；
        解决方式：不处理，视频直接就可以告诉好友关页面了，所以没必要再次发消息提醒；
   - 7. IM视频聊天时，已经收到好友上线消息，同好友视频，提示好友不在线 
      解决方式：判断条件有问题，直接拿缓存中用户判断即可；
   8. 群聊增加拉群功能： 赵酮 
          点击新增按钮，然后弹出所有人员列表，选中所要聊天的用户，确认进行添加名称
   - 9. 视频页面图标
         解决方式： 已经更换，错误原因，路径不对； 
   - 10. 关闭页面时，后台提示“您的主机中的软件中止了一个已建立的连接”
         解决方式：升级springboot tomcat 版本 2.1.6，
   - 11. 群聊用户离开房间时，出现加入房间
         解决方式：退出房间直接关闭窗口
   - 12. 群聊被动方加入时，其它用户用户名称为 0
         原因：群成员加入房间时，没有用户名
         解决方式：增加用户名称即可；     
   - 13. synchronized 锁问题
   - 14. 房间名称问题，目前用的是ID;  
         解决方式：弹出页面时，增加房间名称，decodeUrl 解析Url 乱码问题
   - 15.  群聊视频视频源不创建问题，异常退出问题；偶然出现；
         原因：由于网络问题造成        
    16.  使用国豪电脑 websocket 连接异常问题；
         原因：可能是网络原因造成的
         
   - 17. 创建websocket 问题，断线重连机制；
         原因：websocket 网络问题，
         解决方式：取消主动连接提示，设置为断开自动连接；
   - 18. 即时通讯用户列表问题；
         原因：部门类型导致数据结构有问题
         解决方式：重新修改数据
    19.  静音功能
   - 20. 群聊进行时，要有拉群外人进群功能；
         解决方式：1、拉群外人，可以在编辑群组中进行；
                  2、视频过程中，不可以群外人员，除非先拉进群里面；然后告知用户进入；目前不支持给视频中新加入的用户发消息； 
    21.  单聊，页面最大化效果
   -  22.  群聊页面效果
     5.  单聊，手机视频时，手机视频画面太小
   - 23. 发起群聊时，一个用户没有进入房间，当再次点击视频进入房间时，会给其它用户发进行视频的消息， ；
         解决方式：
            方式一、增加限制 ，发过消息过后就不发了，其它用户进入房间时直接进入即可；此种方式有问题，当用户再次发起视频，则同样也发不了消息了；
            方式二、建表，存储房间中当前群用户连接信息
                   1、存储：房间号，房间名称，用户名，用户ID，
                      逻辑，当用户加入房间，存储表数据一条,
                           离开房间，删除当前用户数据；
                      那么发起视频的时候
                         首先查询一下当前房间有没有视频连接信息，如果没有，则直接给群用户发消息；
                         如果有，那么直接进入房间
            方式三、通过消息方式，但是这个会有wss问题；
    24.  群聊视频加载方式：
         分析
            1：用户加入之后，直接放置于中间；
    25. APP 地址配置问题处理；
    26、用户异常退出记录未清除处理；
    
    
    
### netty 消息通信原理
   1.  用户登陆
      channelRead0  sessionId= null 
      消息：msgType = 1 ()  //请求消息      inbound 
       ```
           通道设置心跳机制 
           ctx.channel().attr(Constants.SessionConfig.SERVER_SESSION_HEARBEAT).set(System.currentTimeMillis());
           //消息包装器，通过代理将消息转换包装 
           MessageWrapper wrapper = proxy.convertToMessageWrapper(sessionId, message);
           MessageProxyImpl 
           message.getCmd() == 1 // 绑定  
           // 实例化消息包装器 ：消息协议状态码，发送消息人员，接收消息人员，消息体：消息内容
           return new MessageWrapper(MessageWrapper.MessageProtocol.CONNECT, message.getSender(), null, message);
       ```
       请求连接消息发送
       receiveMessage()
       ``` 
          //消息连接
          if (wrapper.isConnect()) {
                 connertor.connect(hander, wrapper);
              }
        ```
       消息连接：判断用户是否首次连接，否则获取重连信息发送
       ```
           	public void connect(ChannelHandlerContext ctx, MessageWrapper wrapper) {
           		try {
           			String sessionId = wrapper.getSessionId();
           			String sessionId0 = getChannelSessionId(ctx);
           			// 当sessionID存在或者相等 视为同一用户重新连接
           			if (StringUtils.isNotEmpty(sessionId0) || sessionId.equals(sessionId0)) {
                         // 获取重新连接状态消息 并发送出去写到session中
           				pushMessage(proxy.getReConnectionStateMsg(sessionId0));
           			} else {
                    //如果是用户第一次连接
           				sessionManager.createSession(wrapper, ctx);
           				setChannelSessionId(ctx, sessionId);
           			}
           		} catch (Exception e) {
           			log.error("connector connect  Exception.", e);
           		}
           	}
       ```
       获取重新连接状态消息， 更新消息包装器  Constants.CmdType.RECON //RECON = 6
       ```
        	public MessageWrapper getReConnectionStateMsg(String sessionId) {
        		MessageProto.Model.Builder result = MessageProto.Model.newBuilder();
        		result.setTimeStamp(DateFormatUtils.format(new Date(), "yyyy-MM-dd HH:mm:ss"));
        		result.setSender(sessionId);// 存入发送人sessionId
        		result.setCmd(Constants.CmdType.RECON);    // 重连
        		return new MessageWrapper(MessageWrapper.MessageProtocol.SEND, sessionId, null, result.build());
        	}       
       ```
       //当用户第一次连接的时候，设置session 
       ``` 
         private Session setSessionContent(ChannelHandlerContext ctx, MessageWrapper wrapper, String sessionId) {
    		MessageProto.Model model = (MessageProto.Model) wrapper.getBody();
    		Session session = new Session(ctx.channel());
    		session.setAccount(sessionId);
    		session.setSource(wrapper.getSource());
    		session.setAppKey(model.getAppKey());
    		session.setDeviceId(model.getDeviceId());
    		session.setPlatform(model.getPlatform());
    		session.setPlatformVersion(model.getPlatformVersion());
    		session.setSign(model.getSign());
    		session.setBindTime(System.currentTimeMillis());
    		session.setUpdateTime(session.getBindTime());
    		return session;
    	}
       ```
       将当前登陆的用户加入到session中去，并群发出去，让人知道当前用户登陆；
       ```
        public synchronized void addSession(Session session) {
                if (null == session) {
                    return;
                }
                sessions.put(session.getAccount(), session);
                 如果不是DWR标识，则将用户加入到Im广播组 中，用于群发
                if (session.getSource() != Constants.ImserverConfig.DWR) {
                    Im广播组 
                    ImChannelGroup.add(session.getSession());
                }
                // 全员发送上线消息
                MessageProto.Model model = proxy.getOnLineStateMsg(session.getAccount());
                ImChannelGroup.broadcast(model);
                DwrUtil.sedMessageToAll(model);
                log.debug("put a session " + session.getAccount() + " to sessions!");
                log.debug("session size " + sessions.size());
            }
       ```
       如果不是DWR标识，则将用户加入到群组中，用于群发
       ``` 
         private static final ChannelGroup CHANNELGROUP = new DefaultChannelGroup("ChannelGroup", GlobalEventExecutor.INSTANCE);
        
         public static void add(Channel channel) {
             CHANNELGROUP.add(channel);
         }
        ```
       广播消息
       ```
            public static ChannelGroupFuture broadcast(Object msg) {
                return CHANNELGROUP.writeAndFlush(msg);
            }
        ```
       ```java
       	public static interface ImserverConfig {
       		// 连接空闲时间
       		public static final int READ_IDLE_TIME = 60;// 秒
       		// 发送心跳包循环时间
       		public static final int WRITE_IDLE_TIME = 40;// 秒
       		// 心跳响应 超时时间
       		public static final int PING_TIME_OUT = 70; // 秒 需大于空闲时间
       
       		// 最大协议包长度
       		public static final int MAX_FRAME_LENGTH = 1024 * 10; // 10k
       		//
       		public static final int MAX_AGGREGATED_CONTENT_LENGTH = 65536;
       
       		public static final String REBOT_SESSIONID = "0";// 机器人SessionID
       
       		public static final int WEBSOCKET = 1;// websocket标识
       
       		public static final int SOCKET = 0;// socket标识
       
       		public static final int DWR = 2;// dwr标识
       
       	}
        public enum MessageProtocol {
            CONNECT, CLOSE, HEART_BEAT, SEND, GROUP, NOTIFY, REPLY, ON_LINE, OFF_LINE
        }
        public static interface ProtobufType {
            byte SEND = 1; // 请求
            byte RECEIVE = 2; // 接收
            byte NOTIFY = 3; // 通知
            byte REPLY = 4; // 回复
        }
    
        public static interface CmdType {
            byte BIND = 1; // 绑定
            byte HEARTBEAT = 2; // 心跳
            byte ONLINE = 3; // 上线
            byte OFFLINE = 4; // 下线
            byte MESSAGE = 5; // 消息
            byte RECON = 6; // 重连
        }
    ```
       
```
     