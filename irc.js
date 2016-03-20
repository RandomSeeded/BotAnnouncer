var irc = require('tmi.js');
var _settings = require('./settings.js');
var _config = require('./ircConfig.js');

var clientOptions = {
  options: {
    debug: _settings.ircDebug
  },
  identity: {
    username: _config.username,
    password: _config.password
  }
};

var client = new irc.client(clientOptions);
client.connect();

var sendDelayedMessage = function(channel, message, delay) {
  var delayedMessage = new Promise(function(resolve, reject) {
    setTimeout(function() {
      client.say(channel, message)
      .then(function() {
        resolve();
      })
      .catch(function() {
        reject();
      });
    }, delay);
  });

  return delayedMessage;
};

var makeAnnouncements = module.exports.makeAnnouncements = function(announcements) {
  // NOTE: for the moment this makes all IRC announcements sequentially
  // Ideally this would be changed to be simultaneous, but due to spam constraints this is impractical

  var announcement = announcements.splice(0,1)[0];
  var channel = '#'+announcement.channelName;

  return client.join(channel)
  .then(function() {
    return sendDelayedMessage(channel, "Notice: this channel has "+announcement.falseViewers+" fake viewers ("+announcement.percentFalse+"% of total viewers)", _settings.ircChannelTimeout);
  })
  .then(function() {
    return sendDelayedMessage(channel, "False positive? Want to learn more? GitHub link is in profile.", _settings.ircMessageTimeout);
  })
  .then(function() {
    return client.part(channel);
  })
  .then(function() {
    // Recursively re-sends remaining announcements until none remaining
    if (announcements.length > 0) {
      return makeAnnouncements(announcements);
    }
  })
  .catch(function() {
    console.log('Message sending failed, continuing...');
  });
};

module.exports.disconnect = function() {
  return client.disconnect();
};
