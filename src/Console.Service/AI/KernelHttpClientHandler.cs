using Serilog;

namespace Console.Service.AI;

public class KernelHttpClientHandler : HttpClientHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        Log.Logger.Information("Sending request to {Url} with method {Method}", request.RequestUri, request.Method);
        var response = await base.SendAsync(request, cancellationToken);

        if (response.IsSuccessStatusCode)
        {
            Log.Logger.Information("Received successful response from {Url} with status code {StatusCode}",
                request.RequestUri, response.StatusCode);
        }
        else
        {
            Log.Logger.Warning("Received error response from {Url} with status code {StatusCode}: {ReasonPhrase}",
                request.RequestUri, response.StatusCode, response.ReasonPhrase);
        }

        return response;
    }
}