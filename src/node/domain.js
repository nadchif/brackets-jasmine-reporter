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
   * @param {Object<string, string>} params the Jasmine spec file
   * @param {Function} callback
   * @return {void} The test resluts
   */
  const cmdRunTests = (params, callback) => {
    const tempRes = {
      specs: [],
      suites: [],
      params
    };
    // jasmine.loadConfigFile(params.config);
    jasmine.addReporter({
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
      }
    });
    jasmine.randomizeTests(false);
    jasmine.onComplete(() => callback(null, tempRes));
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
        'runTests', // command name
        cmdRunTests, // command handler function
        true, // this command is synchronous in Node
        'Returns the test results from Jasmine',
        [
          {
            name: 'params', // parameters
            type: 'Object',
            description: 'the object with spec file, jasmine.json path, callback'
          }
        ],
        []
    );
  }
  exports.init = init;
})();
