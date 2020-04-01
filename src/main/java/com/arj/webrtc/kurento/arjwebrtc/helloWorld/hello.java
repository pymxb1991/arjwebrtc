package com.arj.webrtc.kurento.arjwebrtc.helloWorld;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/hello")
public class hello {

    @RequestMapping(value = "/world")
    public String helloWorld(){
        return "hello - World !";
    }
}
