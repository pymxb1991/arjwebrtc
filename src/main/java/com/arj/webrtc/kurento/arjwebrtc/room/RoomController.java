package com.arj.webrtc.kurento.arjwebrtc.room;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class RoomController {

    @RequestMapping(value = "/room")
    public String  roomIndex(String userId, String userName, String groupId,String groupName,String type, Model model){
        System.out.println("userId: "+ userId);
        System.out.println("userName: "+ userName);
        System.out.println("groupId: "+ groupId);
        System.out.println("groupName: "+ groupName);
        System.out.println("type: "+ type);

        model.addAttribute("userId", userId);
        model.addAttribute("userName", userName);
        model.addAttribute("groupId", groupId);
        model.addAttribute("groupName", groupName);
        model.addAttribute("type", type);

        return "/room/room";
    }
}
