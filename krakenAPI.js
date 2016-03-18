var https = require('https');

module.exports.getGameList = function(numGames) {
  return new Promise(function(resolve, reject) {
    https.get("https://api.twitch.tv/kraken/games/top?limit="+numGames, function(response) {
      var body = "";
      response.on('data', function(d) {
        body += d;
      });
      response.on('end', function() {
        try {
          resolve(JSON.parse(body));
        } 
        catch(e) {
          reject(e);
        }
      });
    });
  });
};

module.exports.getStreamerList = function(game, numStreamers) {
  return new Promise(function(resolve, reject) {
    https.get("https://api.twitch.tv/kraken/streams?game="+game+"&limit="+numStreamers, function(response) {
      var body = "";
      response.on('data', function(d) {
        body += d;
      });
      response.on('end', function() {
        try {
          resolve(JSON.parse(body));
        } 
        catch(e) {
          reject(e);
        }
      });
    });
  });
};




