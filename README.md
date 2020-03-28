# delivery-slot-bot
A puppeteer based bot to monitor supermarket online delivery slots. Currently it only works with Tesco.net and uses Pushover.net to send push notifications to your phone.
## Installation and configuration
Clone this repository, and install depdencies using yarn
  
    git clone git@github.com:paulmaunders/delivery-slot-bot.git 
    cd delivery-slot-bot
    npm install yarn -g
    yarn install
  
Clone the example config to config.ini and add your account details

    cp config.ini.example config.ini
    vim config.ini
    
Set the following values:

* tesco_username - Your username for tesco.net 
* tesco_password - Your password for tesco.net

To receive push notifications, you need to create an account with [pushover.net](pushover.net) and install the Pushover app on your phone.

* pushover_api_token - API token from Pushover
* pushover_notification_users[] - Array of Pushover user keys who wish to receive push notifications
