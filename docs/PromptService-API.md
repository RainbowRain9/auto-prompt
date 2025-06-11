# PromptService API 文档

## 概述

PromptService 提供了一系列提示词生成和优化的API接口，支持普通提示词优化、Function Calling优化、图像提示词优化以及提示词模板参数生成。

**基础URL**: `/v1/prompt`

## 认证

所有接口都需要在请求头中包含API密钥：

```
Headers:
- api-key: {openai_api_key_or_system_api_key}
- Content-Type: application/json
```

**说明**：
- 如果使用以`sk-`开头的系统API Key，系统会在数据库中查找对应的OpenAI API Key
- 如果直接提供OpenAI API Key，则直接使用该密钥调用OpenAI服务

## 接口列表

### 1. 生成提示词模板参数

**接口地址**: `POST /v1/prompt/generateprompttemplateparameters`

**功能描述**: 根据输入的提示词自动生成标题、描述和标签等模板参数。

#### 请求参数

```json
{
  "prompt": "string" // 原始提示词内容
}
```

#### 响应参数

```json
{
  "title": "string",        // 生成的标题
  "description": "string",  // 生成的描述
  "tags": "string"         // JSON数组格式的标签字符串
}
```

#### JavaScript 请求示例

```javascript
// 完整的原生fetch请求示例
async function generateTemplateParameters(prompt, apiKey) {
  try {
    const response = await fetch('/v1/prompt/generateprompttemplateparameters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({ 
        prompt: prompt 
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        // 处理未授权错误
        console.error('未授权访问，请检查API密钥');
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('生成的参数:', result);
    return result;
  } catch (error) {
    console.error('请求失败:', error.message);
    throw error;
  }
}

// 使用示例
const apiKey = 'your-openai-api-key-or-sk-system-key';
generateTemplateParameters("写一个关于人工智能的文章", apiKey)
  .then(result => {
    console.log('标题:', result.title);
    console.log('描述:', result.description);
    console.log('标签:', result.tags);
  })
  .catch(error => {
    console.error('调用失败:', error);
  });
```

#### C# 请求示例

```csharp
using System.Text;
using System.Text.Json;

public class PromptClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public PromptClient(HttpClient httpClient, string apiKey)
    {
        _httpClient = httpClient;
        _apiKey = apiKey;
    }

    public async Task<PromptTemplateParameterDto> GenerateTemplateParametersAsync(string prompt)
    {
        var request = new { prompt };
        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("api-key", _apiKey);

        var response = await _httpClient.PostAsync("/v1/prompt/generateprompttemplateparameters", content);
        
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"HTTP {response.StatusCode}: {response.ReasonPhrase}");
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<PromptTemplateParameterDto>(responseJson);
    }
}

// DTO定义
public class PromptTemplateParameterDto
{
    public string Title { get; set; }
    public string Description { get; set; }
    public string Tags { get; set; }
}
```

---

### 2. 优化Function Calling提示词

**接口地址**: `POST /v1/prompt/optimize-function-calling`

**功能描述**: 优化Function Calling相关的提示词，支持深度推理模式。

#### 请求参数

```json
{
  "prompt": "string",              // 原始Function Calling提示词
  "requirements": "string",        // 优化需求描述
  "chatModel": "string",          // 使用的聊天模型（可选）
  "enableDeepReasoning": boolean  // 是否启用深度推理（可选）
}
```

#### 响应格式

**Content-Type**: `text/event-stream`

流式响应格式（SSE）:

```
data: {"message":"优化后的内容片段","type":"message"}

data: {"type":"deep-reasoning-start"}  // 深度推理开始（仅当enableDeepReasoning=true）
data: {"message":"推理内容","type":"deep-reasoning"}
data: {"type":"deep-reasoning-end"}    // 深度推理结束

data: [DONE]  // 流结束标识
```

#### JavaScript 请求示例

