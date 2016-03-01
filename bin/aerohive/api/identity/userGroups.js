var apiRequest = require(appRoot + "/bin/aerohive/api/req").apiRequest;


module.exports = function (vpcUrl, accessToken, ownerID, memberOf, adUser, callback) {
    var path = "/xapi/v1/identity/userGroups?ownerId="+ownerID;
    if (memberOf) path += '&memberOf=' + memberOf;
    if (adUser) path += '&adUser=' + adUser;
    apiRequest(vpcUrl, accessToken, path, function (err, result) {
        if (err){
            callback(err, null);
        } else if (result){
            callback(null, result);
        } else {
            callback(null, null);
        }
    })
};