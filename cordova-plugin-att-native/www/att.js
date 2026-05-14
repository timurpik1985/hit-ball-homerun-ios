var exec = require('cordova/exec');

var ATT = {
    requestPermission: function(success, error) {
        exec(success, error, 'ATTPlugin', 'requestPermission', []);
    },
    
    getStatus: function(success, error) {
        exec(success, error, 'ATTPlugin', 'getStatus', []);
    }
};

module.exports = ATT;
