// Entry point kept for the GitHub Action, refresh-streak.ps1 and the Telegram bot,
// which all run `node build/stats.js`. The card itself is built by profile.js.
require('./profile.js');
