using System;
using System.Threading.Tasks;
using Polly;
using Polly.CircuitBreaker;
using Serilog;

namespace Console.Service.AI
{
    public static class CircuitBreakerPolicy
    {
        // 创建一个熔断策略字典，为每个模型创建独立的熔断器
        private static readonly Dictionary<string, AsyncCircuitBreakerPolicy> ModelPolicies = new();

        /// <summary>
        /// 获取或创建模型的熔断策略
        /// </summary>
        /// <param name="modelName">模型名称</param>
        /// <returns>熔断策略</returns>
        public static AsyncCircuitBreakerPolicy GetOrCreatePolicy(string modelName)
        {
            if (!ModelPolicies.TryGetValue(modelName, out var policy))
            {
                // 创建新的熔断策略：
                // - 如果连续失败3次，熔断器会打开
                // - 熔断器打开后，30秒内所有请求将自动失败
                // - 30秒后，熔断器进入半开状态，允许一个请求尝试
                // - 如果该请求成功，熔断器关闭；否则，熔断器保持打开状态并重新开始计时
                policy = Policy
                    .Handle<Exception>(ex => !(ex is BrokenCircuitException)) // 不处理BrokenCircuitException以避免循环
                    .CircuitBreakerAsync(
                        exceptionsAllowedBeforeBreaking: 3,
                        durationOfBreak: TimeSpan.FromSeconds(30),
                        onBreak: (ex, timespan) => 
                        {
                            Log.Warning("模型 {Model} 的熔断器已打开，持续时间: {Duration} 秒。原因: {Reason}", 
                                modelName, timespan.TotalSeconds, ex.Message);
                        },
                        onReset: () => 
                        {
                            Log.Information("模型 {Model} 的熔断器已重置，服务恢复正常", modelName);
                        },
                        onHalfOpen: () => 
                        {
                            Log.Information("模型 {Model} 的熔断器处于半开状态，正在测试服务可用性", modelName);
                        });

                ModelPolicies[modelName] = policy;
            }

            return policy;
        }

        /// <summary>
        /// 使用熔断策略执行异步操作
        /// </summary>
        /// <typeparam name="T">返回值类型</typeparam>
        /// <param name="modelName">模型名称</param>
        /// <param name="action">要执行的操作</param>
        /// <returns>操作的结果</returns>
        public static async Task<T> ExecuteWithCircuitBreakerAsync<T>(string modelName, Func<Task<T>> action)
        {
            try
            {
                var policy = GetOrCreatePolicy(modelName);
                return await policy.ExecuteAsync(action);
            }
            catch (BrokenCircuitException ex)
            {
                Log.Error("模型 {Model} 的熔断器已打开，请求被拒绝。原因: {Reason}", modelName, ex.Message);
                throw new Exception($"模型 {modelName} 暂时不可用，熔断器处于打开状态。请稍后重试。", ex);
            }
        }
    }
}
