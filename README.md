# pack-o-bot
A minimal Hearthstone pack tracker that logs packs to pitytracker.com

Pack-o-Bot is reading the games Achievements.log file and sends the data to pitytracker.
The association with pitytrackers user account is created with a token that can be generated on the pitytracker website.
Pack-o-Bot uses a simple data storage to store packs which failed to be submitted to pitytracker in case there is a temporary
connection problem. Pack-o-Bots settings and storage files are in the Apps installation directory.

Due to Pitytrackers pack validation, packs with cards from different sets can not be stored. This applies in general and is
not limited to Pack-o-Bot. Those Packs will automatically be removed from Pack-o-Bots unsent-packs store and are moved to the
users data storage: user.json.

*Disclaimer*
At this is a free time, non profit project. There are no guarantees.
