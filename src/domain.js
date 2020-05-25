/* jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/* global */

(function() {
  'use strict';

  const Jasmine = require('jasmine');

  /**
   * @private
   * Handler function for the Run Test command
   * @param {object} params the Jasmine spec file
   * @return {object} The test resluts
   */

  const cmdRunTest = (params, callback) => {
    const jasmine = new Jasmine();
    // jasmine.loadConfigFile('spec/support/jasmine.json');
    const tempRes = {
      specs: [],
      suites: []
    };
    const jsonReporter = {
      jasmineStarted: function(suiteInfo) {
        tempRes['start_info'] = suiteInfo;
      },
      /*
      suiteStarted: function(result) {
        tempRes['suite_started'] = ('Suite started: ' + result.description +
          ' whose full description is: ' + result.fullName);
      },

      specStarted: function(result) {
        tempRes['spec_started'] = ('Spec started: ' + result.description +
          ' whose full description is: ' + result.fullName);
      },
      */
      specDone: function(result) {
        tempRes.specs.push(result);
      },

      suiteDone: function(result) {
        tempRes.suites.push(result);
      },

      jasmineDone: function(result) {
        tempRes['end_info'] = result;
        return callback(null, tempRes);
      }
    };

    jasmine.addReporter(jsonReporter);

    jasmine.execute([params.file]);
  };

  /**
   * Initializes the test domain with several test commands.
   * @param {DomainManager} domainManager The DomainManager for the server
   */
  function init(domainManager) {
    if (!domainManager.hasDomain('ossejasmine')) {
      domainManager.registerDomain('ossejasmine', {major: 0, minor: 1});
    }

    domainManager.registerCommand(
        'ossejasmine', // domain name
        'runTest', // command name
        cmdRunTest, // command handler function
        true, // this command is synchronous in Node
        'Returns the total or free memory on the user\'s system in bytes',
        [
          {
            name: 'params', // parameters
            type: 'object',
            description: 'the object with spec file, jasmine.json path, callback'
          }
        ],
        function(err, results) {

        }
    );
  }
  exports.init = init;
})();
