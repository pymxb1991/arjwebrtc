package com.arj.webrtc.kurento.arjwebrtc;


/*@RunWith(SpringRunner.class)
@SpringBootTest*/
public class ArjwebrtcApplicationTests {


  /*  @Test
    public void setRedisInfo() throws IOException, ClassNotFoundException {
      *//*  // 将用户信息放到缓存中
        hello hello = new hello("mao");
        Jedis jedis = JedisPoolUtils.getJedis();
        jedis.set("c",SerializeUtils.objectSerialiable(hello));
        System.out.println(jedis.get("c"));
        hello o =  (hello)SerializeUtils.objectDeserialization(jedis.get("c"));
        System.out.println(o.getName());
        //Assert.assertEquals("maoxb", SerializeUtils.serializeToObject(redisUtil.get("name")));*//*
    }*/
   /* @Test
    public void setRedis() {
        // 将用户信息放到缓存中
        redisDao.set("b","---b");
        redisDao.get("b");
        System.out.println(redisDao.get("b"));
        //Assert.assertEquals("maoxb", SerializeUtils.serializeToObject(redisUtil.get("name")));
    }*/
/*    @Test
    public void register(UserSession user) {
        redisUtil.set(user.getName(),user);
        redisUtil.set(user.getSession().getId(), user);
        // usersByName.put(user.getName(), user);
        // usersBySessionId.put(user.getSession().getId(), user);
    }*/
}
