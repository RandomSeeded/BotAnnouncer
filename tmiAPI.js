var http = require('http');

// This function will resolve its promise when it receives a JSON object from the API. If it does not receive a JSON object, it will try again until it does.
var getChatterCount = module.exports.getChatterCount = function(streamName) {
  return new Promise(function(resolve, reject) {
    http.get("http://tmi.twitch.tv/group/user/"+streamName, function(response) {
      var body = "";
      response.on('data', function(d) {
        body += d;
      });
      response.on('end', function() {
        try {
          resolve(JSON.parse(body));
        } 
        catch(e) {
          resolve(getChatterCount(streamName));
        }
      });
    });
  });
};
