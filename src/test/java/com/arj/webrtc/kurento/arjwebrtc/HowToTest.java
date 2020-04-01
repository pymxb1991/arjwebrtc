package com.arj.webrtc.kurento.arjwebrtc;

import redis.clients.jedis.Jedis;

public class HowToTest {

    public static void main(String[] args) {
        Jedis jedis = null;
        try {
            jedis = new Jedis("192.168.1.177", 6379);
            jedis.auth("123456");
            jedis.set("myname", "Yi1");
            String rs = jedis.get("myname");
            System.out.println(rs);
        } finally {
            if (jedis != null) {
                jedis.close();
            }
        }
    }
}
