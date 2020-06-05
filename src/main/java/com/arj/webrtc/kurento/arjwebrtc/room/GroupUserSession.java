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

import com.google.gson.JsonObject;
import org.kurento.client.*;
import org.kurento.jsonrpc.JsonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.Closeable;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 代表每个连接进来的用户会话信息
 * @author Ivan Gracia (izanmail@gmail.com)
 * @since 4.3.1
 */
public class GroupUserSession implements Closeable {

  private static final Logger log = LoggerFactory.getLogger(GroupUserSession.class);

  private final String name;
  private final String personName;
  private final WebSocketSession session;

  private final MediaPipeline pipeline;

  private final String roomName;
  private final WebRtcEndpoint outgoingMedia; //所属用户的WebRtc 端点
  private final ConcurrentMap<String, WebRtcEndpoint> incomingMedia = new ConcurrentHashMap<>();

  /**
   * 把房间实例的pipeline做为入参传进来，
   * 然后上行传输的WebRtcEndPoint实例outgoingMedia又跟pipeline绑定 。
   * 这样："用户实例--pipeline实例--房间实例" 就串起来了。
   * @param name
   * @param personName
   * @param roomName
   * @param session
   * @param pipeline
   */
  public GroupUserSession(final String name, String personName, String roomName, final WebSocketSession session,
                          MediaPipeline pipeline) {
    this.personName = personName;
    log.info("UserSession ---->> UserSession {}: initi complate  ");
    this.pipeline = pipeline;
    this.name = name;
    this.session = session;
    this.roomName = roomName;
    //WebRtc端点跟媒体管道绑定
    this.outgoingMedia = new WebRtcEndpoint.Builder(pipeline).build();

    //监听ICE 事件
    this.outgoingMedia.addIceCandidateFoundListener(new EventListener<IceCandidateFoundEvent>() {

      @Override
      public void onEvent(IceCandidateFoundEvent event) {
        JsonObject response = new JsonObject();
        response.addProperty("id", "iceCandidate");
        response.addProperty("name", name);
        response.add("candidate", JsonUtils.toJsonObject(event.getCandidate()));
        try {
          synchronized (session) {
            session.sendMessage(new TextMessage(response.toString()));
          }
        } catch (IOException e) {
          log.debug(e.getMessage());
        }
      }
    });
  }

  public String getPersonName() {
    return personName;
  }

  public WebRtcEndpoint getOutgoingWebRtcPeer() {
    return outgoingMedia;
  }

  public String getName() {
    return name;
  }

  public WebSocketSession getSession() {
    return session;
  }

  /**
   * The room to which the user is currently attending.
   *
   * @return The room
   */
  public String getRoomName() {
    return this.roomName;
  }

  /**
   * 应答SDP消息
   * 获取到合适的端点，它处理请求，产生一个应答，将其发送到客户端并开始收集ice candidates.
   * @param sender
   * @param sdpOffer
   * @throws IOException
   */
  public void receiveVideoFrom(GroupUserSession sender, String sdpOffer) throws IOException {
    log.info("receiveVideoFrom ---->> USER {}: connecting with {} in room {}", this.name, sender.getName(), this.roomName);

    log.trace("receiveVideoFrom ---->> USER {}: SdpOffer for {} is {}", this.name, sender.getName(), sdpOffer);

    final String ipSdpAnswer = this.getEndpointForUser(sender).processOffer(sdpOffer);
    final JsonObject scParams = new JsonObject();
    scParams.addProperty("id", "receiveVideoAnswer");
    scParams.addProperty("name", sender.getName());
    scParams.addProperty("sdpAnswer", ipSdpAnswer);

    log.trace("receiveVideoFrom ---->>  USER {}: SdpAnswer for {} is {}", this.name, sender.getName(), ipSdpAnswer);
    this.sendMessage(scParams);
    log.debug("getEndpointForUser ---->>  gather candidates");
    this.getEndpointForUser(sender).gatherCandidates();
  }

