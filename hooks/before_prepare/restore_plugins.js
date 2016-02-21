#!/usr/bin/env node

/**
 * Hack to get the plugins to auto-restore.
 */
var cordova = require("cordova");
var ConfigParser = cordova.cordova_lib.configparser;

var cfg = new ConfigParser("config.xml");
cfg.getPluginIdList().forEach(function(featureId) {
  cordova.plugin("add", featureId); // doesn't respect `spec`
})
