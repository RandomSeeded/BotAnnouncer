## TwitchViewbotDetector

Inspired by https://twitter.com/botdetectorbot

This goes through the most popular Twitch streamers for the top games, and engages in public ~~shaming~~ service announcements.

## Result:

![Results of bot detection](/results.png?raw=true)

## Usage:

**For local checking:**
1. npm install
2. (Optional) Edit settings.js if you want
3. Run "node viewbotDetector.js"

**With IRC module enabled:**

1. npm install
2. Rename ircConfig.example.js to ircConfig.js, and complete with your username and Twitch oauth key
3. (Optional) Edit settings.js
4. Run "node viewbotDetector.js --irc" or "node viewbotDetector.js -i"

## Things to be done in the future:

1. ~~An IRC module which will engage in the actual public shaming service announcements. This will go into the IRC channel of the viewbotting streamer in question and make a notice informing the chat of the botting.~~ **Done**
2. False-positive mitigation. Things important to look for include:
  * Hosting of the stream on 3rd party sites
  * ~~Streams that have just started/closed down can have misleading counts (double-check after period of time)~~ **Done**
  * Other? Let me know!
3. Modification such that this can be run as permanent process, sans cron-job

## Miscellanea:

Rewritten in Node.js, which is delivering very large speedups over the Python version. This is due to the detector being able to send all API requests simultaneously instead of waiting for individual responses. 

