package com.arj.webrtc.kurento.arjwebrtc.room;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class RoomController {

    @RequestMapping(value = "/room")
    public String  roomIndex(){
        return "/room/room";
    }
}
