var _settings = require('./settings.js');
var krakenAPI = require('./krakenAPI.js');
var tmiAPI = require('./tmiAPI.js');

// Retrieve information on the top games and streamers
krakenAPI.getGameList(_settings.numGames)
.then(function(gameList) {
  var promises = [];
  for (var i = 0; i < gameList.top.length; i++) {
    promises.push(krakenAPI.getStreamerList(gameList.top[i].game.name, _settings.numStreamersPerGame));
  }
  return Promise.all(promises).then(function(results) {
    return results.map(function(element, index) {
      return {
        game: gameList.top[index].game.name,
        streams: element.streams
      }
    })
  });
})
.then(function(gameList) {
  var promises = [];

  for (var i = 0; i < gameList.length; i++) {
    promises[i] = new Promise(function(resolve, reject) {
      var innerPromises = [];
      for (var j = 0; j < gameList[i].streams.length; j++) {
        innerPromises.push(tmiAPI.getChatterCount(gameList[i].streams[j].channel.name));
      }
      resolve(Promise.all(innerPromises).then(function(values) {
        return values;
      }));
    });
  }

  return Promise.all(promises).then(function(values) {
    return values.map(function(streamersForGame, gameIndex) {
      var streams = streamersForGame.map(function(stream, streamIndex) {
        return {
          name: gameList[gameIndex].streams[streamIndex].channel.name,
          chatterCount: stream.chatter_count,
          viewerCount: gameList[gameIndex].streams[streamIndex].viewers
        };
      });
      return {
        gameName: gameList[gameIndex].game,
        streams: streams
      };
    });
  });
})
.then(function(results) {
  console.log('RESULTS:');
  for (var i = 0; i < results.length; i++) {
    var game = results[i];
    console.log(game.gameName.toUpperCase()+":");
    for (var j = 0; j < game.streams.length; j++) {
      var stream = game.streams[j];
      var ratio = stream.chatterCount / stream.viewerCount;
      if (ratio < _settings.ratioThreshold) {
        var rounded = Math.floor(ratio * 10000);
        var percentage = rounded / 100;
        console.log("Only",percentage+"% of",stream.name+"'s viewers ("+game.gameName+") are in the chat ["+stream.chatterCount+"/"+stream.viewerCount+"]");
      }
    }
  }
})

