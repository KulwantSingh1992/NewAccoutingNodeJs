function authRequest() {
    var opts = {
        name: 'Authenticate',
        group: 'Authenticate Service',
        path: '/mk/user/sd/login',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    
    return opts;
}

exports.calls = {
    GetSellerId: function () {
        return new authRequest({});
    }
};