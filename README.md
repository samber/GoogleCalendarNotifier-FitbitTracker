GoogleCalendarNotifier-FitbitTracker
====================================

Google Calendar notifier for Fitbit Tracker

This script will notify you 15 minutes before each meeting of your google calendar account, with the tracker alarm of your Fitbit health assistant (little vibration).

It's a Google script : you need to create an hourly event trigger, on the main function, to send notifications on your Fitbit device.
You should set your Fitbit app on your smartphone with an automated sync.

Enjoy !



---------------
@todo :
  - Property choice of a notification 30 minutes before the event or whatever. Or, create a specific notification in a event.
  - Create a little interface to configure consumer_key and consumer_secret tokens.
  - Create a little interface to configure the timezone, or take Gmail's.
