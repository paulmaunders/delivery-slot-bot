# delivery-slot-bot
A puppeteer based bot to monitor supermarket online delivery slots. Currently works with Tesco and ASDA and uses Pushover.net to send push notifications to your phone.
## Installation and configuration
Clone this repository

    git clone https://github.com/paulmaunders/delivery-slot-bot.git

If not running the application via docker, install the dependencies using yarn

    cd delivery-slot-bot
    npm install yarn -g
    yarn install

Clone the example config to config.ini and add your account details

    cp config.ini.example config.ini
    vim config.ini

Set the following values:

* tesco_username - Your username for tesco.com
* tesco_password - Your password for tesco.com

* asda_username - Your username for asda.com
* asda_password - Your password for asda.com

To receive push notifications, you need to create an account with [pushover.net](https://pushover.net) and install the Pushover app on your phone.

* pushover_api_token - API token from Pushover
* pushover_notification_users[] - Array of Pushover user keys who wish to receive push notifications

## Usage
Run from inside the project folder

    # one-off run
    yarn start
    # continual running with the internal cron scheduler
    yarn start cron

Or alternatively via docker

    docker-compose up

The script should output a list of dates, and whether any slots are available, e.g.

    1585410287236
    Opening https://www.tesco.com/groceries/en-GB/slots/delivery/2020-03-28?slotGroup=1 [Mar 28 - Apr 03]
    No slots
    Opening https://www.tesco.com/groceries/en-GB/slots/delivery/2020-04-04?slotGroup=1 [Apr 04 - 10]
    No slots
    Opening https://www.tesco.com/groceries/en-GB/slots/delivery/2020-04-11?slotGroup=1 [Apr 11 - 17]
    No slots

If a slot is found, it will send an alert to your device with a screenshot of the page so you can confirm.

## Testing push notifications
We recommend you test the push notifications are configured correctly with

    node test-push.js

## Automation

The script by default runs its own cron based on the `cron` setting of the config.ini.

You can, however, schedule it instead externally e.g. via crontab:

    crontab -e

You can then add a line specifying how often you want it to run, and where you want to store the log output, e.g.

    */5 * * * * cd ~/delivery-slot-bot; node delivery-slots.js >> ~/delivery-slot-bot/cron.log 2>&1


## Contributing
You can contribute to the codebase if you set up a Github account, fork this project, and create
a Github Pull Request with your changes.

Your Pull Request will be automatically checked for linting, type checks, and tests.

You can also see these from your own computer by running:

   yarn test

Linting issues can usually be fixed automatically, either by:

* using an editor like
[Visual Studio Code](https://code.visualstudio.com/), with the following plugins:
  * [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  * [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
  * optionally setting up ESLint plugin to fix problems on file save
  * or use the plugin's on-hover fix menu where there are marks showing the issue
  * or right click the file contents and go Source Action -> Fix all ESLint auto-fixable problems
* running `yarn lint:fix`

Type checks and tests can't usually be fixed automatically, but if you are struggling, just ensure
you keep the "Allow edits from maintainers." checkbox ticked so we can potentially resolve it
with you.
