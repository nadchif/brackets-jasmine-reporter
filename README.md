# brackets-jasmine-reporter [WIP]

[![first-timers-only](https://img.shields.io/badge/first--timers--only-friendly-blue.svg?style=flat-square)](https://www.firsttimersonly.com/)
[<img src="https://img.shields.io/badge/slack-@ossenthusiasts-brown.svg?logo=slack">](https://join.slack.com/t/ossenthusiasts/shared_invite/zt-eh9g0u7k-l2uUmCCBhUTHY8EWZFShIw)

brackets-jasmine-reporter is a extension for [Adobe Brackets](https://brackets.io
). This extension gives in [Jasmine](https://jasmine.github.io/) test results feedback within the IDE

![Brackets Extension Demo](https://github.com/nadchif/brackets-jasmine/raw/master/screenshots/brackets-jasmine-scr.gif)
<details>
  <summary>
    Click here for more screenshots
  </summary>
  
  ![Brackets Extension Demo](https://github.com/nadchif/brackets-jasmine/raw/master/screenshots/brackets-jasmine-still.png)
  
</details>

## Features
* Automatically starting Jasmine reporting when a `/spec/support/jasmine.json` is found in the workspace
* Show results inside the code inspector
* Shows the errors next to the expect functions.
* Automatically runs tests on save, if the project workspace includes a `/spec/support/jasmine.json` 

## Installation and Usage
* Download and install using the brackets extension manager or downloading it from [Brackets Registry](https://registry.brackets.io/)
* Install [Node.js](https://nodejs.org/en/download/)
* Install Jasmine globally
  ```
  npm install -g jasmine
  ```
* Enjoy!

## License
[Apache 2.0](https://github.com/nadchif/brackets-jasmine/blob/master/LICENSE)

## Contributions
Contributions and suggestions are very welcome and wanted. I try to respond to pull requests within 48 hours. For more information see [CONTRIBUTING.md](https://github.com/nadchif/brackets-jasmine/blob/master/CONTRIBUTING.md).

## Other possible features
* Intellisense for Jasmine
* Add snippets
* Coverage reports
