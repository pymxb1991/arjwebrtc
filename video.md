#视频逻辑参考文档
## 一、 点对点
   ###  1、点对点视频socket ：`wss://192.168.1.177:9090/call`
        
   ###  2、负责消息交互 netty socket: `ws://192.168.1.231:2048/ws`
       
   ####  1、发起视频：
  
   -  如果是点对点：消息发送参数如下：
  ```
      {
        currentUserId:发起人ID，
        friendId:接收人ID，
        "video"：视频类型，
        "ptop"： 点对点
      }
      sendVideoOrAuidoMsg(currentUserId,friendId,"video","ptop");
   
      注意：发送完之后，自己需要提示“正在连接中……”
  ``` 
  - 增加逻辑 (from - > App)
  ```
     发送者发起消息，需要表明自己是发起者，同时告诉接收者，我这个发出去的消息是给被接收者的；
     callee 表示被接收者  caller 表示发送者
      sendVideoOrAuidoMsg(currentUserId,friendId,"callee",video","ptop");
  ``` 
  ####  2、被动方监听消息收到主动方发来的视频邀请消息：
   - 1、弹出提示，收到主动方来的消息
   - 2、接收/拒绝 
     -  接收：(agree)  
          - 如果是单聊：``reqType === "ptop"``弹出页面，同时给发起方发送消息，告知接受状态,可以进行视频；
            ``` 
               {
                   userId：发送人ID
                   sendId：接收人ID
                   type：视频或是音频:  video/audio
                   callType：请求类型： 发起者/接收者：caller/callee  此处为 ：callee
               }           
               windowOpen('https://192.168.1.177:9090?userId='***'&sendId='***'&type='***'&callType=callee','视频聊天','650','650');
               {
                   id: 接收人，也就是被呼叫方ID
                   sendId: 发起人ID
                   type:  视频或是音频:  video/audio
                   reqType: 请求方式：点对点/群聊 ptop/group
                   'agree'  拒绝/接受 状态值: refuse/agree
               }
               sendVideoOrAuidoMsg(id, sendId,type,reqType,'agree')
            
              - 增加逻辑 (from - > App)
              ```
                 接收者接收发送者的消息，弹出页面，同时发消息告诉发送者，我(接收者)已经接受消息了；
                 callee 表示被接收者  caller 表示发送者
                 sendVideoOrAuidoMsg(currentUserId,friendId,"caller",video","ptop"); //接收者发的消息
              ``` 
            ```
          - 如果是群聊：``reqType === "group"``弹出页面，进入房间即可；不需要再次给发起方发消息，因为已经进入了房间；
            ```
               {
                  userId：发起用户ID
                  userName:发起用户名称
                  groupId：群组ID(房间号)
                  type：视频或是音频:  video/audio
               }  
                windowOpen('https://192.168.1.177:9090/room?userId='***'&userName='***'&groupId='***'&type=***','视频聊天','650','650');
            ```
     -  拒绝：(refuse) 
          -  如果是单聊：发送消息给主动方,告知已经拒绝视频，主动方接收到回调，弹出拒绝通知，也直接断开视频 ； 
          -  如果是群聊： 主动方接收到回调，弹出拒绝通知；
             ``` 
                {
                    currentUserId:当前用户ID
                    sendId:  被拒绝谁就是谁的ID
                    type: 视频或是音频:  video/audio
                    reqType:请求方式：点对点/群聊 ptop/group
                    'refuse': 拒绝/接受 状态值: refuse/agree
                }
                sendVideoOrAuidoMsg(currentUserId, sendId,type,reqType,'refuse')
             ```
              - 增加逻辑 (from - > App)
               ```
                  接收者接收发送者的消息，弹出页面，同时发消息告诉发送者，我(接收者)已经拒绝视频消息了；
                  callee 表示被接收者  caller 表示发送者
                  sendVideoOrAuidoMsg(currentUserId,friendId,"caller",video","ptop"); //接收者发的消息
               ``` 
  ####  3、主动方监听消息收到被动方发来的回调消息：
   -  如果是同意  ``msg.getRessign()==="agree"``
      -  如果是单聊 ``msg.getReqtype() === "ptop"``
      ```
         {
            userId: 当前用户ID(发起人ID)
            sendId: 接收人ID
            type:   视频或是音频:  video/audio
            callType: 请求类型： 发起者/接收者：caller/callee  此处为：caller
         }
         windowOpen('https://192.168.1.177:9090?userId='***'&sendId='***'&type=***&callType=caller','视频聊天','650','650');
      ```
      -  如果是群聊 ``msg.getReqtype() === "group"``
      ``` 
         {
           userId：当前用户ID
           userName:当前用户名称
           groupId：群组ID(房间号)
           type：视频或是音频:  video/audio           
         }  
         windowOpen('https://192.168.1.177:9090/room?userId='***'&userName='***'&groupId='***'&type=video','视频聊天','650','650');
      ```
   -  如果是拒绝  ``msg.getRessign()==='refuse'``
       -  如果是单聊 ``msg.getReqtype() === "ptop"``
          直接弹出拒绝消息即可；
       -  如果是群聊 ``msg.getReqtype() === "group"``
          直接弹出拒绝消息即可；

  
## 二、群聊
  ### 群聊视频socket  
       wss://192.168.1.177:9090/groupcall
  ### netty socket  负责消息交互
       ws://192.168.1.231:2048/ws 
  #### 1.  发起视频： 
  
   -  如果是群聊：则遍历所有用户给除自己所有人发消息，消息发送参数如下：
  ```
      {
        currentUserId:发起人ID，
        friendId:接收人ID，
        "video"：视频类型，
        "group"： 群聊
        "":  拒绝/接受 状态值 此处不需要所以为空
        groupId:组ID (房间ID)
      }
      sendVideoOrAuidoMsg(currentsession,groupMember[i].id,"video","group","",groupId);

      注意：发完消息之后，直接弹出页面，进入房间
      {
        userId：当前用户ID
        userName:当前用户名称
        groupId：群组ID(房间号)
        type：视频或是音频:  video/audio           
      }  
      windowOpen('https://192.168.1.177:9090/room?userId='***'&userName='***'&groupId='***'&type=video','视频聊天','650','650');
  ```
  
###  弹出页面地址及参数信息   
  ``` 
  /**
   *
   * @param currentUserId 当前用户ID
   * @param firedId  好友ID
   * @param type 请求类型 video audio
   * @param resSign 请求响应状态: 接受/拒绝   agree/refuse
   * @param reqType 请求方式：点对点/群聊 ptop/group
   * @param vaGroupId 发起视频组ID(房间号)：缺少房间号，增加房间号
   */
  function sendVideoOrAuidoMsg(currentUserId, firedId,type,reqType,resSign,vaGroupId) {
      var message = new proto.Model();
      var content = new proto.MessageBody();
      message.setMsgtype(4);
      message.setCmd(5);
      message.setGroupid(type);//系统用户组
      message.setToken(currentUserId);
      message.setSender(currentUserId);
      message.setReceiver(firedId);//好友ID
      content.setContent(type);
      //message.setSign(sign),//签名
      message.setRessign(resSign); //接受/拒绝 状态
      message.setReqtype(reqType);//点对点/群聊 ptop/group
      message.setVagroupid(vaGroupId);//群组ID
      content.setType(0);
      message.setContent(content.serializeBinary());
      socket.send(message.serializeBinary());
  }
  
  ```

### kurento 群聊模式中 消息交互把用户名称带上(原则上不全加，根据回调反推回去，只增加显示名称即可)
   ```
       function onNewParticipant(request) { // 加入房间用户的名称
           console.log("onNewParticipant ---->>>> receiveVideo(request.name);");
           receiveVideo(request.name);
       }
   ```
   
   ``` 
      Room.java -->joinRoom
      private Collection<String> joinRoom(GroupUserSession newParticipant) throws IOException {
        final JsonObject newParticipantMsg = new JsonObject();
        newParticipantMsg.addProperty("id", "newParticipantArrived"); //新人加入
        newParticipantMsg.addProperty("name", newParticipant.getName());
        newParticipantMsg.addProperty("personName", newParticipant.getName());
   ```
   ```
        GroupUserSession.java  -->成员变量
        private final String personName;
        public String getPersonName() {
          return personName;
        }
        构造方法增加 成员变量
   ```
   ```
        Room.java -->join
        public GroupUserSession join(String userName,String personName, WebSocketSession session) throws IOException {
      
        //初始化 用户实例--pipeline实例--房间实例  进行关联
        final GroupUserSession participant = new GroupUserSession(userName, personName, this.name, session, this.pipeline);

   ```
   ```
        GroupCallHandler.java -->joinRoom
    
        Room room = roomManager.getRoom(roomName);
        final GroupUserSession user = room.join(name, session);
   ```
   register(name,personName,room)
   ```
    var message = {
        id : 'joinRoom',
        name : name,
        personName : personName,
        room : room,
    }
   ```
### netty 消息通信，增加用户名，及头像
   1.  群聊      
```
      
      
```