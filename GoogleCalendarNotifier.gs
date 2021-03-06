
var CONSUMER_KEY = "42";
var CONSUMER_SECRET = "42";



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
  
  // for each calendar in my google account
  for (i in calendars) {
    // if this calendar is not hidden
    if (calendars[i].isHidden() == false) {
      
      var events = calendars[i].getEventsForDay(today);
      
      // for each event in this calendar
      for (j in events) {
        var dateToNotify = events[j].getStartTime().getTime();
        var dateNotification = dateToNotify - (60 * 15 * 1000); //on préviens 15 minutes à l'avance
        
        if (dateNotification > new Date().getTime())
          addAlertOnFitbitDevice(dateNotification, deviceIds);
      };
      
    }
  }
};



// if we use more than one device, all device will receive notifications
function getDevices() {
  
  var options = {
    "oAuthServiceName" : "Fitbit",
    "oAuthUseToken" : "always"
  };

  var res = UrlFetchApp.fetch("https://api.fitbit.com/1/user/-/devices.json", options);
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
  for (i in deviceIds) {
    try {
      UrlFetchApp.fetch("https://api.fitbit.com/1/user/-/devices/tracker/" + deviceIds[i] + "/alarms.json", options);
    } catch (err) {
      Logger.log("Too many events in your calendar, fitbit cannot support all of them...");
    }
  }
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
    
    var res = UrlFetchApp.fetch("https://api.fitbit.com/1/user/-/devices/tracker/" + deviceIds[i] + "/alarms.json", optionsGet);
    var alarms = Utilities.jsonParse(res.getContentText());

    // for each alarm in each device
    for (j in alarms.trackerAlarms) {
      if (alarms.trackerAlarms[j].enabled == false)
        UrlFetchApp.fetch("https://api.fitbit.com/1/user/-/devices/tracker/" + deviceIds[i] + "/alarms/" + alarms.trackerAlarms[j].alarmId + ".json", optionsDelete);
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
  oAuthConfig.setAccessTokenUrl("https://api.fitbit.com/oauth/access_token");
  oAuthConfig.setRequestTokenUrl("https://api.fitbit.com/oauth/request_token");
  oAuthConfig.setAuthorizationUrl("https://api.fitbit.com/oauth/authorize");
  oAuthConfig.setConsumerKey(ScriptProperties.getProperty("fitbitConsumerKey"));
  oAuthConfig.setConsumerSecret(ScriptProperties.getProperty("fitbitConsumerSecret"));
}




function main() {
  checkEventsNextDay();
}
