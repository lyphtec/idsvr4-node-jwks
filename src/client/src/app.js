const config = {
    authority: 'http://localhost:5000/',
    client_id: 'js_oidc',
    redirect_uri: window.location.origin + '/callback.html',
    post_logout_redirect_uri: window.location.origin + '/index.html',

    popup_redirect_uri: window.location.origin + '/popup.html',
    popupWindowFeatures: 'menubar=yes,location=yes,toolbar=yes,width=1200,height=800,left=100,top=100;resizable=yes',

    response_type: 'id_token token',
    scope: 'openid profile email api1',

    // this will toggle if profile endpoint is used
    loadUserInfo: true,

    // silent renew will get a new access_token via an iframe
    // just prior to the old access_token expiring (60 seconds prior)
    silent_redirect_uri: window.location.origin + '/silent.html',
    automaticSilentRenew: true,

    // will revoke (reference) access tokens at logout time
    revokeAccessTokenOnSignout: true,

    // this will allow all the OIDC protocol claims to be visible in the window. normally a client app
    // wouldn't care about them or want them taking up space
    filterProtocolClaims: false
};

Oidc.Log.logger = window.console;
Oidc.Log.level = Oidc.Log.INFO;

const mgr = new Oidc.UserManager(config);

mgr.events.addUserLoaded( (user) => {
    log('User loaded');
    showTokens();
});
mgr.events.addUserUnloaded( () => {
    log('User logged out locally');
    showTokens();
});
mgr.events.addAccessTokenExpiring( () => {
    log('Access token expiring...');
});
mgr.events.addSilentRenewError( (err) => {
    log('Silent renew error: ' + err.message);
});
mgr.events.addUserSignedOut( () => {
    log('User signed out of OP');
});

function login(scope, response_type) {
    const use_popup = false;
    if (!use_popup) {
        mgr.signinRedirect({ scope: scope, response_type: response_type });
    } else {
        mgr.signinPopup({ scope: scope, response_type: response_type }).then( () => {
            log('Logged in');
        });
    }
}

function logout() {
    mgr.signoutRedirect();
}

function revoke() {
    mgr.revokeAccessToken();
}

function callApi() {
    mgr.getUser().then( (user) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = (e) => {
            if (xhr.status >= 400) {
                display('#ajax-result', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    wwwAuthenticate: xhr.getResponseHeader('WWW-Authenticate')
                });
            } else {
                display('#ajax-result', xhr.response);
            }
        };
        xhr.open('GET', 'http://localhost:5002/me', true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + user.access_token);
        xhr.send();
    });
}

if (window.location.hash) {
    handleCallback();
}

[].forEach.call(document.querySelectorAll('.request'), (button) => {
    button.addEventListener('click', function() {
        login(this.dataset['scope'], this.dataset['type']);
    });
});

document.querySelector('.call').addEventListener('click', callApi, false);
document.querySelector('.revoke').addEventListener('click', revoke, false);
document.querySelector('.logout').addEventListener('click', logout, false);


function log(data) {
    document.getElementById('response').innerText = '';

    Array.prototype.forEach.call(arguments, (msg) => {
        if (msg instanceof Error) {
            msg = 'Error: ' + msg.message;
        } else if (typeof msg !== 'string') {
            msg = JSON.stringify(msg, null, 2);
        }
        document.getElementById('response').innerHTML += msg + '\r\n';
    });
}

function display(selector, data) {
    if (data && typeof data === 'string') {
        try {
            data = JSON.parse(data);
        }
        catch(e) {}
    }
    if (data && typeof data !== 'string') {
        data = JSON.stringify(data, null, 2);
    }
    document.querySelector(selector).textContent = data;
}

function showTokens() {
    mgr.getUser().then( (user) => {
        if (user)
            display('#id-token', user);
        else
            log('Not logged in');
    });
}
showTokens();

function handleCallback() {
    mgr.signinRedirectCallback().then( (user) => {
        const hash = window.location.hash.substr(1);
        const result = hash.split('&').reduce( (result, item) => {
            const parts = item.split('=');
            result[parts[0]] = parts[1];
            return result;
        }, {});

        log(result);
        showTokens();

        window.history.replaceState({},
            window.document.title,
            window.location.origin + window.location.pathname);
    }, (error) => {
        log(error);
    });
}
