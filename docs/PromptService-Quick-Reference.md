# PromptService API 快速参考

## 接口概览

| 接口 | 方法 | 功能 | 返回类型 |
|------|------|------|----------|
| `/v1/prompt/generateprompttemplateparameters` | POST | 生成提示词模板参数 | JSON |
| `/v1/prompt/optimize-function-calling` | POST | 优化Function Calling提示词 | SSE流 | 
| `/v1/prompt/optimizeimageprompt` | POST | 优化图像提示词 | SSE流 |
| `/v1/prompt/generate` | POST | 生成/优化通用提示词 | SSE流 |

## 认证要求

```http
Api-Key: {openai_api_key_or_system_api_key}
Content-Type: application/json
```

**说明**：
- 支持系统API Key（以sk-开头）和直接的OpenAI API Key
- 系统API Key会在后端自动映射到对应的OpenAI API Key

## 快速开始

### JavaScript

```javascript
// 原生fetch API使用示例
const apiKey = 'your-openai-api-key-or-sk-system-key';

// 1. 生成模板参数
async function generateTemplateParameters(prompt) {
  const response = await fetch('/v1/prompt/generateprompttemplateparameters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// 2. 优化提示词（流式处理）
async function generatePrompt(data) {
  const response = await fetch('/v1/prompt/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const eventData = JSON.parse(line.substring(6));
        if (eventData.type === 'message') {
          console.log(eventData.message);
        }
      }
    }
  }
}

// 3. 优化Function Calling
async function optimizeFunctionCalling(prompt, requirements) {
  const data = { prompt, requirements };
  const response = await fetch('/v1/prompt/optimize-function-calling', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(data)
  });
  
  // 处理流式响应...
  // （参考完整文档中的流处理代码）
}

// 4. 优化图像提示词
async function optimizeImagePrompt(prompt, requirements) {
  const data = { prompt, requirements };
  const response = await fetch('/v1/prompt/optimizeimageprompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(data)
  });
  
  // 处理流式响应...
  // （参考完整文档中的流处理代码）
}

// 使用示例
generateTemplateParameters("写一篇AI文章")
  .then(params => console.log('模板参数:', params))
  .catch(error => console.error('生成失败:', error));

generatePrompt({
  prompt: "写文章",
  requirements: "更专业",
  enableDeepReasoning: true
}).catch(error => console.error('优化失败:', error));
```

### C#

```csharp
var client = new PromptClient(httpClient, apiKey);

// 1. 生成模板参数
var parameters = await client.GenerateTemplateParametersAsync("写一篇AI文章");

// 2. 优化提示词（需要处理SSE流）
await client.GeneratePromptAsync(new GeneratePromptInput 
{
    Prompt = "写文章",
    Requirements = "更专业",
    EnableDeepReasoning = true
});

// 3. 优化Function Calling
await client.OptimizeFunctionCallingAsync(new OptimizeFunctionCallingInput
{
    Prompt = "调用天气API", 
    Requirements = "更精确"
});

// 4. 优化图像提示词
await client.OptimizeImagePromptAsync("可爱的猫咪", "增加艺术风格");
```

## 流式响应处理

### 事件类型

| 类型 | 说明 |
|------|------|
| `message` | 主要生成内容 |
| `deep-reasoning-start` | 深度推理开始 |
| `deep-reasoning` | 深度推理内容 |
| `deep-reasoning-end` | 深度推理结束 |

### JavaScript处理示例

```javascript
// 完整的流式响应处理示例
async function processStreamResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '' || !trimmedLine.startsWith('data: ')) continue;

        const dataContent = trimmedLine.substring(6);
        if (dataContent === '[DONE]') break;

        try {
          const eventData = JSON.parse(dataContent);
          
          switch (eventData.type) {
            case 'message':
              result += eventData.message;
              console.log('生成内容:', eventData.message);
              break;
            case 'deep-reasoning':
              console.log('推理过程:', eventData.message);
              break;
          }
        } catch (parseError) {
          console.warn('解析数据失败:', parseError.message);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return result;
}

// 使用示例
fetch('/v1/prompt/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api-key': apiKey
  },
  body: JSON.stringify({
    prompt: "写文章",
    requirements: "更专业"
  })
}).then(response => {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return processStreamResponse(response);
}).then(result => {
  console.log('最终结果:', result);
}).catch(error => {
  console.error('请求失败:', error);
});
```

## 常用参数

### 聊天模型选项
- `gpt-4` (推荐)
- `gpt-3.5-turbo`
- `claude-sonnet-4-20250514`

### 深度推理
启用 `enableDeepReasoning: true` 可获得：
- 更详细的分析过程
- 更高质量的结果
- 更长的响应时间

## 错误处理

```javascript
// 完整的错误处理示例
async function callAPIWithErrorHandling(apiFunction) {
  try {
    const result = await apiFunction();
    return result;
  } catch (error) {
    if (error.message.includes('401')) {
      console.error('未授权 - 检查API密钥');
    } else if (error.message.includes('400')) {
      console.error('请求参数错误:', error.message);
    } else if (error.message.includes('500')) {
      console.error('服务器错误:', error.message);
    } else {
      console.error('其他错误:', error.message);
    }
    throw error;
  }
}

// 带重试机制的API调用
async function callWithRetry(apiFunction, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      console.warn(`尝试 ${attempt}/${maxRetries} 失败:`, error.message);
      
      if (attempt === maxRetries || error.message.includes('401')) {
        throw error;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// 使用示例
callWithRetry(async () => {
  return await generateTemplateParameters("测试提示词");
}).then(result => {
  console.log('成功:', result);
}).catch(error => {
  console.error('最终失败:', error);
});
```

## 性能建议

1. **超时设置**: 流式接口建议设置60秒超时
2. **深度推理**: 仅在需要高质量结果时启用
3. **错误重试**: 实现指数退避重试机制
4. **连接复用**: 复用HttpClient实例

## 完整文档

详细的API文档请参考: [PromptService-API.md](./PromptService-API.md) 