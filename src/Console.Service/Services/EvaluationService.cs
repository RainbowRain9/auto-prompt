using System.Collections.Concurrent;
using System.ComponentModel;
using System.Text;
using System.Text.Json;
using Console.Service.AI;
using Console.Service.Dto;
using Console.Service.Options;
using FastService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Polly.CircuitBreaker;
using Serilog;
using CircuitBreakerPolicy = Console.Service.AI.CircuitBreakerPolicy;
using System.Threading;
using System.Linq;
using Console.Core.Entities;

namespace Console.Service.Services;

[FastService.Route("/v1/evaluation")]
[Tags("模型评估")]
public class EvaluationService(PromptService promptService) : FastApi
{
    /// <summary>
    /// 获取评估示例数据
    /// </summary>
    /// <returns></returns>
    [HttpGet("examples")]
    public Task<List<EvaluationExample>> GetEvaluationExamples()
    {
        return Task.FromResult(new List<EvaluationExample>
        {
            new EvaluationExample
            {
                Id = "copywriting-headphones",
                Title = "智能蓝牙耳机营销文案",
                Category = "文案策划",
                Description = "为科技产品创作吸引人的营销文案",
                Prompt = @"你是一个专业的文案策划师，具有丰富的营销经验和创意思维。你的任务是为客户创作吸引人的营销文案。

要求：
- 文案要简洁有力，突出产品特色
- 语言生动有趣，容易记忆
- 符合目标用户群体的偏好
- 包含明确的行动召唤

请根据以下产品信息，创作一份营销文案：",
                Request = "为一款智能蓝牙耳机创作营销文案，目标用户是25-35岁的年轻职场人士，产品特点：降噪、长续航、轻便、音质好"
            },
            new EvaluationExample
            {
                Id = "programming-python-function",
                Title = "Python函数编写助手",
                Category = "编程开发",
                Description = "协助编写高质量的Python函数代码",
                Prompt = @"你是一位经验丰富的Python开发工程师，专注于编写清晰、高效、可维护的代码。你的任务是根据需求编写Python函数。

编程要求：
- 代码要符合PEP 8编码规范
- 函数要包含完整的文档字符串(docstring)
- 添加必要的类型提示(type hints)
- 包含适当的错误处理
- 代码要简洁易读，注释清晰

请根据以下需求编写Python函数：",
                Request = "编写一个函数，计算列表中所有数字的统计信息，包括平均值、中位数、标准差，并处理空列表和非数字元素的情况"
            },
            new EvaluationExample
            {
                Id = "novel-fantasy-scene",
                Title = "奇幻小说场景描写",
                Category = "创意写作",
                Description = "创作引人入胜的奇幻小说场景",
                Prompt = @"你是一位富有想象力的奇幻小说作家，擅长构建生动的世界观和引人入胜的情节。你的任务是根据提供的设定创作小说场景。

写作要求：
- 场景描写要生动形象，富有画面感
- 人物对话要自然流畅，符合角色性格
- 情节要有张力和悬念
- 文笔要优美流畅，富有文学性
- 世界观设定要自洽合理

请根据以下设定创作小说场景：",
                Request = "在一个魔法学院的图书馆里，一名年轻的魔法师学徒意外发现了一本被封印的古老魔法书，当他触碰书籍时发生了什么？请描写这个场景"
            },
            new EvaluationExample
            {
                Id = "business-analysis-report",
                Title = "商业分析报告",
                Category = "商业分析",
                Description = "撰写专业的商业分析和市场调研报告",
                Prompt = @"你是一位资深的商业分析师，具有丰富的市场调研和数据分析经验。你的任务是根据提供的信息撰写专业的商业分析报告。

分析要求：
- 数据分析要客观准确，逻辑清晰
- 结论要有理有据，避免主观臆断
- 建议要具体可行，具有实操性
- 报告结构要完整，包含摘要、分析、结论
- 语言要专业规范，条理分明

请根据以下信息撰写商业分析报告：",
                Request = "分析2024年中国新能源汽车市场的发展趋势，包括市场规模、主要玩家、技术发展方向、消费者偏好变化，并提出未来3年的发展预测和投资建议"
            },
            new EvaluationExample
            {
                Id = "education-lesson-plan",
                Title = "教学课程设计",
                Category = "教育培训",
                Description = "设计有效的教学课程和学习计划",
                Prompt = @"你是一位经验丰富的教育专家，善于设计有效的教学方案和课程内容。你的任务是根据学习目标制定详细的教学计划。

教学设计要求：
- 学习目标要明确具体，可衡量
- 教学内容要循序渐进，符合认知规律
- 教学方法要多样化，提高学习兴趣
- 包含实践练习和评估方式
- 考虑不同学习者的特点和需求

请根据以下要求设计教学方案：",
                Request = "为零基础学员设计一个为期4周的数据分析入门课程，涵盖Excel基础操作、数据可视化、基础统计分析等内容，每周2小时课程时间"
            },
            new EvaluationExample
            {
                Id = "customer-service-response",
                Title = "客户服务回复",
                Category = "客户服务",
                Description = "处理客户咨询和投诉的专业回复",
                Prompt = @"你是一位专业的客户服务代表，具有丰富的客户沟通经验和问题解决能力。你的任务是为客户提供专业、耐心、有效的服务回复。

服务要求：
- 态度要友好耐心，表达同理心
- 回复要准确专业，解决实际问题
- 语言要简洁明了，避免术语堆砌
- 提供具体的解决方案或后续步骤
- 注重客户体验，建立良好关系

请根据以下客户问题提供服务回复：",
                Request = "客户投诉：我昨天在你们网站上买了一台笔记本电脑，订单显示已发货，但是快递单号查询显示无信息，而且客服电话一直占线。我急需这台电脑用于下周的重要工作，现在很担心能否及时收到"
            },
            new EvaluationExample
            {
                Id = "technical-documentation",
                Title = "技术文档编写",
                Category = "技术写作",
                Description = "编写清晰易懂的技术文档和说明",
                Prompt = @"你是一位专业的技术文档工程师，擅长将复杂的技术概念转化为清晰易懂的文档。你的任务是根据技术需求编写高质量的技术文档。

文档要求：
- 结构要清晰，层次分明
- 语言要准确简洁，避免歧义
- 包含必要的示例和代码片段
- 考虑不同技术水平的读者
- 提供故障排除和常见问题解答

请根据以下需求编写技术文档：",
                Request = "为一个RESTful API接口编写技术文档，该接口用于用户注册功能，包括接口说明、请求参数、响应格式、错误代码、使用示例等"
            },
            new EvaluationExample
            {
                Id = "recipe-cooking-guide",
                Title = "美食制作指南",
                Category = "生活服务",
                Description = "提供详细的烹饪指导和美食制作方法",
                Prompt = @"你是一位经验丰富的美食专家和烹饪教练，对各种菜系和烹饪技巧都有深入了解。你的任务是为用户提供详细的烹饪指导。

烹饪指导要求：
- 食材清单要详细准确，包含份量
- 制作步骤要清晰易懂，循序渐进
- 提供烹饪技巧和注意事项
- 包含营养价值和食用建议
- 考虑不同烹饪水平的用户需求

请根据以下需求提供烹饪指导：",
                Request = "教我制作正宗的四川麻婆豆腐，包括选材要求、具体制作步骤、调味技巧，以及如何掌握麻辣的平衡，适合家庭制作的版本"
            },
            // 以下是新增的案例
            new EvaluationExample
            {
                Id = "ai-research-summary",
                Title = "人工智能研究概述",
                Category = "学术研究",
                Description = "总结和分析人工智能领域的研究进展",
                Prompt = @"你是一位在人工智能领域有专长的学术研究员，擅长分析和总结复杂的研究成果。你的任务是提供清晰、准确的研究概述。

研究总结要求：
- 内容要客观准确，基于事实和数据
- 解释要通俗易懂，避免过度使用专业术语
- 逻辑结构要清晰，重点突出
- 包含关键的研究方法和成果
- 指出研究的局限性和未来发展方向

请根据以下研究主题提供概述：",
                Request = "总结近五年来大型语言模型（LLM）在自然语言处理领域的主要进展，重点关注模型架构、训练方法、性能突破及其在实际应用中的价值和挑战"
            },
            new EvaluationExample
            {
                Id = "legal-contract-analysis",
                Title = "法律合同分析",
                Category = "法律事务",
                Description = "分析法律文件并提供专业意见",
                Prompt = @"你是一位经验丰富的法律顾问，擅长分析合同条款并提供专业建议。你的任务是对法律文件进行分析，并指出潜在风险和改进建议。

法律分析要求：
- 内容分析要全面，不遗漏重要条款
- 法律解释要准确，符合现行法规
- 风险评估要具体，提供明确的风险点
- 建议要实用，便于落实
- 语言要专业且易于理解

请根据以下合同信息进行分析：",
                Request = "分析一份软件开发服务合同，重点关注知识产权归属、保密条款、交付标准、验收流程、付款条件和争议解决等关键部分，并提出可能的风险点和优化建议"
            },
            new EvaluationExample
            {
                Id = "product-design-feedback",
                Title = "产品设计反馈",
                Category = "产品设计",
                Description = "评估产品设计并提供改进建议",
                Prompt = @"你是一位经验丰富的产品设计顾问，具有敏锐的用户体验感知能力。你的任务是分析产品设计方案，并提供专业、有建设性的反馈。

设计反馈要求：
- 评价要全面，包括优点和不足
- 分析要基于用户体验原则
- 建议要具体可行，有明确的改进方向
- 保持专业客观，避免过度批评
- 考虑不同用户群体的需求

请根据以下产品设计信息提供反馈：",
                Request = "评估一款健康监测手环的用户界面设计，该设计包括主界面、数据展示、运动记录和个人设置等模块，目标用户是40-60岁的中老年人，重点关注易用性、可读性和功能直观性"
            },
            new EvaluationExample
            {
                Id = "data-visualization-guide",
                Title = "数据可视化指南",
                Category = "数据分析",
                Description = "提供有效的数据可视化方法和建议",
                Prompt = @"你是一位数据可视化专家，擅长将复杂数据转化为直观、有洞察力的视觉呈现。你的任务是提供数据可视化的专业指导。

可视化指导要求：
- 方法选择要适合数据类型和分析目的
- 设计要遵循可视化最佳实践
- 建议要考虑目标受众的背景知识
- 包含具体的工具和技术推荐
- 提供清晰的步骤和实施建议

请根据以下数据需求提供可视化指南：",
                Request = "为一家电子商务公司设计销售数据的可视化方案，需要展示不同区域、不同产品类别的销售额、增长率和季节性波动，同时要突出异常值和趋势变化，便于管理层决策"
            },
            new EvaluationExample
            {
                Id = "crisis-communication-plan",
                Title = "危机沟通方案",
                Category = "公关传播",
                Description = "制定有效的危机公关和沟通策略",
                Prompt = @"你是一位资深的公关危机管理专家，具有丰富的危机沟通经验。你的任务是制定专业的危机沟通方案，帮助组织有效应对公关危机。

危机沟通要求：
- 方案要全面，覆盖危机各阶段
- 信息发布要及时、透明、一致
- 沟通渠道要多元化，适合不同利益相关方
- 包含具体的言论口径和回应模板
- 考虑潜在风险和应对预案

请根据以下危机情境制定沟通方案：",
                Request = "为一家食品企业制定食品安全事件的危机沟通方案，该企业产品被检测出含有少量超标添加剂，已引起消费者关注和媒体报道，需要快速应对以最小化品牌损害"
            },
            new EvaluationExample
            {
                Id = "financial-investment-advice",
                Title = "财务投资建议",
                Category = "财务规划",
                Description = "提供个性化的财务投资和理财建议",
                Prompt = @"你是一位专业的财务顾问，具有丰富的投资规划经验。你的任务是根据客户情况提供个性化的投资建议。

财务建议要求：
- 分析要全面，考虑客户的财务状况
- 建议要符合客户的风险承受能力
- 投资组合要多元化，平衡风险与收益
- 考虑短期和长期财务目标
- 提供具体的投资工具和策略选择

请根据以下客户情况提供投资建议：",
                Request = "为一位35岁的IT行业专业人士提供投资规划建议，他月收入3万元，有50万积蓄，无债务，已购房，计划5年内要孩子，风险承受能力中等，希望为退休和子女教育做准备"
            },
            new EvaluationExample
            {
                Id = "interview-prep-guide",
                Title = "面试准备指南",
                Category = "职业发展",
                Description = "提供针对性的求职面试准备建议",
                Prompt = @"你是一位经验丰富的职业顾问，擅长帮助求职者准备面试。你的任务是提供全面、有效的面试准备指南。

面试准备要求：
- 建议要针对特定行业和职位
- 包含常见问题和高质量回答示例
- 提供行为面试(STAR方法)的具体准备策略
- 包括面试礼仪和注意事项
- 提供面试后的跟进建议

请根据以下求职信息提供面试准备指南：",
                Request = "为一位有3年工作经验的软件开发工程师准备面试指南，他应聘一家知名科技公司的高级开发岗位，需要准备技术面试和行为面试，包括可能的编程测试和系统设计讨论"
            },
            new EvaluationExample
            {
                Id = "historical-event-analysis",
                Title = "历史事件分析",
                Category = "历史研究",
                Description = "分析历史事件的背景、影响和意义",
                Prompt = @"你是一位专业的历史学者，擅长对历史事件进行深入分析和解读。你的任务是提供客观、多角度的历史分析。

历史分析要求：
- 内容要基于史实，引用可靠史料
- 分析要多角度，考虑政治、经济、文化等因素
- 解读要客观中立，避免现代价值观过度投射
- 探讨事件的长期影响和历史意义
- 指出学术界的不同观点和解释

请根据以下历史事件进行分析：",
                Request = "分析中国改革开放(1978年-)的历史背景、主要政策措施、实施过程中的挑战与调整，以及对中国社会、经济发展和国际影响的深远意义"
            },
            new EvaluationExample
            {
                Id = "mental-health-coping-strategies",
                Title = "心理健康应对策略",
                Category = "心理健康",
                Description = "提供科学的心理健康建议和应对方法",
                Prompt = @"你是一位专业的心理健康顾问，具有丰富的心理咨询经验。你的任务是提供科学、有效的心理健康建议。

心理健康建议要求：
- 内容要基于心理学科学研究
- 建议要具体可行，易于实践
- 语言要温和支持，避免说教
- 重视自助方法，同时鼓励专业帮助
- 考虑个体差异和具体情境

请根据以下心理健康问题提供建议：",
                Request = "为一位因工作压力大而出现焦虑、失眠症状的上班族提供心理调适和压力管理建议，包括日常可实践的减压方法、认知调整策略、何时寻求专业帮助的指导等"
            }
        });
    }

