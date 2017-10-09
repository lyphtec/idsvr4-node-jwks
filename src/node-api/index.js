'use strict';

/*
    Resources:
        - https://auth0.com/blog/navigating-rs256-and-jwks/
        - https://github.com/auth0/node-jwks-rsa/tree/master/examples/express-demo
*/

const   express         = require('express'),
        cors            = require('cors'),
        helmet          = require('helmet'),
        morgan          = require('morgan'),
        debug           = require('debug')('app'),      // see https://expressjs.com/en/guide/debugging.html
        errorHandler    = require('errorhandler'),
        jwt             = require('express-jwt'),
        jwksClient      = require('jwks-rsa');

const app = express();
const isDevelopment = (process.env.NODE_ENV === 'development');
const PORT = process.env.PORT || 5002;

app.use(helmet());          // protects app from some well-known web vulnerabilities - see https://expressjs.com/en/advanced/best-practice-security.html#use-helmet
app.use(cors());            // useful if this Node API will be used by other SPA apps - see https://expressjs.com/en/resources/middleware/cors.html
app.use(morgan('dev'));     // HTTP request logger - see https://expressjs.com/en/resources/middleware/morgan.html

if (isDevelopment)
    app.use(errorHandler());    // WARNING: only use this in dev mode to show full error stack traces - see https://expressjs.com/en/resources/middleware/errorhandler.html

// reference to our IdentityServer instance. If we are running in Docker then use service name of IdentityServer.
const issuer = process.env.IS_DOCKER ? 'http://idserv:5000' : 'http://localhost:5000';     // can potentially use the "iss" claim from the access token instead

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

// this is our secured route that represents our Node API that we want to secure using the "auth" middleware we defined above
app.get('/me', auth, (req, res) => {
    // req.user is set by the express-jwt module on successful auth.  It's basically the JSON object of the claims (payload) from the JWT access token
    // Depending on our use case, we can further check the claims to further restrict / have more fine-grained access control to our API
    // Consider using this module: https://github.com/MichielDeMey/express-jwt-permissions

    const user = req.user;
    debug('req.user: %O', user);

    return res.json(user);
});

// this is the unsecured root or home path for our Node app
app.get('/', (req,res) => {
    return res.send('Hello');
});

// catch-all error handler
app.use( (err,req,res,next) => {
    debug('%O', err);
    res.status(err.status || 500)
    
    if (isDevelopment)
        return res.json(err);
});

app.listen(PORT, () => {
    console.log(`API listening at http://localhost:${PORT}`);
});