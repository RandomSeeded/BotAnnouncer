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

var makeAnnouncements = module.exports.makeAnnouncements = function(announcements) {
  // NOTE: for the moment this makes all IRC announcements sequentially
  // This should be changed to simultaneously across channels

  var announcement = announcements.splice(0,1)[0];
  var channel = '#'+announcement.channelName;

  return client.join(channel)
  .then(function() {
    return client.say(channel, "Notice: this channel has "+announcement.falseViewers+" fake viewers ("+announcement.percentFalse+"% of total viewers)");
  })
  .then(function() {
    var secondMessage = new Promise(function(resolve, reject) {
      setTimeout(function() {
        client.say(channel, "False positive? Want to learn more? GitHub link is in profile.")
        .then(function() {
          resolve();
        });
      }, _settings.ircMessageTimeout); // Timeout is used to prevent 'sent too fast' prevention of message sending
    });

    return secondMessage;
  })
  .then(function() {
    return client.part(channel);
  })
  .then(function() {
    if (announcements.length > 0) {
      return makeAnnouncements(announcements); // Recursively make all remaining announcements
    }
  });
};

module.exports.disconnect = function() {
  return client.disconnect();
};