    /// <summary>
    /// 执行测试任务，使用原始提示词和优化后的提示词对多个模型进行评分
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    [HttpPost("execute-model-task")]
    public async Task<ConcurrentDictionary<string, object>> EvaluationAsync(ExecuteTestInput input)
    {
        input.Models = input.Models?.Where(x => !string.IsNullOrEmpty(x)).Distinct().ToArray();

        // 确保执行次数至少为1
        input.ExecutionCount = Math.Max(1, input.ExecutionCount);

        Log.Logger.Information("开始执行测试任务，模型数量: {ModelsCount}, 执行次数: {ExecutionCount}, 启用优化: {EnableOptimization}",
            input.Models?.Length, input.ExecutionCount, input.EnableOptimization);
        var scorePrompts = new ConcurrentDictionary<string, object>();

        // 获取原始提示词得到的结果
        Log.Logger.Debug("创建评分内核实例，评分模型: {ScoreModel}", ConsoleOptions.ScoreModel);
        var kernel =
            KernelFactory.CreateKernel(ConsoleOptions.ScoreModel, ConsoleOptions.OpenAIEndpoint, input.ApiKey);

        // 使用并行处理多个模型
        var tasks = input.Models.Select(async model =>
        {
            try
            {
                Log.Logger.Information("处理模型 {Model}", model);

                // 存储多次执行的结果
                var executionResults =
                    new List<(string Comment, string Description, int Score, string[] Tags, string OriginalPrompt,
                        string OriginalPromptOutput, string Prompt, string PromptOutput)>();

                // 执行指定次数
                for (int i = 0; i < input.ExecutionCount; i++)
                {
                    Log.Logger.Information("模型 {Model} 第 {Current}/{Total} 次执行", model, i + 1, input.ExecutionCount);

                    var sb = new StringBuilder();
                    string optimizedPrompt = input.Prompt;
                    string optimizedOutput = "";
                    string originalOutput = "";

                    // 获取原始提示词得到的结果
                    Log.Logger.Debug("为模型 {Model} 创建内核实例", model);
                    var kernelModel = KernelFactory.CreateKernel(model, ConsoleOptions.OpenAIEndpoint, input.ApiKey);

                    // 如果启用了优化
                    if (input.EnableOptimization)
                    {
                        Log.Logger.Debug("开始优化提示词");

                        // 使用熔断器包装提示词优化过程
                        try
                        {
                            await foreach (var (deep, value) in promptService.GenerateDeepReasoningPromptAsync(model,
                                               input.Prompt, input.Requirements ?? string.Empty, input.ApiKey))
                            {
                                if (deep == false)
                                {
                                    sb.Append(value);
                                }
                            }
                        }
                        catch (BrokenCircuitException bcex)
                        {
                            Log.Error("模型 {Model} 的提示词优化请求被熔断器阻止: {Error}", model, bcex.Message);
                            throw;
                        }

                        Log.Logger.Debug("提示词优化完成，优化后长度: {Length}", sb.Length);
                        optimizedPrompt = sb.ToString();
                    }

                    // 使用熔断器包装原始提示词执行请求
                    Log.Logger.Debug("使用原始提示词执行请求");
                    var prompt = await CircuitBreakerPolicy.ExecuteWithCircuitBreakerAsync(model, async () =>
                        await kernelModel.InvokePromptAsync(input.Prompt + input.Request));

                    originalOutput = prompt.ToString();

                    // 如果启用了优化，执行优化后的提示词
                    if (input.EnableOptimization)
                    {
                        // 使用熔断器包装优化提示词执行请求
                        Log.Logger.Debug("使用优化后的提示词执行请求");
                        var optimization = await CircuitBreakerPolicy.ExecuteWithCircuitBreakerAsync(model, async () =>
                            await kernelModel.InvokePromptAsync(optimizedPrompt + Environment.NewLine + input.Request));

                        optimizedOutput = optimization.ToString();
                    }

                    // 使用熔断器包装评分请求
                    Log.Logger.Information("执行提示词评分");
                    var result = await CircuitBreakerPolicy.ExecuteWithCircuitBreakerAsync(ConsoleOptions.ScoreModel,
                        async () =>
                        {
                            if (input.EnableOptimization)
                            {
                                return await kernel.InvokeAsync(kernel.Plugins["Generate"]["ScorePrompt"],
                                    new KernelArguments(
                                        new OpenAIPromptExecutionSettings()
                                        {
                                            ResponseFormat = typeof(ScorePrompt)
                                        })
                                    {
                                        ["OriginalPromptGoal"] = input.Request,
                                        ["OptimizePromptWords"] = optimizedPrompt,
                                        ["OptimizePromptWordsOutput"] = optimizedOutput
                                    });
                            }
                            else
                            {
                                // 如果没有启用优化，只评估原始提示词
                                return await kernel.InvokeAsync(kernel.Plugins["Generate"]["ScorePrompt"],
                                    new KernelArguments(
                                        new OpenAIPromptExecutionSettings()
                                        {
                                            ResponseFormat = typeof(ScorePrompt)
                                        })
                                    {
                                        ["OriginalPromptGoal"] = input.Request,
                                        ["OptimizePromptWords"] = optimizedPrompt,
                                        ["OptimizePromptWordsOutput"] = optimizedOutput
                                    });
                            }
                        });

                    var scorePrompt = JsonSerializer.Deserialize<ScorePrompt>(result.ToString());
                    Log.Logger.Information("第 {ExecutionIndex} 次评分结果: {Score}, 描述: {Description}",
                        i + 1, scorePrompt?.Score, scorePrompt?.Description);

                    // 存储这次执行的结果
                    executionResults.Add((
                        Comment: scorePrompt?.Comment ?? "",
                        Description: scorePrompt?.Description ?? "",
                        Score: scorePrompt?.Score ?? 0,
                        Tags: scorePrompt?.Tags ?? Array.Empty<string>(),
                        OriginalPrompt: input.EnableOptimization ? optimizedPrompt : input.Prompt,
                        OriginalPromptOutput: input.EnableOptimization ? optimizedOutput : originalOutput,
                        Prompt: input.Prompt,
                        PromptOutput: originalOutput
                    ));
                }

                // 计算平均结果
                var avgScore = executionResults.Average(r => r.Score);
                var bestResult = executionResults.OrderByDescending(r => r.Score).First();

                scorePrompts.TryAdd(model, new
                {
                    Comment = input.ExecutionCount > 1
                        ? $"基于{input.ExecutionCount}次执行的平均结果。{bestResult.Comment}"
                        : bestResult.Comment,
                    Description = input.ExecutionCount > 1
                        ? $"平均得分: {avgScore:F1}分 (执行{input.ExecutionCount}次)"
                        : bestResult.Description,
                    Score = (int)Math.Round(avgScore),
                    Tags = bestResult.Tags,
                    originalPrompt = bestResult.OriginalPrompt,
                    originalPromptOutput = bestResult.OriginalPromptOutput,
                    prompt = bestResult.Prompt,
                    promptOutput = bestResult.PromptOutput,
                    executionCount = input.ExecutionCount,
                    executionResults = input.ExecutionCount > 1
                        ? executionResults.Select((r, index) => new
                        {
                            r.Comment,
                            r.Description,
                            r.Score,
                            r.Tags,
                            originalPrompt = r.OriginalPrompt,
                            originalPromptOutput = r.OriginalPromptOutput,
                            prompt = r.Prompt,
                            promptOutput = r.PromptOutput,
                            executionIndex = index + 1
                        })
                        : null
                });
            }
            catch (BrokenCircuitException bcex)
            {
                Log.Error("模型 {Model} 处理被熔断器阻止: {Error}", model, bcex.Message);
                scorePrompts.TryAdd(model, new ScorePrompt
                {
                    Description = $"模型暂时不可用 - 熔断器触发",
                    Score = 0,
                    Comment = $"由于连续多次失败，熔断器已触发。错误: {bcex.Message}"
                });
            }
            catch (Exception e)
            {
                Log.Logger.Error(e, "处理模型 {Model} 时发生错误", model);
                scorePrompts.TryAdd(model, new ScorePrompt
                {
                    Description = "处理失败",
                    Score = 0,
                    Comment = $"错误: {e.Message}"
                });
            }
        }).ToArray();

        // 等待所有任务完成
        await Task.WhenAll(tasks);

        Log.Logger.Information("测试任务完成");
        return scorePrompts;
    }

