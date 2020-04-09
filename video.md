#对接文档
## 点对点
  ###  点对点视频socket
       wss://192.168.1.177:9090/call
  ###  netty socket  负责消息交互
       ws://192.168.1.231:2048/ws
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
            ```
          - 如果是群聊：``reqType === "group"``弹出页面，进入房间即可；不需要再次给发起方发消息，因为已经进入了房间；
            ```
               {
                  userId：发起ID
                  groupId：群组ID(房间号)
                  type：视频或是音频:  video/audio
               }  
                windowOpen('https://192.168.1.177:9090/room?userId='***'&groupId='***'&type=***','视频聊天','650','650');
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
           groupId：群组ID(房间号)
           type：视频或是音频:  video/audio
         }  
         windowOpen('https://192.168.1.177:9090/room?userId='***'&groupId='***'&type=video','视频聊天','650','650');
      ```
   -  如果是拒绝  ``msg.getRessign()==='refuse'``
       -  如果是单聊 ``msg.getReqtype() === "ptop"``
          直接弹出拒绝消息即可；
       -  如果是群聊 ``msg.getReqtype() === "group"``
          直接弹出拒绝消息即可；

  
## 群聊
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
      windowOpen('https://192.168.1.177:9090/room?userId='***'&groupId='***'&type=video','视频聊天','650','650');
  ```
  
###  弹出页面地址及参数信息   
  ``` 
  1、呼叫 设置参数
  由于netty 端接收参数使用了 proto 类型，所以前端发送也必须封装 proto 类型发送
    {
      	   var message = new proto.Model();
           var content = new proto.MessageBody();
           message.setMsgtype(4);
           message.setCmd(5);
           message.setGroupid('video');//系统用户组
           message.setToken(currentsession);//当用用户Id
           message.setSender(currentsession);
           message.setReceiver(obj.data.id);//好友ID
           content.setContent('video');
           //message.setAudioOrVideo(2);
           content.setType(0)
           message.setContent(content.serializeBinary())
           socket.send(message.serializeBinary());
    }
  2、被动方，确认接收呼叫：先弹层(注册)，然后进行发消息；
    {
           var message = new proto.Model();
           var content = new proto.MessageBody();
           message.setMsgtype(4);
           message.setCmd(5);
           message.setGroupid('video');//系统用户组
           message.setToken(currentsession);
           message.setSender(currentsession);
           message.setReceiver(obj.data.id);//好友ID  此处的好友指被接收人好友，也就是发送人
           content.setContent('video');
           message.setSign('agree'); //同意呼叫传参：agree  ；拒绝呼叫会传参：refuse;
           content.setType(0)
           message.setContent(content.serializeBinary())
           socket.send(message.serializeBinary());
      }
  3、主动方接收到被动方发来的回调消息，进行弹层(注册，注册完收到回调，然后发起call)
  
  ```