```javascript
// 完整的流式请求处理函数
async function optimizeFunctionCallingPrompt(data, apiKey) {
  try {
    const response = await fetch('/v1/prompt/optimize-function-calling', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('未授权访问，请检查API密钥');
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 检查是否为SSE流
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/event-stream')) {
      throw new Error('响应不是有效的SSE流');
    }

    // 获取可读流
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let result = '';
    let deepReasoningContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码数据并添加到缓冲区
        buffer += decoder.decode(value, { stream: true });
        
        // 按行分割处理
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // 空行跳过
          if (trimmedLine === '') continue;
          
          // 处理SSE数据行
          if (trimmedLine.startsWith('data: ')) {
            const dataContent = trimmedLine.substring(6);
            
            // 检查是否为结束标识
            if (dataContent === '[DONE]') {
              console.log('流式响应完成');
              break;
            }
            
            try {
              const eventData = JSON.parse(dataContent);
              
              switch (eventData.type) {
                case 'deep-reasoning-start':
                  console.log('开始深度推理...');
                  break;
                case 'deep-reasoning':
                  deepReasoningContent += eventData.message;
                  console.log('推理内容:', eventData.message);
                  break;
                case 'deep-reasoning-end':
                  console.log('深度推理完成');
                  break;
                case 'message':
                  result += eventData.message;
                  console.log('优化内容:', eventData.message);
                  break;
              }
            } catch (parseError) {
              console.warn('解析SSE数据失败:', parseError.message);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      result: result,
      deepReasoning: deepReasoningContent
    };
  } catch (error) {
    console.error('请求失败:', error.message);
    throw error;
  }
}

// 使用示例
async function example() {
  const data = {
    prompt: "调用天气API获取北京天气",
    requirements: "让提示词更加精确和专业",
    chatModel: "gpt-4",
    enableDeepReasoning: true
  };

  const apiKey = 'your-openai-api-key-or-sk-system-key';

  try {
    const result = await optimizeFunctionCallingPrompt(data, apiKey);
    console.log('最终结果:', result.result);
    console.log('推理过程:', result.deepReasoning);
  } catch (error) {
    console.error('优化失败:', error);
  }
}

// 调用示例
example();
```

#### C# 请求示例

```csharp
public async Task OptimizeFunctionCallingAsync(OptimizeFunctionCallingInput input)
{
    var json = JsonSerializer.Serialize(input);
    var content = new StringContent(json, Encoding.UTF8, "application/json");

    _httpClient.DefaultRequestHeaders.Clear();
    _httpClient.DefaultRequestHeaders.Add("api-key", _apiKey);

    var response = await _httpClient.PostAsync("/v1/prompt/optimize-function-calling", content);
    
    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException($"HTTP {response.StatusCode}: {response.ReasonPhrase}");
    }

    using var stream = await response.Content.ReadAsStreamAsync();
    using var reader = new StreamReader(stream);
    
    string line;
    while ((line = await reader.ReadLineAsync()) != null)
    {
        if (line.StartsWith("data: ") && line != "data: [DONE]")
        {
            var eventData = line.Substring(6);
            var sseEvent = JsonSerializer.Deserialize<SseEvent>(eventData);
            
            switch (sseEvent.Type)
            {
                case "deep-reasoning-start":
                    Console.WriteLine("开始深度推理...");
                    break;
                case "deep-reasoning":
                    Console.WriteLine($"推理内容: {sseEvent.Message}");
                    break;
                case "deep-reasoning-end":
                    Console.WriteLine("深度推理完成");
                    break;
                case "message":
                    Console.WriteLine($"优化内容: {sseEvent.Message}");
                    break;
            }
        }
    }
}

// 输入DTO
public class OptimizeFunctionCallingInput
{
    public string Prompt { get; set; }
    public string Requirements { get; set; }
    public string ChatModel { get; set; } = "gpt-4";
    public bool EnableDeepReasoning { get; set; }
}

// SSE事件DTO
public class SseEvent
{
    public string Message { get; set; }
    public string Type { get; set; }
}
```

---

### 3. 优化图像提示词

**接口地址**: `POST /v1/prompt/optimizeimageprompt`

**功能描述**: 专门用于优化图像生成的提示词。

#### 请求参数

```json
{
  "prompt": "string",       // 原始图像提示词
  "requirements": "string"  // 优化需求描述
}
```

#### 响应格式

**Content-Type**: `text/event-stream`

流式响应格式（SSE）:

```
data: {"message":"优化后的内容片段","type":"message"}

data: [DONE]  // 流结束标识
```

#### JavaScript 请求示例