    /// <summary>
    /// 流式执行模型评估任务，实时返回每个模型的评估结果
    /// </summary>
    /// <param name="input"></param>
    /// <param name="context"></param>
    /// <returns></returns>
    [HttpPost("execute-model-task-stream")]
    public async Task StreamEvaluationAsync(ExecuteTestInput input, HttpContext context)
    {
        input.Models = input.Models?.Where(x => !string.IsNullOrEmpty(x)).Distinct().ToArray();

        // 确保执行次数至少为1
        input.ExecutionCount = Math.Max(1, input.ExecutionCount);

        Log.Logger.Information("开始流式执行测试任务，模型数量: {ModelsCount}, 执行次数: {ExecutionCount}, 启用优化: {EnableOptimization}",
            input.Models?.Length, input.ExecutionCount, input.EnableOptimization);

        // 设置响应为Server-Sent Events
        context.Response.Headers.Add("Content-Type", "text/event-stream");
        context.Response.Headers.Add("Cache-Control", "no-cache");
        context.Response.Headers.Add("Connection", "keep-alive");
        context.Response.Headers.Add("Access-Control-Allow-Origin", "*");

        // 创建一个信号量来同步SSE写入操作，确保线程安全
        using var semaphore = new SemaphoreSlim(1, 1);

        // 计算总任务数：模型数量 * 执行次数
        var totalTasks = (input.Models?.Length ?? 0) * input.ExecutionCount;

        // 记录开始时间
        var evaluationStartTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        // 发送开始事件
        await WriteSSEAsync(context, "start", new
        {
            totalModels = input.Models?.Length ?? 0,
            executionCount = input.ExecutionCount,
            enableOptimization = input.EnableOptimization,
            totalTasks = totalTasks,
            startTime = evaluationStartTime
        }, semaphore);

        // 获取评分内核实例
        Log.Logger.Debug("创建评分内核实例，评分模型: {ScoreModel}", ConsoleOptions.ScoreModel);
        var kernel = KernelFactory.CreateKernel(ConsoleOptions.ScoreModel, ConsoleOptions.OpenAIEndpoint, input.ApiKey);

        // 处理每个模型
        var tasks = input.Models.Select<string, Task<(string, object)>>(async model =>
        {
            try
            {
                Log.Logger.Information("开始处理模型 {Model}", model);

                // 发送模型开始处理事件
                await WriteSSEAsync(context, "model-start", new { model }, semaphore);

                // 存储多次执行的结果
                var executionResults =
                    new List<(string Comment, string Description, int Score, string[] Tags, string OriginalPrompt,
                        string OriginalPromptOutput, string Prompt, string PromptOutput)>();

                // 执行指定次数
                for (int i = 0; i < input.ExecutionCount; i++)
                {
                    Log.Logger.Information("模型 {Model} 第 {Current}/{Total} 次执行", model, i + 1, input.ExecutionCount);

                    var sb = new StringBuilder();
                    string optimizedPrompt = input.Prompt;
                    string optimizedOutput = "";
                    string originalOutput = "";

                    // 获取原始提示词得到的结果
                    Log.Logger.Debug("为模型 {Model} 创建内核实例", model);
                    var kernelModel = KernelFactory.CreateKernel(model, ConsoleOptions.OpenAIEndpoint, input.ApiKey);

                    // 如果启用了优化
                    if (input.EnableOptimization)
                    {
                        Log.Logger.Debug("开始优化提示词");

                        // 每次执行都发送优化开始事件
                        await WriteSSEAsync(context, "optimize-start", new { model, execution = i + 1 }, semaphore);

                        // 使用熔断器包装提示词优化过程
                        try
                        {
                            await foreach (var (deep, value) in promptService.GenerateDeepReasoningPromptAsync(model,
                                               input.Prompt, input.Requirements ?? string.Empty, input.ApiKey))
                            {
                                if (deep == false)
                                {
                                    sb.Append(value);
                                }
                            }
                        }
                        catch (BrokenCircuitException bcex)
                        {
                            Log.Error("模型 {Model} 的提示词优化请求被熔断器阻止: {Error}", model, bcex.Message);
                            await WriteSSEAsync(context, "model-error", new { model, error = $"熔断器触发: {bcex.Message}" },
                                semaphore);
                            var errorResult = new ScorePrompt
                            {
                                Description = $"模型暂时不可用 - 熔断器触发",
                                Score = 0,
                                Comment = $"由于连续多次失败，熔断器已触发。错误: {bcex.Message}"
                            };
                            return (model, (object)errorResult);
                        }

                        Log.Logger.Debug("提示词优化完成，优化后长度: {Length}", sb.Length);

                        // 每次执行都发送优化完成事件
                        await WriteSSEAsync(context, "optimize-complete",
                            new { model, execution = i + 1, optimizedPromptLength = sb.Length }, semaphore);

                        optimizedPrompt = sb.ToString();
                    }

                    // 使用熔断器包装原始提示词执行请求
                    Log.Logger.Debug("使用原始提示词执行请求");
                    await WriteSSEAsync(context, "execute-original", new { model, execution = i + 1 }, semaphore);

                    var prompt = await CircuitBreakerPolicy.ExecuteWithCircuitBreakerAsync(model, async () =>
                        await kernelModel.InvokePromptAsync(input.Prompt + input.Request));

                    originalOutput = prompt.ToString();

                    // 如果启用了优化，执行优化后的提示词
                    if (input.EnableOptimization)
                    {
                        // 使用熔断器包装优化提示词执行请求
                        Log.Logger.Debug("使用优化后的提示词执行请求");
                        await WriteSSEAsync(context, "execute-optimized", new { model, execution = i + 1 },
                            semaphore);

                        var optimization = await CircuitBreakerPolicy.ExecuteWithCircuitBreakerAsync(model, async () =>
                            await kernelModel.InvokePromptAsync(optimizedPrompt + Environment.NewLine + input.Request));

                        optimizedOutput = optimization.ToString();
                    }

                    // 使用熔断器包装评分请求
                    Log.Logger.Information("执行提示词评分");
                    await WriteSSEAsync(context, "scoring", new { model, execution = i + 1 }, semaphore);

                    var result = await CircuitBreakerPolicy.ExecuteWithCircuitBreakerAsync(ConsoleOptions.ScoreModel,
                        async () =>
                        {
                            if (input.EnableOptimization)
                            {
                                return await kernel.InvokeAsync(kernel.Plugins["Generate"]["ScorePrompt"],
                                    new KernelArguments(
                                        new OpenAIPromptExecutionSettings()
                                        {
                                            ResponseFormat = typeof(ScorePrompt)
                                        })
                                    {
                                        ["OriginalPromptGoal"] = input.Request,
                                        ["OptimizePromptWords"] = optimizedPrompt,
                                        ["OriginalPromptText"] = input.Prompt,
                                        ["OriginalPromptOutput"] = originalOutput,
                                        ["OptimizePromptWordsOutput"] = optimizedOutput
                                    });
                            }
                            else
                            {
                                // 如果没有启用优化，只评估原始提示词
                                return await kernel.InvokeAsync(kernel.Plugins["Generate"]["ScorePrompt"],
                                    new KernelArguments(
                                        new OpenAIPromptExecutionSettings()
                                        {
                                            ResponseFormat = typeof(ScorePrompt)
                                        })
                                    {
                                        ["OriginalPromptGoal"] = input.Request,
                                        ["OptimizePromptWords"] = optimizedPrompt,
                                        ["OriginalPromptText"] = input.Prompt,
                                        ["OriginalPromptOutput"] = originalOutput,
                                        ["OptimizePromptWordsOutput"] = optimizedOutput
                                    });
                            }
                        });

                    var scorePrompt = JsonSerializer.Deserialize<ScorePrompt>(result.ToString());
                    Log.Logger.Information("第 {ExecutionIndex} 次评分结果: {Score}, 描述: {Description}",
                        i + 1, scorePrompt?.Score, scorePrompt?.Description);

                    // 存储这次执行的结果
                    executionResults.Add((
                        Comment: scorePrompt?.Comment ?? "",
                        Description: scorePrompt?.Description ?? "",
                        Score: scorePrompt?.Score ?? 0,
                        Tags: scorePrompt?.Tags ?? [],
                        OriginalPrompt: input.EnableOptimization ? optimizedPrompt : input.Prompt,
                        OriginalPromptOutput: input.EnableOptimization ? optimizedOutput : originalOutput,
                        Prompt: input.Prompt,
                        PromptOutput: originalOutput
                    ));
                }

                // 计算平均结果
                var avgScore = executionResults.Average(r => r.Score);
                var bestResult = executionResults.OrderByDescending(r => r.Score).First();

                var finalResultData = new
                {
                    Comment = input.ExecutionCount > 1
                        ? $"基于{input.ExecutionCount}次执行的平均结果。{bestResult.Comment}"
                        : bestResult.Comment,
                    Description = input.ExecutionCount > 1
                        ? $"平均得分: {avgScore:F1}分 (执行{input.ExecutionCount}次)"
                        : bestResult.Description,
                    Score = (int)Math.Round(avgScore),
                    Tags = bestResult.Tags,
                    originalPrompt = bestResult.OriginalPrompt,
                    originalPromptOutput = bestResult.OriginalPromptOutput,
                    prompt = bestResult.Prompt,
                    promptOutput = bestResult.PromptOutput,
                    executionCount = input.ExecutionCount,
                    executionResults = input.ExecutionCount > 1
                        ? executionResults.Select((r, index) => new
                        {
                            r.Comment,
                            r.Description,
                            r.Score,
                            r.Tags,
                            originalPrompt = r.OriginalPrompt,
                            originalPromptOutput = r.OriginalPromptOutput,
                            prompt = r.Prompt,
                            promptOutput = r.PromptOutput,
                            executionIndex = index + 1
                        })
                        : null // 只有多次执行时才返回详细结果
                };

                // 发送模型完成事件
                await WriteSSEAsync(context, "model-complete", new { model, result = finalResultData }, semaphore);

                return (model, (object)finalResultData);
            }
            catch (BrokenCircuitException bcex)
            {
                Log.Error("模型 {Model} 处理被熔断器阻止: {Error}", model, bcex.Message);
                var errorResult = new ScorePrompt
                {
                    Description = $"模型暂时不可用 - 熔断器触发",
                    Score = 0,
                    Comment = $"由于连续多次失败，熔断器已触发。错误: {bcex.Message}"
                };
                await WriteSSEAsync(context, "model-error", new { model, result = errorResult }, semaphore);
                return (model, (object)errorResult);
            }
            catch (Exception e)
            {
                Log.Logger.Error(e, "处理模型 {Model} 时发生错误", model);
                var errorResult = new ScorePrompt
                {
                    Description = "处理失败",
                    Score = 0,
                    Comment = $"错误: {e.Message}"
                };
                await WriteSSEAsync(context, "model-error", new { model, result = errorResult }, semaphore);
                return (model, (object)errorResult);
            }
        }).ToArray();

        // 等待所有任务完成
        var results = await Task.WhenAll(tasks);

        // 记录结束时间并计算总耗时
        var evaluationEndTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var totalEvaluationTime = evaluationEndTime - evaluationStartTime;

        // 发送完成事件
        await WriteSSEAsync(context, "complete", new { 
            message = "所有模型评估完成",
            endTime = evaluationEndTime,
            totalTime = totalEvaluationTime
        }, semaphore);

        // 自动保存评估记录到数据库
        try
        {
            var evaluationResults = results.ToDictionary(r => r.Item1, r => (object)r.Item2);
            await SaveEvaluationRecordAsync(input, evaluationResults, context, evaluationStartTime, evaluationEndTime, totalEvaluationTime);
        }
        catch (Exception ex)
        {
            Log.Logger.Error(ex, "自动保存评估记录失败");
            // 不影响主流程，只记录错误
        }

        Log.Logger.Information("流式测试任务完成");
    }

