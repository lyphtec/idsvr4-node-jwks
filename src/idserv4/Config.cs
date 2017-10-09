using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IdentityServer4.Models;
using System.IO;
using System.Security.Cryptography.X509Certificates;
using IdentityServer4;
using IdentityServer4.Test;
using System.Security.Claims;
using IdentityModel;

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

        public static IEnumerable<IdentityResource> GetIdentityResources()
        {
            return new List<IdentityResource>
            {
                new IdentityResources.OpenId(),
                new IdentityResources.Profile(),
                new IdentityResources.Email()
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
                },

                // Javascript client
                new Client
                {
                    ClientId = "js_oidc",
                    ClientName = "Javascript Client",
                    AllowedGrantTypes = GrantTypes.Implicit,
                    AllowAccessTokensViaBrowser = true,

                    AbsoluteRefreshTokenLifetime = 200,
                    IdentityTokenLifetime = 15,
                    AccessTokenLifetime = 100,
                    AuthorizationCodeLifetime = 15,
                    SlidingRefreshTokenLifetime = 120,

                    RedirectUris =
                    {
                        "http://localhost:5005/callback.html",
                        "http://localhost:5005/silent.html"
                    },
                    PostLogoutRedirectUris = { "http://localhost:5005/index.html" },
                    AllowedCorsOrigins =     { "http://localhost:5005" },

                    AllowedScopes =
                    {
                        IdentityServerConstants.StandardScopes.OpenId,
                        IdentityServerConstants.StandardScopes.Profile,
                        IdentityServerConstants.StandardScopes.Email,
                        "api1"
                    }
                }
            };
        }
    }
}
