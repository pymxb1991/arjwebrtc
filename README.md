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
     
  5. 接收方如果没有视频，程序会异常，发送方的视频也会看不到；
     * 已经解决
     * 增加异常逻辑  
     ``  1. 当被呼叫方没有视频时，给发起方提示：“对方没有视频”，并且也提示自己：“没有发现设备，确认关闭窗口”
     ``
     
# 视频Group-All请求逻辑分析
   ### register() 
1. 页面请求发起
   ```javascript 1.5
      var message = {
          id : 'joinRoom',
          name : name,
          room : room,
      } 
   ```
2. 后端执行 
   1. ``joinRoom()`` 获取房间，然后加入；
       ```java
          Room room = roomManager.getRoom(roomName);
          final UserSession user = room.join(name, session);
       ```
   2.  ``getRoom()`` 如果获取不到房间，则创建房间；
         ```java
        private final ConcurrentMap<String, Room> rooms = new ConcurrentHashMap<>();
           if (room == null) {
               log.debug("Room {} not existent. Will create now!", roomName);
               room = new Room(roomName, kurento.createMediaPipeline());
               rooms.put(roomName, room);
           }
          ```
    3. 最后进行用户注册；
