package com.arj.webrtc.kurento.arjwebrtc.room;

import java.io.Serializable;

/**
 * This is Description
 *
 * @author Mr.Mao
 * @date 2020/04/09
 */
public class RoomVO implements Serializable {
    private static final long serialVersionUID = -5196272347001524471L;

    private String userId;
    private String groupId;
    private String type;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getGroupId() {
        return groupId;
    }

    public void setGroupId(String groupId) {
        this.groupId = groupId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}