// 强制使用 HTTP/3 和 TLS 1.3
export async function onRequestPost({ request, env }) {
  try {
    // 添加 HTTP/3 支持
    request.cf = {
      httpProtocol: "http/3",
      tlsVersion: "TLSv1.3",
      cacheEverything: false
    };
    // 其余代码保持不变...
// 注意：将 YOUR_ACCOUNT_ID 替换为您的真实账户ID
const ACCOUNT_ID = "e60a2eebae4f96fba50cb5c2cc370ed16df6f";

export async function onRequestPost({ request, env }) {
  try {
    const { messages } = await request.json();
    const cfModel = "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b";
    const targetUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${cfModel}`;
    
    const cfRequest = new Request(targetUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });
    
    const response = await fetch(cfRequest);
    const data = await response.json();
    
    const openAIResponse = {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "deepseek-r1-distill-qwen-32b",
      choices: [{
        message: {
          role: "assistant",
          content: data.result.response
        }
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
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        message: `Request failed: ${error.message}`,
        type: "api_error"
      }
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