```javascript
// 完整的图像提示词优化函数
async function optimizeImagePrompt(prompt, requirements, apiKey) {
  try {
    const response = await fetch('/v1/prompt/optimizeimageprompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        prompt: prompt,
        requirements: requirements
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('未授权访问，请检查API密钥');
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 检查是否为SSE流
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/event-stream')) {
      throw new Error('响应不是有效的SSE流');
    }

    // 获取可读流
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let result = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码数据并添加到缓冲区
        buffer += decoder.decode(value, { stream: true });
        
        // 按行分割处理
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // 空行跳过
          if (trimmedLine === '') continue;
          
          // 处理SSE数据行
          if (trimmedLine.startsWith('data: ')) {
            const dataContent = trimmedLine.substring(6);
            
            // 检查是否为结束标识
            if (dataContent === '[DONE]') {
              console.log('图像提示词优化完成');
              break;
            }
            
            try {
              const eventData = JSON.parse(dataContent);
              
              if (eventData.type === 'message') {
                result += eventData.message;
                console.log('接收内容:', eventData.message);
              }
            } catch (parseError) {
              console.warn('解析SSE数据失败:', parseError.message);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    console.log('完整结果:', result);
    return result;
  } catch (error) {
    console.error('请求失败:', error.message);
    throw error;
  }
}

// 使用示例
const apiKey = 'your-openai-api-key-or-sk-system-key';

optimizeImagePrompt(
  "一只可爱的猫咪在花园里玩耍",
  "增加更多视觉细节和艺术风格描述",
  apiKey
).then(optimizedPrompt => {
  console.log('优化后的图像提示词:', optimizedPrompt);
}).catch(error => console.error('优化失败:', error));
```

#### C# 请求示例

```csharp
public async Task<string> OptimizeImagePromptAsync(string prompt, string requirements)
{
    var input = new { prompt, requirements };
    var json = JsonSerializer.Serialize(input);
    var content = new StringContent(json, Encoding.UTF8, "application/json");

    _httpClient.DefaultRequestHeaders.Clear();
    _httpClient.DefaultRequestHeaders.Add("api-key", _apiKey);

    var response = await _httpClient.PostAsync("/v1/prompt/optimizeimageprompt", content);
    
    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException($"HTTP {response.StatusCode}: {response.ReasonPhrase}");
    }

    var result = new StringBuilder();
    using var stream = await response.Content.ReadAsStreamAsync();
    using var reader = new StreamReader(stream);
    
    string line;
    while ((line = await reader.ReadLineAsync()) != null)
    {
        if (line.StartsWith("data: ") && line != "data: [DONE]")
        {
            var eventData = line.Substring(6);
            var sseEvent = JsonSerializer.Deserialize<SseEvent>(eventData);
            
            if (sseEvent.Type == "message")
            {
                result.Append(sseEvent.Message);
                Console.WriteLine($"接收内容: {sseEvent.Message}");
            }
        }
    }
    
    return result.ToString();
}
```

---

### 4. 生成/优化提示词

**接口地址**: `POST /v1/prompt/generate`

**功能描述**: 通用的提示词生成和优化接口，支持深度推理模式。

#### 请求参数

```json
{
  "prompt": "string",              // 原始提示词
  "requirements": "string",        // 优化需求描述
  "chatModel": "string",          // 使用的聊天模型（可选）
  "enableDeepReasoning": boolean  // 是否启用深度推理（可选）
}
```

#### 响应格式

**Content-Type**: `text/event-stream`

流式响应格式（SSE）:

```
data: {"message":"优化后的内容片段","type":"message"}

data: {"type":"deep-reasoning-start"}  // 深度推理开始（仅当enableDeepReasoning=true）
data: {"message":"推理内容","type":"deep-reasoning"}
data: {"type":"deep-reasoning-end"}    // 深度推理结束

data: [DONE]  // 流结束标识
```

#### JavaScript 请求示例

