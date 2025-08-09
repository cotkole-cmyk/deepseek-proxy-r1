export async function onRequestGet() {
  const modelList = {
    "object": "list",
    "data": [
      {
        "id": "deepseek-r1-distill-qwen-32b",
        "object": "model",
        "created": 1686935000,
        "owned_by": "deepseek-ai",
        "permission": []
      }
    ]
  };

  return new Response(JSON.stringify(modelList), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
