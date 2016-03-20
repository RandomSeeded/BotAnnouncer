// Imports
var _settings = require('./settings.js');
var krakenAPI = require('./krakenAPI.js');
var tmiAPI = require('./tmiAPI.js');
var crontab = require('node-crontab');

// Flag-reading
var irc = process.argv.indexOf('--irc') !== -1 || process.argv.indexOf('-i') !== -1;
var repeat = process.argv.indexOf('--repeat') !== -1 || process.argv.indexOf('-r') !== -1;
if (irc) {
  var ircClient = require('./irc.js');
}
console.log("IRC Enabled:", irc);
console.log("Repeat Execution:", repeat);

// Gets lists of suspicious users twice, with significant timeout between
// This cuts down on false positives due to channels going offline
var execute = function() {
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
};

execute();
if (repeat) {
  setInterval(function() {
    execute();
  },_settings.cronTimeout);
}

// Uses APIs to get information on the top games & streamers
function getSuspicious() {
  return krakenAPI.getGameList(_settings.numGames)
  .then(function(gameList) {
    return getTopStreamsForGames(gameList)
  })
  .then(function(gameList) {
    return getStreamInformation(gameList);
  })
};

// Retrieves information regarding what the top streamers are for the given games
function getTopStreamsForGames(gameList) {
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
function getStreamInformation(gameList) {
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

function saveSuspicious(results) {
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

function compareSuspicious(results1, results2) {
  var confirmed = [];
  for (var streamer in results1) {
    if (results2[streamer]) {
      confirmed.push(results2[streamer]); // Use the most recent results
    }
  }
  confirmed.sort(function(a, b) {
    return b.falseViewers - a.falseViewers;
  });

  // Output confirmed viewbotted channels to console
  console.log("Channels with confirmed false viewers:");
  confirmed.forEach(function(element) {
    console.log("["+element.gameName+"]",element.channelName,"has",element.falseViewers,"false viewers ("+element.percentFalse+"%) | http://twitch.tv/"+element.channelName);
  });

  // Output to relevant IRC channels
  if (irc) {
    ircClient.makeAnnouncements(confirmed)
    .then(function() {
      ircClient.disconnect();
    });
  }
};


