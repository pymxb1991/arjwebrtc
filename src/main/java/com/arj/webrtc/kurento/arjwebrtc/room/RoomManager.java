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

import org.kurento.client.KurentoClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 带通知的房间管理
 * 房间管理，用于创建或销毁房间。
 * @author Ivan Gracia (izanmail@gmail.com)
 * @since 4.3.1
 */
public class RoomManager {

  private final Logger log = LoggerFactory.getLogger(RoomManager.class);

  @Autowired
  private KurentoClient kurento;

  private final ConcurrentMap<String, Room> rooms = new ConcurrentHashMap<>();

  /**
   * Looks for a room in the active room list.
   *
   * @param roomName
   *          the name of the room
   * @return the room if it was already created, or a new one if it is the first time this room is
   *         accessed
   */
  public Room getRoom(String roomName) {
    log.debug("getRoom ---------- >>>  Searching for room {}", roomName);
    Room room = rooms.get(roomName);

    if (room == null) {
      log.debug("getRoom ---------- >>> Room {} not existent. Will create now!", roomName);
      //每个房间实例创建时，都绑定了一个对应的MediaPipeline（用于隔离不同房间的媒体信息等）
      room = new Room(roomName, kurento.createMediaPipeline());
      rooms.put(roomName, room);
    }
    log.debug("getRoom ---------- >>> Room {} found!", roomName);
    return room;
  }

  /**
   * Removes a room from the list of available rooms.
   *
   * @param room
   *          the room to be removed
   */
  public void removeRoom(Room room) {
    this.rooms.remove(room.getName());
    room.close();
    log.info("Room {} removed and closed", room.getName());
  }

}
