# Securing a Node API with tokens from IdentityServer4 using JWKS

This quickstart / sample shows how can you secure a Node (Express) API using IdentityServer4 as your security token service.
Specifically, it uses the [JWKS](https://auth0.com/docs/jwks) endpoint and RS256 algorithm.

## Intro

The [IdentityServer4.Samples](https://github.com/IdentityServer/IdentityServer4.Samples) repo contains a sample NodeJsApi implementation.  But this sample is pretty basic and uses the [express-oidc-jwks-verify](https://github.com/PDMLab/express-oidc-jwks-verify) module.  I found that there are some bugs with this module, it's not very robust, and it doesn't emit meaningful error messages.  It also doesn't scale very well as there is no caching and the fact that it will [write out a "tmp.crt" cert file](https://github.com/PDMLab/express-oidc-jwks-verify/blob/master/index.js#L53) to the local disk.  So it's not a production quality module to use in Node apps.

As such, in this sample we will use 2 higher quality modules from [Auth0](https://auth0.com/) to deal with JWTs & JWKS:

- [express-jwt](https://github.com/auth0/express-jwt)
- [jwks-rsa](https://github.com/auth0/node-jwks-rsa)


## Background

For further background on using RS256 & JWKS in Node apps, consider this [excellent article](https://auth0.com/blog/navigating-rs256-and-jwks/) which explains basically how the _jwks-rsa_ module works.

IdentityServer provides a JWKS endpoint at the URI specified with the `jwks_uri` key in the discovery document available from `/.well-known/openid-configuration`. By default, this is located at `/.well-known/openid-configuration/jwks` so in this sample, we can access it at http://localhost:5000/.well-known/openid-configuration/jwks.

## Repo Structure

This repo contains 3 sample projects:

- **idserv4** - Basic IdentityServer4 setup with Client Credentials as per the [Quickstarts #1(https://identityserver4.readthedocs.io/en/release/quickstarts/1_client_credentials.html) from the official docs. The difference being that our ASP.NET Core app is using .NET Core 2.0 and the latest version 2.0.0-rc1 of the IdentityServer4 package instead.  We also setup a self-signed certificate (cert.pfx) for credential signing that will be explained below. When running, this will be accessible at http://localhost:5000
- **console** - Sample .NET Core 2.0 Console app as per the ["Creating the client"](https://identityserver4.readthedocs.io/en/release/quickstarts/1_client_credentials.html#creating-the-client) section from the docs.  This app will obtain the access token from IdentityServer and will use it to call our sample Node API at http://localhost:5002/me
- **node-api** - Our Node Express based sample API which is the whole point of this repo!  This is hosted at http://localhost:5002 by default.  There's only 1 Javascript file (index.js) that shows our implementation, but it's documented with useful comments and should be fairly easy to follow.


## Setup the signing certificate

In order for IdentityServer to support signing JWTs with RS256, we need to configure it to use a signing certificate. This is basically done by supplying an _X509Certificate2_ to the `AddSigningCredential` extension method in our _Startup_:

```C#
// File: idserv4/Startup.cs

public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer()
        .AddSigningCredential(Config.GetSigningCertificate(_env.ContentRootPath))
        .AddInMemoryApiResources(Config.GetApiResources())
        .AddInMemoryClients(Config.GetClients());
}
```

```C#
// File: idserv4/Config.cs

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

...
```

Here we are supplying a self-signed PFX (cert.pfx), generated using OpenSSL as per the [create_signing_cert.sh](https://github.com/IdentityServer/IdentityServer4.Samples/blob/release/NodeJsApi/create_signing_cert.sh) script from the NodeJsApi sample.

### OpenSSL on Windows

As an aside, you can get OpenSSL for Windows [from here](http://slproweb.com/products/Win32OpenSSL.html). For supporting Node development on Windows, I recommend getting the older v1.0.2L instead due to [this](https://stackoverflow.com/questions/38968884/link-fatal-error-lnk1181cannot-open-input-file-c-openssl-win64-lib-libeay32/39270114#39270114).

### Other methods

Instead of using OpenSSL, you can also [use Powershell](https://www.petri.com/create-self-signed-certificate-using-powershell) to generate self-signed certs.


# Securing Node APIs

The main gist of how to do this is defined with the `auth` middleware in our sample Node app:

```javascript
// File: node-api/index.js

// reference to our IdentityServer instance
const issuer = 'http://localhost:5000';     // can potentially use the "iss" claim from the access token instead

// define our authentication middleware
const auth = jwt({
    secret: jwksClient.expressJwtSecret({
        cache: true,        // see https://github.com/auth0/node-jwks-rsa#caching
        rateLimit: true,    // see https://github.com/auth0/node-jwks-rsa#rate-limiting
        jwksRequestsPerMinute: 2,
        jwksUri: `${issuer}/.well-known/openid-configuration/jwks`
    }),

    // validate the audience & issuer from received token vs JWKS endpoint
    audience: 'api1',
    issuer: issuer,
    algorithms: ['RS256']
});

...
```
Here we specify our IdentityServer4 instance (http://localhost:5000), and setup some options on the `jwks-rsa` module. This module supports validating the scope in the token against a specific audience (`api1` in this case).

# How to use

1. Clone this repo:
    ```bash
    git clone https://github.com/lyphtec/idserv4-node-jwks
    cd idserv4-node-jwks
    ```
1. Run IdentityServer:
    ```bash
    cd src/idserv4
    dotnet restore
    dotnet build
    dotnet run
    ```
    Check that it's up & running at http://localhost:5000/.well-known/openid-configuration

    Check that JWKS endpoint has been setup correctly with RS256 at http://localhost:5000/.well-known/openid-configuration/jwks.  There should be `x5t` & `x5c` properties for the JWK. _x5c_ is the public key of our certificate.
1. Open a new console & startup the Node API:
    ```bash
    cd src/node-api
    yarn install    # (or npm install)
    yarn start      # (or npm start)
    ```
    Check that it's up & running at http://localhost:5002.  It should return "Hello"

    If we try to access the "secured" API at http://localhost:5002/me using a browser, it should return a 401 as we haven't passed the access token into the authorization _Bearer_ header.
1. Open another console & run the sample "console" app:
    ```bash
    cd /src/console
    dotnet restore
    dotnet build
    dotnet run
    ```
    The decoded payload from the access token should match the claims returned from the secured Node API endpoint.