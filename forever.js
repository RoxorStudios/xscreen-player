[
  {
    //Player Service
    "ERRFILE": "/var/xscreen-player/Logs/xs_play_error.log",
    "append": true,
    "watch": true,
    "script": "playerService.js",
    "sourceDir": "/var/xscreen-player/Services",
    "minUptime" : 5000,
    "spinSleepTime": 1000,
  },
  {
    //Sync Service
    "ERRFILE": "/var/xscreen-player/Logs/xs_sync_error.log",
    "append": true,
    "watch": true,
    "script": "syncService.js",
    "sourceDir": "/var/xscreen-player/Services",
    "minUptime" : 5000,
    "spinSleepTime": 1000,
  }
]
