#对接文档

  ### 视频socket
      wss://192.168.1.177:9090/call
  ### netty socket
      ws://192.168.1.231:2048/ws 
  ###  弹出页面地址及参数信息   
     windowOpen('https://192.168.1.177:9090?userId='***'&sendId='***'&type=video&callType=caller','视频聊天','650','650');
     userId: 发起人ID;
     sendId: 接受人ID;
     type:   类型：video 视频/ audio 音频；
     callType： 发起类型： caller:发起人/callee 接收人
     
  ### 发起参数
  
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