```javascript
// 完整的通用提示词优化函数
async function generatePrompt(data, apiKey) {
  try {
    const response = await fetch('/v1/prompt/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('未授权访问，请检查API密钥');
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 检查是否为SSE流
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/event-stream')) {
      throw new Error('响应不是有效的SSE流');
    }

    // 获取可读流
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let result = '';
    let deepReasoningContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码数据并添加到缓冲区
        buffer += decoder.decode(value, { stream: true });
        
        // 按行分割处理
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // 空行跳过
          if (trimmedLine === '') continue;
          
          // 处理SSE数据行
          if (trimmedLine.startsWith('data: ')) {
            const dataContent = trimmedLine.substring(6);
            
            // 检查是否为结束标识
            if (dataContent === '[DONE]') {
              console.log('提示词生成完成');
              break;
            }
            
            try {
              const eventData = JSON.parse(dataContent);
              
              switch (eventData.type) {
                case 'deep-reasoning-start':
                  console.log('开始深度推理分析...');
                  break;
                case 'deep-reasoning':
                  deepReasoningContent += eventData.message;
                  console.log('推理过程:', eventData.message);
                  break;
                case 'deep-reasoning-end':
                  console.log('深度推理完成');
                  break;
                case 'message':
                  result += eventData.message;
                  console.log('生成内容:', eventData.message);
                  break;
              }
            } catch (parseError) {
              console.warn('解析SSE数据失败:', parseError.message);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      result: result,
      deepReasoning: deepReasoningContent
    };
  } catch (error) {
    console.error('请求失败:', error.message);
    throw error;
  }
}

// 使用示例
async function optimizePromptExample() {
  const data = {
    prompt: "写一篇关于人工智能的文章",
    requirements: "让文章更加专业和深入",
    chatModel: "gpt-4",
    enableDeepReasoning: true
  };

  const apiKey = 'your-openai-api-key-or-sk-system-key';

  try {
    const result = await generatePrompt(data, apiKey);
    console.log('推理内容:', result.deepReasoning);
    console.log('最终结果:', result.result);
    return result;
  } catch (error) {
    console.error('生成失败:', error);
    throw error;
  }
}

// 调用示例
optimizePromptExample().then(result => {
  console.log('优化完成:', result);
}).catch(error => {
  console.error('操作失败:', error);
});
```

#### C# 请求示例

```csharp
public async Task<GeneratePromptResult> GeneratePromptAsync(GeneratePromptInput input)
{
    var json = JsonSerializer.Serialize(input);
    var content = new StringContent(json, Encoding.UTF8, "application/json");

    _httpClient.DefaultRequestHeaders.Clear();
    _httpClient.DefaultRequestHeaders.Add("api-key", _apiKey);

    var response = await _httpClient.PostAsync("/v1/prompt/generate", content);
    
    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException($"HTTP {response.StatusCode}: {response.ReasonPhrase}");
    }

    var result = new StringBuilder();
    var deepReasoning = new StringBuilder();
    var isInDeepReasoning = false;

    using var stream = await response.Content.ReadAsStreamAsync();
    using var reader = new StreamReader(stream);
    
    string line;
    while ((line = await reader.ReadLineAsync()) != null)
    {
        if (line.StartsWith("data: ") && line != "data: [DONE]")
        {
            var eventData = line.Substring(6);
            var sseEvent = JsonSerializer.Deserialize<SseEvent>(eventData);
            
            switch (sseEvent.Type)
            {
                case "deep-reasoning-start":
                    isInDeepReasoning = true;
                    Console.WriteLine("开始深度推理分析...");
                    break;
                case "deep-reasoning":
                    deepReasoning.Append(sseEvent.Message);
                    Console.WriteLine($"推理过程: {sseEvent.Message}");
                    break;
                case "deep-reasoning-end":
                    isInDeepReasoning = false;
                    Console.WriteLine("深度推理完成");
                    break;
                case "message":
                    result.Append(sseEvent.Message);
                    Console.WriteLine($"生成内容: {sseEvent.Message}");
                    break;
            }
        }
    }
    
    return new GeneratePromptResult
    {
        Result = result.ToString(),
        DeepReasoning = deepReasoning.ToString()
    };
}

// 输入DTO
public class GeneratePromptInput
{
    public string Prompt { get; set; }
    public string Requirements { get; set; }
    public string ChatModel { get; set; } = "gpt-4";
    public bool EnableDeepReasoning { get; set; }
}

// 结果DTO
public class GeneratePromptResult
{
    public string Result { get; set; }
    public string DeepReasoning { get; set; }
}
```

---

## 错误处理

### 状态码说明

- `200`: 请求成功
- `401`: 未授权访问，缺少有效的API令牌
- `400`: 请求参数错误
- `500`: 服务器内部错误

### 错误响应格式

```json
{
  "message": "错误描述信息",
  "error": "详细错误信息"
}
```

### JavaScript 错误处理示例