    /// <summary>
    /// 写入SSE数据（线程安全版本）
    /// </summary>
    private async Task WriteSSEAsync(HttpContext context, string eventType, object data, SemaphoreSlim semaphore)
    {
        await semaphore.WaitAsync();
        try
        {
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions
            {
                WriteIndented = false,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            var sseData = $"event: {eventType}\ndata: {json}\n\n";
            var bytes = Encoding.UTF8.GetBytes(sseData);

            await context.Response.Body.WriteAsync(bytes);
            await context.Response.Body.FlushAsync();
        }
        finally
        {
            semaphore.Release();
        }
    }

    /// <summary>
    /// 自动保存评估记录到数据库
    /// </summary>
    private async Task SaveEvaluationRecordAsync(ExecuteTestInput input, Dictionary<string, object> evaluationResults, HttpContext context, long evaluationStartTime, long evaluationEndTime, long totalEvaluationTime)
    {
        try
        {
            // 验证用户身份
            var token = context.Request.Headers["Authorization"].ToString().Trim().Replace("Bearer ", "");
            if (string.IsNullOrEmpty(token))
                return;

            var jwtService = context.RequestServices.GetService<Console.Service.Services.JwtService>();
            if (jwtService == null)
                return;

            var userId = jwtService.GetUserIdFromToken(token);
            var userName = jwtService.GetUserNameFromToken(token);
            if (string.IsNullOrEmpty(userId) || !jwtService.IsTokenValid(token))
                return;

            var dbContext = context.RequestServices.GetService<Console.Core.IDbContext>();
            if (dbContext == null)
                return;

            // 构建评估记录
            var config = new
            {
                models = input.Models ?? [],
                prompt = input.Prompt,
                request = input.Request,
                executionCount = input.ExecutionCount,
                enableOptimization = input.EnableOptimization,
                requirements = input.Requirements ?? "",
                exampleId = "",
                exampleTitle = "",
                exampleCategory = ""
            };

            var results = new Dictionary<string, object>();
            var totalModels = input.Models?.Length ?? 0;
            var completedModels = 0;
            var totalScore = 0.0;
            var scoreDistribution = new Dictionary<string, int>
            {
                ["90-100"] = 0,
                ["80-89"] = 0,
                ["70-79"] = 0,
                ["60-69"] = 0,
                ["0-59"] = 0
            };
            var tagDistribution = new Dictionary<string, int>();

            foreach (var (model, result) in evaluationResults)
            {
                // 处理不同类型的结果对象
                int score = 0;
                string description = "";
                string comment = "";
                string[] tags = [];
                string originalPrompt = "";
                string originalPromptOutput = "";
                string prompt = "";
                string promptOutput = "";
                int executionCount = input.ExecutionCount;
                long startTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                long endTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                long duration = 0;
                object? executionResults = null;
                
                if (result is ScorePrompt scorePrompt)
                {
                    // 异常情况下返回的ScorePrompt对象
                    score = scorePrompt.Score;
                    description = scorePrompt.Description ?? "";
                    comment = scorePrompt.Comment ?? "";
                    tags = scorePrompt.Tags ?? [];
                    prompt = input.Prompt;
                    originalPrompt = input.Prompt;
                }
                else
                {
                    // 正常情况下返回的匿名对象，使用动态类型访问
                    try
                    {
                        dynamic dynamicResult = result;
                        score = (int)(dynamicResult.Score ?? 0);
                        description = (string)(dynamicResult.Description ?? "");
                        comment = (string)(dynamicResult.Comment ?? "");
                        originalPrompt = (string)(dynamicResult.originalPrompt ?? input.Prompt);
                        originalPromptOutput = (string)(dynamicResult.originalPromptOutput ?? "");
                        prompt = (string)(dynamicResult.prompt ?? input.Prompt);
                        promptOutput = (string)(dynamicResult.promptOutput ?? "");
                        executionCount = (int)(dynamicResult.executionCount ?? input.ExecutionCount);
                        
                        // 处理Tags数组
                        if (dynamicResult.Tags != null)
                        {
                            var tagsList = new List<string>();
                            foreach (var tag in dynamicResult.Tags)
                            {
                                tagsList.Add(tag.ToString());
                            }
                            tags = tagsList.ToArray();
                        }

                        // 处理多次执行结果
                        if (dynamicResult.executionResults != null)
                        {
                            executionResults = dynamicResult.executionResults;
                        }
                    }
                    catch (Exception ex)
                    {
                        Log.Logger.Warning("解析评估结果时出错: {Error}, 模型: {Model}", ex.Message, model);
                        // 使用默认值
                        score = 0;
                        description = "解析结果失败";
                        comment = ex.Message;
                        tags = [];
                        prompt = input.Prompt;
                        originalPrompt = input.Prompt;
                    }
                }

                // 创建完整的结果记录
                var modelResult = new
                {
                    score = score,
                    description = description,
                    comment = comment,
                    tags = tags,
                    executionCount = executionCount,
                    startTime = startTime,
                    endTime = endTime,
                    duration = duration,
                    originalPrompt = originalPrompt,
                    originalPromptOutput = originalPromptOutput,
                    prompt = prompt,
                    promptOutput = promptOutput
                };

                // 如果有多次执行结果，也保存进去
                if (executionResults != null)
                {
                    var resultWithExecutions = new
                    {
                        score = score,
                        description = description,
                        comment = comment,
                        tags = tags,
                        executionCount = executionCount,
                        startTime = startTime,
                        endTime = endTime,
                        duration = duration,
                        originalPrompt = originalPrompt,
                        originalPromptOutput = originalPromptOutput,
                        prompt = prompt,
                        promptOutput = promptOutput,
                        executionResults = executionResults
                    };
                    results[model] = resultWithExecutions;
                }
                else
                {
                    results[model] = modelResult;
                }

                if (score > 0)
                {
                    completedModels++;
                    totalScore += score;

                    // 统计评分分布
                    if (score >= 90) scoreDistribution["90-100"]++;
                    else if (score >= 80) scoreDistribution["80-89"]++;
                    else if (score >= 70) scoreDistribution["70-79"]++;
                    else if (score >= 60) scoreDistribution["60-69"]++;
                    else scoreDistribution["0-59"]++;

                    // 统计标签分布
                    foreach (var tag in tags)
                    {
                        tagDistribution[tag] = tagDistribution.GetValueOrDefault(tag, 0) + 1;
                    }
                }
            }

            var statistics = new
            {
                totalModels = totalModels,
                completedModels = completedModels,
                avgScore = completedModels > 0 ? totalScore / completedModels : 0.0,
                totalTime = totalEvaluationTime,
                scoreDistribution = scoreDistribution,
                tagDistribution = tagDistribution
            };

            // 生成更好的标题
            var title = $"模型评估 - {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}";
            if (input.ExecutionCount > 1)
            {
                title += $" ({input.ExecutionCount}次执行)";
            }
            if (input.EnableOptimization)
            {
                title += " (优化提示词)";
            }

            var record = new EvaluationRecord
            {
                Id = Guid.NewGuid(),
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                Title = title,
                Config = JsonSerializer.Serialize(config, JsonSerializerOptions.Web),
                Results = JsonSerializer.Serialize(results, JsonSerializerOptions.Web),
                Statistics = JsonSerializer.Serialize(statistics, JsonSerializerOptions.Web),
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow,
                UserId = userId,
                CreatorName = userName
            };

            dbContext.EvaluationRecords.Add(record);
            await dbContext.SaveChangesAsync();

            Log.Logger.Information("评估记录已自动保存，记录ID: {RecordId}, 标题: {Title}", record.Id, title);
        }
        catch (Exception ex)
        {
            Log.Logger.Error(ex, "保存评估记录时发生异常");
            throw;
        }
    }

    public class ScorePrompt
    {
        [Description("评分简短描述")] public string Description { get; set; } = null!;

        [Description("评分范围：0-100")] public int Score { get; set; }

        [Description("评分理由")] public string? Comment { get; set; }

        [Description("当前提示词分类Tags")] public string[] Tags { get; set; } = [];
    }

    public class EvaluationExample
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Prompt { get; set; } = string.Empty;
        public string Request { get; set; } = string.Empty;
    }
}