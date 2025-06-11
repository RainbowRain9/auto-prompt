using System.ClientModel;

namespace Console.Service.Infrastructure;

public class GlobalExceptionMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (ClientResultException exception)
        {
            if (exception.Message.Contains("Unauthorized"))
            {
                await context.Response.WriteAsJsonAsync(new
                {
                    success = false,
                    message = "清先配置您的API密钥",
                });
            }    
        }
        catch (Exception e)
        {
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = e.Message,
            });
        }
    }
}