```javascript
// 完整的错误处理示例
async function handlePromptAPI(prompt, apiKey) {
  try {
    const result = await generateTemplateParameters(prompt, apiKey);
    
    // 处理成功结果
    console.log('API调用成功:', result);
    return result;
  } catch (error) {
    // 详细的错误处理
    if (error.message.includes('401')) {
      // 处理未授权错误
      console.error('认证失败: 请检查API密钥是否正确');
      alert('API密钥无效或已过期，请检查密钥');
    } else if (error.message.includes('400')) {
      // 处理请求参数错误
      console.error('请求参数错误:', error.message);
      alert('请求参数不正确，请检查输入');
    } else if (error.message.includes('500')) {
      // 处理服务器错误
      console.error('服务器内部错误:', error.message);
      alert('服务器暂时不可用，请稍后重试');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // 处理网络错误
      console.error('网络连接错误:', error.message);
      alert('网络连接失败，请检查网络连接');
    } else {
      // 处理其他未知错误
      console.error('API调用失败:', error.message);
      alert(`操作失败: ${error.message}`);
    }
    
    throw error; // 重新抛出错误供上层处理
  }
}

// 带重试机制的API调用
async function callAPIWithRetry(apiFunction, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      console.warn(`API调用失败 (尝试 ${attempt}/${maxRetries}):`, error.message);
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 如果是认证错误，不进行重试
      if (error.message.includes('401')) {
        throw error;
      }
      
      // 等待一段时间后重试（指数退避）
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

// 使用重试机制的示例
async function robustAPICall() {
  const apiKey = 'your-openai-api-key-or-sk-system-key';
  
  try {
    const result = await callAPIWithRetry(async () => {
      return await generateTemplateParameters("测试提示词", apiKey);
    }, 3, 1000);
    
    console.log('API调用成功:', result);
    return result;
  } catch (error) {
    console.error('多次重试后仍然失败:', error);
    // 可以在这里进行错误上报或其他处理
  }
}
```

### C# 错误处理示例

```csharp
try 
{
    var result = await promptClient.GenerateTemplateParametersAsync(prompt);
    // 处理成功结果
}
catch (HttpRequestException ex) when (ex.Message.Contains("401"))
{
    // 处理未授权错误
    throw new UnauthorizedAccessException("访问被拒绝，请检查API密钥");
}
catch (HttpRequestException ex)
{
    // 处理其他HTTP错误
    throw new Exception($"API调用失败: {ex.Message}");
}
```

## 注意事项

1. **认证方式**: 所有接口只需要提供API密钥（api-key头）
   - 支持系统API Key（以sk-开头）和直接的OpenAI API Key
   - 系统API Key会在后端自动映射到对应的OpenAI API Key
2. **流式响应**: 大部分接口采用SSE（Server-Sent Events）流式响应，需要正确处理流数据
3. **深度推理**: 启用深度推理会增加响应时间，但能提供更高质量的结果
4. **超时设置**: 建议设置适当的超时时间，特别是启用深度推理时
5. **错误重试**: 建议实现适当的错误重试机制

## SDK封装建议

基于以上接口，建议封装统一的SDK以简化调用：

### JavaScript SDK 示例

