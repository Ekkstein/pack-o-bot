# pack-o-bot
A minimal Hearthstone pack tracker that logs packs to pitytracker.com

Pack-o-Bot is reading the games Achievements.log file and sends the data to pitytracker.
If you find that packs have not been submitted, you can find the data in >hs_install_dir</Hearthstones/Logs/Achievements.log file **before you quit and relaunch Hearthstone**. *Relaunching Hearthstone flushes the Achievements.log file.*
Pack-o-Bot will resubmit data even if it is pasted manually into the Achievements.log file.

The association with pitytrackers user account is created with a token that can be generated on the pitytracker website.
Pack-o-Bot uses a simple data storage to store packs which failed to be submitted to pitytracker in case there is a temporary
connection problem. Pack-o-Bots settings and storage files are in the Apps installation directory.

Due to Pitytrackers pack validation, packs with cards from different sets can not be stored. This applies in general and is
not limited to Pack-o-Bot. Those Packs will automatically be removed from Pack-o-Bots unsent-packs store and are moved to the
users data storage: user.json.


**Disclaimer**
Pack-o-Bot is a free time, non profit project that is considered early beta phase. Use at your own risk and pay occasional attention, that things are working as expected. 
