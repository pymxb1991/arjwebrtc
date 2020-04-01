package com.arj.webrtc.kurento.arjwebrtc.helloWorld.entity;

import java.io.Serializable;

public class hello  implements Serializable {


    private static final long serialVersionUID = 2423711927173204668L;
    private String name;

    public hello() {
    }

    public hello(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

}
