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

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import org.kurento.client.Continuation;
import org.kurento.client.MediaPipeline;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.WebSocketSession;

import javax.annotation.PreDestroy;
import java.io.Closeable;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 即房间，1个房间 可能有多个UserSession实例。
 * @author Ivan Gracia (izanmail@gmail.com)
 * @since 4.3.1
 */
public class Room implements Closeable { //实现 Closeable表示一种不再使用时需要关闭的资源。
  private final Logger log = LoggerFactory.getLogger(Room.class);

  private final ConcurrentMap<String, GroupUserSession> participants = new ConcurrentHashMap<>();
  private final MediaPipeline pipeline;
  private final String name;

  public String getName() {
    return name;
  }

  public Room(String roomName, MediaPipeline pipeline) {
    this.name = roomName;
    this.pipeline = pipeline;
    log.info("Room ---------- >>>  ROOM {} has been created  pipeline  init complete! ", roomName);
  }

  @PreDestroy
  private void shutdown() {
    this.close();
  }

  /**
   * 通过发送两条信息，函数结束：一条信息是对于其它在房间中的用户通知他们有新的参与者，另一条信息是对当前用户通知当前存在的参与者
   * @param userName
   * @param session
   * @return
   * @throws IOException
   */
  public GroupUserSession join(String userName,String personName, WebSocketSession session) throws IOException {
    log.info("join ---->> ROOM {}: adding participant {}", userName, userName);
    //初始化 用户实例--pipeline实例--房间实例  进行关联
    final GroupUserSession participant = new GroupUserSession(userName, personName, this.name, session, this.pipeline);

    //一条信息是对于其它在房间中的用户通知他们有新的参与者，
    joinRoom(participant);
    participants.put(participant.getName(), participant);
    //另一条信息是对当前用户通知当前存在的参与者
    sendParticipantNames(participant);
    return participant;
  }

  public void leave(GroupUserSession user) throws IOException {
    log.debug("PARTICIPANT {}: Leaving room {}", user.getName(), this.name);
    this.removeParticipant(user.getName());
    user.close();
  }

  /**
   *  加入房间，新成员加入，同时给所有参与者发消息
   *  消息发送成功，页面监听事件立马响应
   * @param newParticipant
   * @return
   * @throws IOException
   */
  private Collection<String> joinRoom(GroupUserSession newParticipant) throws IOException {
    final JsonObject newParticipantMsg = new JsonObject();
    newParticipantMsg.addProperty("id", "newParticipantArrived"); //新人加入
    newParticipantMsg.addProperty("name", newParticipant.getName());
    newParticipantMsg.addProperty("personName", newParticipant.getPersonName());

    final List<String> participantsList = new ArrayList<>(participants.values().size());
    log.debug("join ---->>  joinRoom {}: notifying other participants of new participant {}", name,
        newParticipant.getName());

    for (final GroupUserSession participant : participants.values()) {
      try {
        participant.sendMessage(newParticipantMsg);
      } catch (final IOException e) {
        log.debug("join ---->>   ROOM {}: participant {} could not be notified", name, participant.getName(), e);
      }
      participantsList.add(participant.getName());
    }

    return participantsList;
  }

  /**
   * 移除参与者 ，并向所有参与人发送消息
   * @param name
   * @throws IOException
   */
  private void removeParticipant(String name) throws IOException {
    participants.remove(name);

    log.debug("ROOM {}: notifying all users that {} is leaving the room", this.name, name);

    final List<String> unnotifiedParticipants = new ArrayList<>();
    final JsonObject participantLeftJson = new JsonObject();
    participantLeftJson.addProperty("id", "participantLeft");
    participantLeftJson.addProperty("name", name);
    for (final GroupUserSession participant : participants.values()) {
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

  }

  /**
   * 在加入成功后，给当前用户发送房间里的其它人消息
   * @param user
   * @throws IOException
   */
  public void sendParticipantNames(GroupUserSession user) throws IOException {
    log.debug("sendParticipantNames ---->> sendParticipantNames ");
    //排除当前用户外的所有参与者
    final JsonArray participantsArray = new JsonArray();
    for (final GroupUserSession participant : this.getParticipants()) {
      if (!participant.equals(user)) {
        final JsonElement participantName = new JsonPrimitive(participant.getName());
        participantsArray.add(participantName);
      }
    }

    final JsonObject existingParticipantsMsg = new JsonObject();
    existingParticipantsMsg.addProperty("id", "existingParticipants");//其他人参与者
    existingParticipantsMsg.add("data", participantsArray);
    log.debug("sendParticipantNames ---->> PARTICIPANT {}: sending a list of {} participants", user.getName(),
        participantsArray.size());
    user.sendMessage(existingParticipantsMsg);
  }

  public Collection<GroupUserSession> getParticipants() {
    return participants.values();
  }

  public GroupUserSession getParticipant(String name) {
    return participants.get(name);
  }

  @Override
  public void close() {
    for (final GroupUserSession user : participants.values()) {
      try {
        user.close();
      } catch (IOException e) {
        log.debug("ROOM {}: Could not invoke close on participant {}", this.name, user.getName(),
            e);
      }
    }

    participants.clear();

    pipeline.release(new Continuation<Void>() {

      @Override
      public void onSuccess(Void result) throws Exception {
        log.trace("ROOM {}: Released Pipeline", Room.this.name);
      }

      @Override
      public void onError(Throwable cause) throws Exception {
        log.warn("PARTICIPANT {}: Could not release Pipeline", Room.this.name);
      }
    });

    log.debug("Room {} closed", this.name);
  }

}
