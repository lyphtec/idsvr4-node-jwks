using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IdentityServer4.Models;
using System.IO;
using System.Security.Cryptography.X509Certificates;

namespace IdServ
{
    public class Config
    {
        internal static X509Certificate2 GetSigningCertificate(string rootPath)
        {
            var fileName = Path.Combine(rootPath, "cert.pfx");

            if(!File.Exists(fileName)) {
                throw new FileNotFoundException("Signing Certificate is missing!");
            }

            var cert = new X509Certificate2(fileName);
            return cert;
        }
        
        public static IEnumerable<ApiResource> GetApiResources()
        {
            return new List<ApiResource>
            {
                new ApiResource("api1", "My API")
            };
        }

        public static IEnumerable<Client> GetClients()
        {
            return new List<Client>
            {
                new Client
                {
                    ClientId = "client",
                    AllowedGrantTypes = GrantTypes.ClientCredentials,
                    ClientSecrets =
                    {
                        new Secret("secret".Sha256())
                    },
                    AllowedScopes = { "api1" }
                }
            };
        }
    }
}
