var _settings = require('./settings.js');
var krakenAPI = require('./krakenAPI.js');
var tmiAPI = require('./tmiAPI.js');

// Retrieve information on the top games and streamers
var getSuspicious = function() {
  return krakenAPI.getGameList(_settings.numGames)
  .then(function(gameList) {
    return getTopStreamsForGames(gameList)
  })
  .then(function(gameList) {
    return getStreamInformation(gameList);
  })
};

console.log('Searching for suspicious channels...');
getSuspicious()
.then(function(results) {
  var suspicious1 = saveSuspicious(results);
  console.log('Waiting to confirm suspicious channels...');

  setTimeout(function() {
    console.log('Confirming suspicious channels...');
    getSuspicious()
    .then(function(results) {
      var suspicious2 = saveSuspicious(results);
      compareSuspicious(suspicious1, suspicious2);
    });
  }, _settings.confirmTimeout);
})

// Retrieves information regarding what the top streamers are for the given games
getTopStreamsForGames = function(gameList) {
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
};

// Retrieves information for all of the provided streams
getStreamInformation = function(gameList) {
  var promises = [];

  for (var i = 0; i < gameList.length; i++) {
    for (var j = 0; j < gameList[i].streams.length; j++) {
      promises.push((function(i, j) {
        return tmiAPI.getChatterCount(gameList[i].streams[j].channel.name)
        .then(function(streamResult) {
          return {
            gameName: gameList[i].streams[j].game,
            channelName: gameList[i].streams[j].channel.name,
            viewerCount: gameList[i].streams[j].viewers,
            chatterCount: streamResult.chatter_count,
            ratio: streamResult.chatter_count / gameList[i].streams[j].viewers,
            falseViewers: gameList[i].streams[j].viewers - streamResult.chatter_count
          }
        });
      })(i, j));
    }
  }

  return Promise.all(promises);
}

saveSuspicious = function(results) {
  var suspicious = results.filter(function(element) {
    return element.ratio < _settings.ratioThreshold && element.viewerCount > _settings.viewerThreshold;
  });

  var results = {};
  suspicious.forEach(function(element) {
    element.percentFalse = Math.floor(10000 * (1 - element.ratio)) / 100;
    results[element.channelName] = element;
  });

  return results;
}

compareSuspicious = function(results1, results2) {
  var confirmed = [];
  for (var streamer in results1) {
    if (results2[streamer]) {
      confirmed.push(results2[streamer]); // Use the most recent results
    }
  }
  confirmed.sort(function(a, b) {
    return b.falseViewers - a.falseViewers;
  });

  console.log("Channels with confirmed false viewers:");
  confirmed.forEach(function(element) {
    console.log("["+element.gameName+"]",element.channelName,"has",element.falseViewers,"false viewers ("+element.percentFalse+"%) | http://twitch.tv/"+element.channelName);
  });
};


