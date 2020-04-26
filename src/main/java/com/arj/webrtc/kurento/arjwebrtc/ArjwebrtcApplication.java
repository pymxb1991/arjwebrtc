package com.arj.webrtc.kurento.arjwebrtc;

import com.arj.webrtc.kurento.arjwebrtc.config.WebSocketInterceptor;
import com.arj.webrtc.kurento.arjwebrtc.ptop.CallHandler;
import com.arj.webrtc.kurento.arjwebrtc.ptop.UserRegistry;
import com.arj.webrtc.kurento.arjwebrtc.room.GroupCallHandler;
import com.arj.webrtc.kurento.arjwebrtc.room.GroupUserRegistry;
import com.arj.webrtc.kurento.arjwebrtc.room.RoomManager;
import org.kurento.client.KurentoClient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

//import org.springframework.boot.web.support.SpringBootServletInitializer;

@SpringBootApplication
@EnableWebSocket
public class ArjwebrtcApplication  extends SpringBootServletInitializer implements WebSocketConfigurer  {
    public static void main(String[] args) {
        SpringApplication.run(ArjwebrtcApplication.class, args);
    }

    /**************************/
    @Bean
    public CallHandler callHandler() {
        return new CallHandler();
    }

    @Bean
    public UserRegistry registry() {
        return new UserRegistry();
    }

    /**************************/
    @Bean
    public GroupCallHandler groupCallHandler() {
        return new GroupCallHandler();
    }

    @Bean
    public GroupUserRegistry GroupRegistry() {
        return new GroupUserRegistry();
    }
    @Bean
    public RoomManager roomManager() {
        return new RoomManager();
    }
    @Bean
    public KurentoClient kurentoClient() {
        // return KurentoClient.create("ws://95.169.9.32:8080/kurento");
        return KurentoClient.create("ws://192.168.1.16:8888/kurento");
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
         registry.addHandler(callHandler(), "/call").setAllowedOrigins("*").addInterceptors(new WebSocketInterceptor());
         registry.addHandler(groupCallHandler(), "/groupcall").setAllowedOrigins("*").addInterceptors(new WebSocketInterceptor());
    }
    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(ArjwebrtcApplication.class);
    }
}
