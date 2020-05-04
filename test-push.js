// deprecated, will be removed once npm repository release sorted

const notifiers = require("./src/notifiers");

notifiers.forEach((notifier) => notifier.sendMessage("Test message"));
