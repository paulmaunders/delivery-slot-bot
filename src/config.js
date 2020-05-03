const fs = require("fs");
const ini = require("ini");

module.exports = ini.parse(fs.readFileSync("./config.ini", "utf-8"));
