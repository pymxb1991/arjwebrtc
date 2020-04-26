package com.arj.webrtc.kurento.arjwebrtc.util;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

public class Tool {

  	/**
  	 * 方法说明：http get 数据获取
  	 *
  	 * @param Url
  	 * @return 
  	 * @修改描述：
  	 * @其他：
  	 */
	public static String getRestReturn(String Url){
		StringBuffer strBuffer = new StringBuffer();
		BufferedReader brd =null;
		HttpURLConnection connet = null;
        try {
			URL url = new URL(Url);
			  //实例一个HTTP CONNECT
			  connet = (HttpURLConnection) url.openConnection();
			  connet.setRequestMethod("GET");
			  connet.setDoOutput(true);
			  connet.setDoInput(true);
			  connet.setUseCaches(false);
			  connet.setConnectTimeout(300000);
			  connet.setReadTimeout(300000);
			  connet.connect();
			  if(connet.getResponseCode() != 200){
			      throw new IOException(connet.getResponseMessage());
			  }
			  //将返回的值存入到String中
			  brd = new BufferedReader(new InputStreamReader(connet.getInputStream(),"utf8"));
			  String line=brd.readLine();
			  while(line != null){
				  line = java.net.URLDecoder.decode(line, "UTF-8");
				  strBuffer.append(line);
				  line = brd.readLine();
			  }
		} catch (MalformedURLException e) {
			return null;
		} catch (IOException e) {
			return null;
		} finally {
			if(brd !=null){
				 try {
					 brd.close();
				 } catch (IOException e) {
					 
				 }
			}
			if(connet!=null){
				connet.disconnect();
			}
		}
        return strBuffer.toString();
    }
	

  	/**
  	 * 方法说明：http post 
  	 *
  	 * @param Url
  	 * @return 
  	 * @修改描述：
  	 * @其他：
  	 */
	public static String postRestReturn(String Url) throws IOException {
		URL url1 = new URL(Url);
		HttpURLConnection urlConnection = (HttpURLConnection)url1.openConnection();
		urlConnection.setRequestMethod("POST");
		urlConnection.setDoOutput(true);
		urlConnection.setDoInput(true);
		urlConnection.setUseCaches(false);
		urlConnection.setConnectTimeout(30000);
		urlConnection.setReadTimeout(60000);
		InputStream in1 = urlConnection.getInputStream();
		BufferedReader bufferedReader1 = new BufferedReader(new InputStreamReader(in1, "utf8"));
		StringBuffer temp1 = new StringBuffer();
		String line1 = bufferedReader1.readLine();
		while (line1 != null) {
			line1 = java.net.URLDecoder.decode(line1, "UTF-8");
			temp1.append(line1);
			line1 = bufferedReader1.readLine();
		}
		bufferedReader1.close();
		return temp1.toString();
	}
	
	/**
	 * POST方式向指定URL发送数据方法
	 * 
	 * @param url   指定的接收数据的地址(最后不加?)
	 * @param param 发送的数据(不带有?,直接就是key1=value1&key2=value2格式)
	 * @return 所代表远程资源的响应结果
	 */
	public static String sendPost(String url, String param) {
		OutputStreamWriter out = null;
		BufferedReader in = null;
		HttpURLConnection conn = null;
		String result = "";
		try {
			URL realUrl = new URL(url);
			conn = (HttpURLConnection) realUrl.openConnection();
			// 打开和URL之间的连接
			// 发送POST请求必须设置如下两行
			conn.setDoOutput(true);
			conn.setDoInput(true);
			conn.setRequestMethod("POST"); // POST方法
			// 设置通用的请求属性
			conn.setRequestProperty("accept", "*/*");
			conn.setRequestProperty("connection", "Keep-Alive");
			conn.setRequestProperty("user-agent", "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1;SV1)");
			conn.setRequestProperty("Content-Type", "application/json");
			conn.connect();
			// 获取URLConnection对象对应的输出流
			out = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
			// 发送请求参数
			out.write(param);
			// flush输出流的缓冲
			out.flush();
			// 定义BufferedReader输入流来读取URL的响应
			if (conn.getResponseCode() == 200) {
				in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
				String line;
				while ((line = in.readLine()) != null) {
					result += line;
				}
			} else {
				return null;
			}
		} catch (Exception e) {
			System.out.println("发送 POST 请求出现异常！" + e);
			e.printStackTrace();
			return null;
		}
		// 使用finally块来关闭输出流、输入流
		finally {
			try {
				if (out != null) {
					out.close();
				}
				if (in != null) {
					in.close();
				}
				if (conn != null) {
					conn.disconnect();
				}
			} catch (IOException ex) {
				ex.printStackTrace();
			}
		}
		return result;
	}
}
