package com.arj.webrtc.kurento.arjwebrtc.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

/**
 * 静态资源配置类
 *
 * @author Mr.Mao
 * @date 2020/04/06
 */
@Configuration
public class WebAppMvcConfig  extends WebMvcConfigurerAdapter {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/static/**").addResourceLocations("classpath:/static/");
        super.addResourceHandlers(registry);
    }
}