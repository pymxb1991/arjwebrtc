
package com.arj.webrtc.kurento.arjwebrtc.room.entity;

import java.io.Serializable;

/**
 * 房间用户信息Entity
 * @author m
 * @version 2020-04-23
 */
public class RoomUserRel implements Serializable {

	private static final long serialVersionUID = 233007889396655754L;

	private String id;
	private String groupId;		// 房间号
	private String userId;		// 用户ID

	public RoomUserRel() {
	}

	public RoomUserRel(String groupId, String userId) {
		this.groupId = groupId;
		this.userId = userId;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getGroupId() {
		return groupId;
	}

	public void setGroupId(String groupId) {
		this.groupId = groupId;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}
}