  /**
   * 用来恢复与每一个用户相关的Kurento WebRTC端点。
   *
   * 获取正确的端点来接收视频
   * @param sender
   * @return
   */
  private WebRtcEndpoint getEndpointForUser(final GroupUserSession sender) {
    if (sender.getName().equals(name)) {
      log.debug("getEndpointForUser ---->> PARTICIPANT {}: configuring loopback", this.name);
      return outgoingMedia;
    }

    log.debug("getEndpointForUser ---->> PARTICIPANT {}: receiving video from {}", this.name, sender.getName());

    WebRtcEndpoint incoming = incomingMedia.get(sender.getName());
    if (incoming == null) {
      log.debug("PARTICIPANT {}: creating new endpoint for {}", this.name, sender.getName());
      incoming = new WebRtcEndpoint.Builder(pipeline).build();

      incoming.addIceCandidateFoundListener(new EventListener<IceCandidateFoundEvent>() {

        @Override
        public void onEvent(IceCandidateFoundEvent event) {
          JsonObject response = new JsonObject();
          response.addProperty("id", "iceCandidate");
          response.addProperty("name", sender.getName());
          response.add("candidate", JsonUtils.toJsonObject(event.getCandidate()));
          try {
            synchronized (session) {
              session.sendMessage(new TextMessage(response.toString()));
            }
          } catch (IOException e) {
            log.debug(e.getMessage());
          }
        }
      });

      incomingMedia.put(sender.getName(), incoming);
    }

    log.debug("getEndpointForUser ---->> PARTICIPANT {}: obtained endpoint for {}", this.name, sender.getName());
    sender.getOutgoingWebRtcPeer().connect(incoming);

    return incoming;
  }

  public void cancelVideoFrom(final GroupUserSession sender) {
    this.cancelVideoFrom(sender.getName());
  }

  public void cancelVideoFrom(final String senderName) {
    log.debug("PARTICIPANT {}: canceling video reception from {}", this.name, senderName);
    final WebRtcEndpoint incoming = incomingMedia.remove(senderName);

    log.debug("PARTICIPANT {}: removing endpoint for {}", this.name, senderName);
    incoming.release(new Continuation<Void>() {
      @Override
      public void onSuccess(Void result) throws Exception {
        log.trace("PARTICIPANT {}: Released successfully incoming EP for {}",
            GroupUserSession.this.name, senderName);
      }

      @Override
      public void onError(Throwable cause) throws Exception {
        log.warn("PARTICIPANT {}: Could not release incoming EP for {}", GroupUserSession.this.name,
            senderName);
      }
    });
  }

  @Override
  public void close() throws IOException {
    log.debug("PARTICIPANT {}: Releasing resources", this.name);
    for (final String remoteParticipantName : incomingMedia.keySet()) {

      log.trace("PARTICIPANT {}: Released incoming EP for {}", this.name, remoteParticipantName);

      final WebRtcEndpoint ep = this.incomingMedia.get(remoteParticipantName);

      ep.release(new Continuation<Void>() {

        @Override
        public void onSuccess(Void result) throws Exception {
          log.trace("PARTICIPANT {}: Released successfully incoming EP for {}",
              GroupUserSession.this.name, remoteParticipantName);
        }

        @Override
        public void onError(Throwable cause) throws Exception {
          log.warn("PARTICIPANT {}: Could not release incoming EP for {}", GroupUserSession.this.name,
              remoteParticipantName);
        }
      });
    }

    outgoingMedia.release(new Continuation<Void>() {

      @Override
      public void onSuccess(Void result) throws Exception {
        log.trace("PARTICIPANT {}: Released outgoing EP", GroupUserSession.this.name);
      }

      @Override
      public void onError(Throwable cause) throws Exception {
        log.warn("USER {}: Could not release outgoing EP", GroupUserSession.this.name);
      }
    });
  }

  public void sendMessage(JsonObject message) throws IOException {
    log.debug("sendMessage ---->>  USER {}: Sending message {}", name, message);

    if(!session.isOpen()){
        return;
    }
    synchronized (session) {
      session.sendMessage(new TextMessage(message.toString()));
    }
  }

  public void addCandidate(IceCandidate candidate, String name) {
    if (this.name.compareTo(name) == 0) {
      outgoingMedia.addIceCandidate(candidate);
    } else {
      WebRtcEndpoint webRtc = incomingMedia.get(name);
      if (webRtc != null) {
        webRtc.addIceCandidate(candidate);
      }
    }
  }

  /*
   * (non-Javadoc)
   *
   * @see java.lang.Object#equals(java.lang.Object)
   */
  @Override
  public boolean equals(Object obj) {

    if (this == obj) {
      return true;
    }
    if (obj == null || !(obj instanceof GroupUserSession)) {
      return false;
    }
    GroupUserSession other = (GroupUserSession) obj;
    boolean eq = name.equals(other.name);
    eq &= roomName.equals(other.roomName);
    return eq;
  }

  /*
   * (non-Javadoc)
   *
   * @see java.lang.Object#hashCode()
   */
  @Override
  public int hashCode() {
    int result = 1;
    result = 31 * result + name.hashCode();
    result = 31 * result + roomName.hashCode();
    return result;
  }
}