```javascript
// 完整的JavaScript SDK封装
class PromptSDK {
  constructor(apiKey, baseURL = '') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  // 通用请求方法
  async request(endpoint, data = null, isStream = false) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('未授权访问，请检查API密钥');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (isStream) {
      return response;
    } else {
      return await response.json();
    }
  }

  // 生成提示词模板参数
  async generateTemplateParameters(prompt) {
    return await this.request('/v1/prompt/generateprompttemplateparameters', { prompt });
  }

  // 流式处理辅助方法
  async processStream(response, onData) {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

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
            await onData(eventData);
          } catch (parseError) {
            console.warn('解析SSE数据失败:', parseError.message);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // 优化Function Calling提示词
  async optimizeFunctionCalling(prompt, requirements, options = {}) {
    const data = { 
      prompt, 
      requirements, 
      chatModel: options.chatModel || 'gpt-4',
      enableDeepReasoning: options.enableDeepReasoning || false
    };

    const response = await this.request('/v1/prompt/optimize-function-calling', data, true);
    
    let result = '';
    let deepReasoning = '';

    await this.processStream(response, (eventData) => {
      switch (eventData.type) {
        case 'deep-reasoning-start':
          console.log('开始深度推理...');
          break;
        case 'deep-reasoning':
          deepReasoning += eventData.message;
          if (options.onDeepReasoning) {
            options.onDeepReasoning(eventData.message);
          }
          break;
        case 'deep-reasoning-end':
          console.log('深度推理完成');
          break;
        case 'message':
          result += eventData.message;
          if (options.onMessage) {
            options.onMessage(eventData.message);
          }
          break;
      }
    });

    return { result, deepReasoning };
  }

  // 优化图像提示词
  async optimizeImagePrompt(prompt, requirements, options = {}) {
    const data = { prompt, requirements };
    const response = await this.request('/v1/prompt/optimizeimageprompt', data, true);
    
    let result = '';

    await this.processStream(response, (eventData) => {
      if (eventData.type === 'message') {
        result += eventData.message;
        if (options.onMessage) {
          options.onMessage(eventData.message);
        }
      }
    });

    return result;
  }

  // 生成/优化通用提示词
  async generatePrompt(prompt, requirements, options = {}) {
    const data = { 
      prompt, 
      requirements, 
      chatModel: options.chatModel || 'gpt-4',
      enableDeepReasoning: options.enableDeepReasoning || false
    };

    const response = await this.request('/v1/prompt/generate', data, true);
    
    let result = '';
    let deepReasoning = '';

    await this.processStream(response, (eventData) => {
      switch (eventData.type) {
        case 'deep-reasoning-start':
          console.log('开始深度推理分析...');
          break;
        case 'deep-reasoning':
          deepReasoning += eventData.message;
          if (options.onDeepReasoning) {
            options.onDeepReasoning(eventData.message);
          }
          break;
        case 'deep-reasoning-end':
          console.log('深度推理完成');
          break;
        case 'message':
          result += eventData.message;
          if (options.onMessage) {
            options.onMessage(eventData.message);
          }
          break;
      }
    });

    return { result, deepReasoning };
  }
}

// SDK使用示例
const sdk = new PromptSDK('your-openai-api-key-or-sk-system-key');

// 1. 生成模板参数
sdk.generateTemplateParameters("写一篇AI文章")
  .then(params => console.log('模板参数:', params))
  .catch(error => console.error('生成失败:', error));

// 2. 优化Function Calling（带回调）
sdk.optimizeFunctionCalling(
  "调用天气API",
  "更精确",
  {
    enableDeepReasoning: true,
    onMessage: (message) => console.log('实时内容:', message),
    onDeepReasoning: (reasoning) => console.log('推理过程:', reasoning)
  }
).then(result => {
  console.log('最终结果:', result.result);
  console.log('推理内容:', result.deepReasoning);
}).catch(error => console.error('优化失败:', error));

// 3. 优化图像提示词
sdk.optimizeImagePrompt("可爱的猫咪", "增加艺术风格", {
  onMessage: (message) => console.log('实时内容:', message)
}).then(result => {
  console.log('优化后的图像提示词:', result);
}).catch(error => console.error('优化失败:', error));

// 4. 生成通用提示词
sdk.generatePrompt("写文章", "更专业", {
  enableDeepReasoning: true,
  chatModel: "gpt-4",
  onMessage: (message) => console.log('生成内容:', message),
  onDeepReasoning: (reasoning) => console.log('推理过程:', reasoning)
}).then(result => {
  console.log('生成结果:', result.result);
  console.log('推理过程:', result.deepReasoning);
}).catch(error => console.error('生成失败:', error));
```

### C# SDK 示例

```csharp
public class PromptSDK
{
    private readonly PromptClient _client;

    public PromptSDK(HttpClient httpClient, string apiKey)
    {
        _client = new PromptClient(httpClient, apiKey);
    }

    public async Task<PromptTemplateParameterDto> GenerateTemplateParametersAsync(string prompt)
    {
        return await _client.GenerateTemplateParametersAsync(prompt);
    }

    public async Task<GeneratePromptResult> OptimizeFunctionCallingAsync(
        string prompt, 
        string requirements, 
        bool enableDeepReasoning = false)
    {
        var input = new OptimizeFunctionCallingInput 
        { 
            Prompt = prompt, 
            Requirements = requirements, 
            EnableDeepReasoning = enableDeepReasoning 
        };
        return await _client.OptimizeFunctionCallingAsync(input);
    }

    // 其他方法...
}
```