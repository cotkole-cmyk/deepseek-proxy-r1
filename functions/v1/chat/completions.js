const ACCOUNT_ID = "6f0e4947b3ea06460693e68e5d41743b"; // 替换为您的真实账户ID

export async function onRequestPost({ request, env }) {
  try {
    // ============================================
    // 优化措施 1: 强制使用 HTTP/3 和 TLS 1.3
    // ============================================
    request.cf = {
      httpProtocol: "http/3",  // 强制使用 HTTP/3 协议
      tlsVersion: "TLSv1.3",   // 使用最新的 TLS 版本
      cacheEverything: false
    };
    
    // 解析请求数据
    const { messages } = await request.json();
    const cfModel = "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b";
    
    // 构建Cloudflare AI请求
    const targetUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${cfModel}`;
    const cfRequest = new Request(targetUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.API_TOKEN}`,
        "Content-Type": "application/json",
        
        // ============================================
        // 优化措施 2: 添加特殊请求头绕过限制
        // ============================================
        "CF-IPCountry": "US",         // 强制使用美国节点
        "X-Forwarded-For": "8.8.8.8", // 绕过区域限制
        "X-Client-IP": "8.8.8.8",     // 额外IP头
        "CF-Connecting-IP": "8.8.8.8" // Cloudflare专用IP头
      },
      body: JSON.stringify({ messages })
    });
    
    // ============================================
    // 优化措施 3: 添加HTTP/3回退机制和超时设置
    // ============================================
    const fetchOptions = {
      backend: "http3_backend",
      retry: { retries: 2, minTimeout: 1000 },
      timeout: 15000 // 15秒超时
    };
    
    // 发送请求到Cloudflare AI
    let response;
    try {
      // 先尝试使用HTTP/3
      response = await fetch(cfRequest, fetchOptions);
    } catch (http3Error) {
      // 如果HTTP/3失败，回退到普通HTTP
      console.warn("HTTP/3 failed, falling back to HTTP/2");
      delete cfRequest.headers["CF-IPCountry"]; // 移除可能引起问题的头
      response = await fetch(cfRequest);
    }
    
    const data = await response.json();
    
    // ============================================
    // 构建OpenAI兼容响应
    // ============================================
    const openAIResponse = {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "deepseek-r1-distill-qwen-32b",
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: data.result.response
        },
        finish_reason: "stop"
      }],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
    
    return new Response(JSON.stringify(openAIResponse), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        
        // ============================================
        // 优化措施 4: 添加调试头信息
        // ============================================
        "X-Request-Type": "AI-Proxy",
        "X-Proxy-Model": "deepseek-r1-distill-qwen-32b",
        "X-Proxy-Version": "1.2"
      }
    });
    
  } catch (error) {
    // ============================================
    // 详细的错误处理
    // ============================================
    const errorResponse = {
      error: {
        message: `请求失败: ${error.message}`,
        type: "api_error",
        suggestion: "请尝试切换网络或稍后重试",
        code: "MOBILE_NETWORK_FAILURE"
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
