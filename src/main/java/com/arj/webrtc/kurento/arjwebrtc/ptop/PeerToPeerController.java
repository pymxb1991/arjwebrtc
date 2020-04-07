
package com.arj.webrtc.kurento.arjwebrtc.ptop;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;



/**
 * This is Description
 *
 * @author Mr.Mao
 * @date 2020/04/06
 */


@Controller
public class PeerToPeerController {

    @RequestMapping("test")
    public String test(){
        return  "test";
    }

    /**
     * 增加peerToPeer 入口之后，无论是static 下面的peerToPeer.html还是
     * templates下面的peerToPeer.html 都将会报错，具体情况暂不清楚
     * 所以暂时不可以开户入口，
     * 问题应该是出在 thymeleaf 模板上面
     * @return
     */
   /* @RequestMapping("peerToPeer")
    public String peerToPeer(){
        return  "peerToPeer";
    }*/
}

