package com.arj.webrtc.kurento.arjwebrtc;

import java.util.HashMap;
import java.util.Map;

public class mapTest {

        public static void main(String[] args) {

            Map<String,String> map = new HashMap<String, String>();
           // 0: Total: 2 'real' addresses discovered


            map.put("xiaocui1","gongchen");
            map.put("xiaocui2","daima");
            map.put("xiaocui3","xuexi");
            map.put("xiaocui4","dagong");

            System.out.println(map.keySet());
            String x = map.get("x");
            String remove = map.remove(x);
            System.out.println(x);
            System.out.println(remove);
            System.out.println("-----分割线-----");
            for(String map1 : map.keySet()){
                String string = map.keySet().toString();
                System.out.println(string);
            }
            System.out.println(map.keySet().contains("xiaocui4"));
        }

}
