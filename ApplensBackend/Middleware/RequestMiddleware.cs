using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;

namespace AppLensV3.Middleware
{
    public class RequestMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string allowedOrigins;

        public RequestMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            allowedOrigins = configuration.GetValue("IFrameAllowedOrigins", string.Empty);
        }

        public async Task Invoke(HttpContext httpContext)
        {
            AddCrossOriginRestrictionHeaders(httpContext);
            await _next(httpContext);
        }

        private void AddCrossOriginRestrictionHeaders(HttpContext httpContext)
        {
            httpContext.Response.Headers.Add("Content-Security-Policy", $"default-src: https:; frame-ancestors 'self' {allowedOrigins}");
        }
    }

}
