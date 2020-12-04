# 视频一对一请求逻辑

###一、 弹出页面之后进行注册用户
  1. A 用户发起
  2. B 用户收到请求，然后弹出页面，提示：A用户在请求发起视频，B是否同意；
  3. B 用户同意，则进行弹出页面 
  4. B 用户进行注册，注册成功返回回调
  5. A 用户收到B 用户的 回调，然后弹出页面
  6. A 用户进行注册，
  7. A 用户注册成功，收到回调之后直接发起call 呼叫视频
  B. B 用户响应视频,执行 incommingcall 进行视频
###二、 弹出页面之后进行注册用户
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
  2. 发起视频，点击确认弹窗口问题；
  3. 视频过程中，websocket 发送消息 延时发送时间问题
  
### 整合room的视频需要做的事件
1. 了解``springboot`` 请求访问页面 方式
      webjars 静态资源jar包方式加载
2. netty 端 点击视频时，如何进行控制“点对点” 还是“``Room``” 形式的视频； 
      - 1.  点击视频，是否可以知道是点对点，或是群聊；
         ``点击联系人，弹出的页面只有自己，群聊的显示有多人；``
      - 2.  如果可以区分，则进行传参来进行表明，视频发起是点对点，还是群聊
      - 3.  视频直接用Room形式的，舍弃点对点；
3. 核心处理器 ``handle`` 的整合
      - 1. 新建room文件夹，直接把Room,RoomManager 复制过来；
      - 2. Room UserSession 绑定
         ```
          直接把Room中绑定了参与者列表，UserSession 信息，整合UserSession 实体
          由于GroupAll UserSession中 直接监听了ICE ,监听到之后，直接构建返回；发送信息
           而one to one 中通过响应来执行ICE 添加，把所有ICE  都与用户端点进行绑定
        ```
      - 3. 两种方式完全不一样，所以可以合并改造比较困难，非要改造，必须对些处非常了解；暂时不具备这个能力，坑有点大……
      - 已经整合完毕
          ```
              由于上面思路比较难以实现，所以换了方式来进行整合，直接把Room块按照一个模块来进行整合，
           同时，Room有自己的websocket 所有的实现完全独立； 
          ```      
4. 业务梳理：
      - 总线：
          1. 用户发起视频，提示房间所有人，当前用户已经发起了视频；
          2. 收到消息的用户可以选择进行加入房间，进行视频
      - 详情
          1. 首先用户点击视频;
          2. 判断出是“点对点”、“群聊”;
             ``判断点对点，群聊需要特别关注一下 ``
               如何判断点对点，群聊；
               点击视频的时候，最后一个参数obj
               obj.data.type="group" 表示群组消息
               如果是群组的，则查询群组所有人列表，然后给所有人发一个消息；
               obj.data.type="friend" 表示点对点
          3. 在基于群聊的基础上；
             1. 用户点击视频，首先弹出页面
             2. 弹出页面之前需要干的事；
               - 1. A 用户发起，通知房间内其它用户？？是否需要？还是说就进入房间进行等待就可以了；
                    - 1. 通知群组的其它用户要进行视频              /*(群组id,用户列表，房间ID，用户名称)*/
                    - 2. 发通知的时候，需要进行 设置reqType 请求方式属性，弹出页面的参数：ptop：单聊；group:多聊；同时需要设置groupId
                        - 2.1. sendVideoOrAuidoMsg() 发送给用户后；
                             如果是群聊，则直接弹出页面，进入房间；
                             如果是单聊，则弹出提示，“正在连接中……”                    
                    - 3. 当被动方接受到回调消息时，弹窗提示“***，与你发起视频”
                         被动方接受之后，
                            如果是单聊：弹出页面，同时给发起方发送消息，告知接受状态；
                            如果是群聊：弹出页面，进入房间即可；不需要再次给发起方发消息，因为已经进入了房间；
                         被动方拒绝之后：
                           如果是单聊：主动方接收到回调，弹出拒绝通知； 
                           如果是群聊： 主动方接收到回调，弹出拒绝通知；
      
               - 2. B,C,D 接收通知，弹出页面，然后加入房间；
                    1、弹页面所需参数：                          用户ID：用户名称：房间号(群组ID)
             2. 弹出页面，用户进入房间 
                 ```
                     var message = { id : 'joinRoom',name : name,room : room,} 
                     sendMessage(message);
                 getRoom()   
                     Room room = roomManager.getRoom(roomName);
                     private final ConcurrentMap<String, Room> rooms = new ConcurrentHashMap<>();
                     if (room == null) {//如果获取不到房间，则创建房间
                       room = new Room(roomName, kurento.createMediaPipeline());
                       rooms.put(roomName, room);
                     }
                 join() 
                     //初始化： 用户实例--pipeline实例--房间实例 进行关联
                     final UserSession participant = new UserSession(userName, this.name, session, this.pipeline);
                     joinRoom(participant);//加入房间并 通知其他在房间中的用户，通知他们有新的参与者
                     participants.put(participant.getName(), participant);//将当前用户加入到全局参与者用户列表中；
                     sendParticipantNames(participant);//在加入成功后，给当前用户发送房间里的其它人消息
                 register(user)
                     registry.register(user);// 最后进行注册,写入缓存
                 响应回调
                     existingParticipants  //构建本地视频元素来输出视频流
                     receiveVideoAnswer   //SDP 响应回调
                     iceCandidate       //ICE 回调,添加候选
                 ```    
   注意传参时，``id+name``