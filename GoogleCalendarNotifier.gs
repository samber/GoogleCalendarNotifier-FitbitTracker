

var CONSUMER_KEY = "e80bbb5dfd8847e18059700629807648";
var CONSUMER_SECRET = "f63b2076d1924698b3d3f97f97180e9b";



// get all event during the next day and create a notification for each of them
function checkEventsNextDay() {

  if (ScriptProperties.getProperty("fitbitConsumerKey") == "" || ScriptProperties.getProperty("fitbitConsumerKey") == null
      || ScriptProperties.getProperty("fitbitConsumerSecret") == "" || ScriptProperties.getProperty("fitbitConsumerSecret") == null)
    init();

  //oAuth
  authorize();

  var deviceIds = getDevices();

  clearDisabledAlarm(deviceIds);


  var calendars = CalendarApp.getAllCalendars();
  var today = new Date();

  for (i in calendars) {
    var events = calendars[i].getEventsForDay(today);

    for (j in events) {
      var dateToNotify = events[j].getStartTime().getTime();
      var dateNotification = dateToNotify - (60 * 15 * 1000); //on préviens 15 minutes à l'avance

      if (dateNotification > new Date().getTimes())
        addAlertOnFitbitDevice(dateNotification, deviceIds);
    };
  };
};



// if we use more than one device, all device will receive notifications
function getDevices() {

  var options = {
    "oAuthServiceName" : "Fitbit",
    "oAuthUseToken" : "always"
  };

  var res = UrlFetchApp.fetch("http://api.fitbit.com/1/user/-/devices.json", options);
  var json = Utilities.jsonParse(res.getContentText());

  var ret = [];
  for (i in json) {
    ret.push(json[i].id);
  }

  return (ret);
};



// Is it usefull to explain what do this function ?
function addAlertOnFitbitDevice(timestamp, deviceIds) {
  var date = new Date(timestamp);
  var options = {
    "oAuthServiceName" : "Fitbit",
    "oAuthUseToken" : "always",
    "method":"POST",
    "payload": {
      "time":date.getHours() + ":" + date.getMinutes() + "+01:00",              // ! : @todo: put timezone in db with a management interface
      "enabled":true,
      "recurring":false,
      "weekDays":[],
    }
  };

  // for each device of your account
  for (i in deviceIds)
      UrlFetchApp.fetch("http://api.fitbit.com/1/user/-/devices/tracker/" + deviceIds[i] + "/alarms.json", options);
}



// Each alarm is in mode "recurring:false", so they are disabled after usage.
// Here, we remove old notifications.
function clearDisabledAlarm(deviceIds) {

  var optionsGet = {
    "oAuthServiceName" : "Fitbit",
    "oAuthUseToken" : "always",
    "method":"GET",
  };
  var optionsDelete = {
    "oAuthServiceName" : "Fitbit",
    "oAuthUseToken" : "always",
    "method":"DELETE",
  };

  // for each device
  for (i in deviceIds) {

    var res = UrlFetchApp.fetch("http://api.fitbit.com/1/user/-/devices/tracker/" + deviceIds[i] + "/alarms.json", optionsGet);
    var alarms = Utilities.jsonParse(res.getContentText());

    // for each alarm in each device
    for (j in alarms.trackerAlarms) {
      if (alarms.trackerAlarms[j].enabled == false)
        UrlFetchApp.fetch("http://api.fitbit.com/1/user/-/devices/tracker/" + deviceIds[i] + "/alarms/" + alarms.trackerAlarms[j].alarmId + ".json", optionsDelete);
    }

  }
};





// if it's a new app : put consumer_key and consumer_secret in db
// @todo : dvp a interface to add theses values and remove variables higher in this file
function init() {
  ScriptProperties.setProperty("fitbitConsumerKey", CONSUMER_KEY);
  ScriptProperties.setProperty("fitbitConsumerSecret", CONSUMER_SECRET);
};





// OAuth authentification to fitbit API
function authorize() {
  var oAuthConfig = UrlFetchApp.addOAuthService("Fitbit");
  oAuthConfig.setAccessTokenUrl("http://api.fitbit.com/oauth/access_token");
  oAuthConfig.setRequestTokenUrl("http://api.fitbit.com/oauth/request_token");
  oAuthConfig.setAuthorizationUrl("http://api.fitbit.com/oauth/authorize");
  oAuthConfig.setConsumerKey(ScriptProperties.getProperty("fitbitConsumerKey"));
  oAuthConfig.setConsumerSecret(ScriptProperties.getProperty("fitbitConsumerSecret"));
}




function main() {
  checkEventsNextDay();
}
