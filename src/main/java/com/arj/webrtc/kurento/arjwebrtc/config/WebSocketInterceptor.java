package com.arj.webrtc.kurento.arjwebrtc.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

import java.util.Map;

public class WebSocketInterceptor extends HttpSessionHandshakeInterceptor {
    /**
     * 配置日志
     */
    private final static Logger logger = LoggerFactory.getLogger(WebSocketInterceptor.class);

    @Override
    public boolean beforeHandshake(ServerHttpRequest serverHttpRequest, ServerHttpResponse seHttpResponse,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
//		HttpServletRequest request = ((ServletServerHttpRequest) serverHttpRequest).getServletRequest();
        //String userName = serverHttpRequest.getURI().toString().split("useid")[1];
      //  attributes.put("userName", userName);
        logger.info("握手之前");
        //从request里面获取对象，存放attributes
        return super.beforeHandshake(serverHttpRequest, seHttpResponse, wsHandler, attributes);
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler,
                               Exception ex) {
        logger.info("握手之后");
        super.afterHandshake(request, response, wsHandler, ex);
    }
}
