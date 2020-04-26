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

package com.arj.webrtc.kurento.arjwebrtc.room;

import com.alibaba.fastjson.JSONObject;
import com.arj.webrtc.kurento.arjwebrtc.room.entity.RoomUserRel;
import com.arj.webrtc.kurento.arjwebrtc.util.Tool;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import org.kurento.client.IceCandidate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;

/**
 * 
 * @author Ivan Gracia (izanmail@gmail.com)
 * @since 4.3.1
 */
public class GroupCallHandler extends TextWebSocketHandler {

  private static final Logger log = LoggerFactory.getLogger(GroupCallHandler.class);

  private static final Gson gson = new GsonBuilder().create();

  @Autowired
  private RoomManager roomManager;

  @Autowired
  private GroupUserRegistry registry;

  @Override
  public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    final JsonObject jsonMessage = gson.fromJson(message.getPayload(), JsonObject.class);

    final GroupUserSession user = registry.getBySession(session);

    if (user != null) {
      log.debug("Incoming message from user '{}': {}", user.getName(), jsonMessage);
    } else {
      log.debug("Incoming message from new user: {}", jsonMessage);
    }

    switch (jsonMessage.get("id").getAsString()) {
      case "joinRoom":
        joinRoom(jsonMessage, session);
        break;
      case "receiveVideoFrom":
        final String senderName = jsonMessage.get("sender").getAsString();
        final GroupUserSession sender = registry.getByName(senderName);
        final String sdpOffer = jsonMessage.get("sdpOffer").getAsString();
        user.receiveVideoFrom(sender, sdpOffer);
        break;
      case "leaveRoom":
        leaveRoom(user);
        break;
      case "onIceCandidate":
        JsonObject candidate = jsonMessage.get("candidate").getAsJsonObject();

        if (user != null) {
          IceCandidate cand = new IceCandidate(candidate.get("candidate").getAsString(),
              candidate.get("sdpMid").getAsString(), candidate.get("sdpMLineIndex").getAsInt());
          user.addCandidate(cand, jsonMessage.get("name").getAsString());
        }
        break;
      default:
        break;
    }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
    GroupUserSession user = registry.removeBySession(session);
    roomManager.getRoom(user.getRoomName()).leave(user);
    updateRoomUserInfo( user.getName(), user.getPersonName(), user.getRoomName(), "del");
  }

  private void joinRoom(JsonObject params, WebSocketSession session) throws IOException {
    final String roomName = params.get("room").getAsString();
    final String name = params.get("name").getAsString();
    final String personName = params.get("personName").getAsString();
    log.info("joinRoom ---->> PARTICIPANT {}: trying to join room {}", name, roomName);

    Room room = roomManager.getRoom(roomName);
    final GroupUserSession user = room.join(name,personName, session);
    registry.register(user);
    updateRoomUserInfo( name, personName, roomName, "add");

  }

  private void leaveRoom(GroupUserSession user) throws IOException {
    final Room room = roomManager.getRoom(user.getRoomName());
    updateRoomUserInfo( user.getName(),user.getPersonName(),  user.getRoomName(), "del");
    room.leave(user);
    if (room.getParticipants().isEmpty()) {
      roomManager.removeRoom(room);
    }
  }
  private String updateRoomUserInfo(String userId,String userName, String roomId,String method) throws IOException {

    String url ="";
    if("add".equals(method)){
      url = "http://192.168.1.238:8081/arjccm/app/rest/ImChat/saveUserGroupRel";
    }else{
      url = "http://192.168.1.238:8081/arjccm/app/rest/ImChat/deleteUserGroupRel";
    }

    RoomUserRel userRel = new RoomUserRel(roomId,userId);
    String s1 = JSONObject.toJSONString(userRel);
    String ret = Tool.sendPost(url, s1);
    JSONObject resJson = JSONObject.parseObject(ret);
    String retCode = resJson.getString("result");
    String msg = "add".equals(method) ? "进入房间记录日志" :"离开房间记录日志";
    if("1".equals(retCode)) {
      log.info(userName +"："+msg);
    }
    return ret;
  }
}
