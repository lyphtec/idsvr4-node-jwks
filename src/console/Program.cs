using System;
using System.Net.Http;
using System.Threading.Tasks;
using IdentityModel.Client;
using Newtonsoft.Json.Linq;

namespace IdConsole
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.Title = "Console Client Credentials Flow";

            var response = await RequestTokenAsync();
            response.Show();

            await CallServiceAsync(response.AccessToken);
            
            "Done. Press any key to exit...".ConsoleYellow();
            Console.ReadKey();
        }

        static async Task<TokenResponse> RequestTokenAsync()
        {
            var issuer = "http://localhost:5000";

            var disco = await DiscoveryClient.GetAsync(issuer);
            if (disco.IsError) throw new Exception(disco.Error);

            var client = new TokenClient(
                    disco.TokenEndpoint,
                    "client",
                    "secret"
                );

            $"Requesting token from: {disco.TokenEndpoint}".ConsoleYellow();
            return await client.RequestClientCredentialsAsync("api1");
        }

        static async Task CallServiceAsync(string token)
        {
            var baseAddress = "http://localhost:5002";

            var client = new HttpClient
            {
                BaseAddress = new Uri(baseAddress)
            };

            client.SetBearerToken(token);

            $"\n\nCalling NodeAPI: {baseAddress}/me".ConsoleYellow();
            var response = await client.GetStringAsync("/me");

            "\n\nService claims:".ConsoleGreen();
            Console.WriteLine(JObject.Parse(response));
        }
    }
}
