/* jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/* global */
(function() {
  'use strict';
  const spawn = require('child_process').spawn;
  const cmdRunTests = (params, callback) => {
    let output = '';
    let jasmineNodeChildProcess;
    const args = [`${__dirname}/jasmine-test.js`, params.file, params.config];
    try {
      console.log('Jasmine Wrapper run:', `${process.execPath}, ${JSON.stringify(args)}`);
      jasmineNodeChildProcess = spawn(process.execPath, args, {
        windowsHide: true
      });
    } catch (err) {
      console.error('Jasmine Wrapper error', err);
      return callback(err);
    }
    jasmineNodeChildProcess.stderr.on('data', function(data) {
      output += data.toString();
    });
    jasmineNodeChildProcess.stdout.on('data', function(data) {
      output += data.toString();
    });
    jasmineNodeChildProcess.on('exit', function(code, signal) {
      console.log('Jasmine Wrapper exit. Code = %s', code);
      return callback(null, output);
    });
  };
  /**
   * Initializes the test domain with several test commands.
   * @param {DomainManager} domainManager The DomainManager for the server
   */
  function init(domainManager) {
    if (!domainManager.hasDomain('bracketsJasmineTests')) {
      domainManager.registerDomain('bracketsJasmineTests', {
        major: 0,
        minor: 1
      });
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
        [
          {
            name: 'result',
            type: 'string',
            description: 'The result of the execution'
          }
        ]
    );
  }
  exports.init = init;
})();
