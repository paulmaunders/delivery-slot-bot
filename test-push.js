// deprecated, will be removed once npm repository release sorted

const config = require("./src/config");

config.notifiers.forEach((notifier) => notifier.sendMessage("Test message"));
