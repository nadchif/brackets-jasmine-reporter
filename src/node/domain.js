/* jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/* global */

(function() {
  'use strict';

  const Jasmine = require('jasmine');

  const jasmine = new Jasmine();
  /**
   * @private
   * Handler function for the Run Test command
   * @param {object} params the Jasmine spec file
   * @return {object} The test resluts
   */

  const cmdRunTests = (params, callback) => {
    // jasmine.loadConfigFile('spec/support/jasmine.json');
    const tempRes = {
      specs: [],
      suites: []
    };
    const jsonReporter = {
      jasmineStarted: function(suiteInfo) {
        tempRes['start_info'] = suiteInfo;
      },
      specDone: function(result) {
        tempRes.specs.push(result);
      },

      suiteDone: function(result) {
        tempRes.suites.push(result);
      },

      jasmineDone: function(result) {
        tempRes['end_info'] = result;
        callback(null, tempRes);
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
    if (!domainManager.hasDomain('bracketsJasmineTests')) {
      domainManager.registerDomain('bracketsJasmineTests', {major: 0, minor: 1});
    }

    domainManager.registerCommand(
        'bracketsJasmineTests', // domain name
        'runTest', // command name
        cmdRunTests, // command handler function
        true, // this command is synchronous in Node
        'Returns the total or free memory on the user\'s system in bytes',
        [
          {
            name: 'params', // parameters
            type: 'object',
            description: 'the object with spec file, jasmine.json path, callback'
          }
        ],
        []
    );
  }
  exports.init = init;
})();
