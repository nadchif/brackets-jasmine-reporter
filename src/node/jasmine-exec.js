/**
 * Wrapper to execute and output the jasmine tests
 */

const Jasmine = require('jasmine');
const jasmine = new Jasmine();

/**
 * Prints out a JSON string of the data that can be parsed by decoding string between '---JASMINERESULT---'
 * @param   {any}  data  any type of data
 * @return  {void}
 */
const printParseable = (data) => {
  process.stdout._handle.setBlocking(true);
  process.stdout.write(' ---JASMINERESULT---');
  process.stdout.write(JSON.stringify(data));
  process.stdout.write('---JASMINERESULT--- ');
  process.exit(0);
};
/**
 * executes the Jasmine test
 * @param {String} specFile full file path to the spec file to be tested
 * @param {String} configFile full file path to the jasmine config file
 */
const execTest = (specFile, configFile) => {
  /**
   * The object that contains the results from the Jasmine Reporter
   * @type {Object<string, any>}
   */
  const report = {
    specs: [],
    suites: [],
    params: {
      specFile,
      configFile
    }
  };
  // jasmine.loadConfigFile(params.config);
  jasmine.addReporter({
    jasmineStarted: function(suiteInfo) {
      report['start_info'] = suiteInfo;
    },
    specDone: function(result) {
      report.specs.push(result);
    },
    suiteDone: function(result) {
      report.suites.push(result);
    },
    jasmineDone: function(result) {
      report['end_info'] = result;
    }
  });
  jasmine.env.configure({
    captureConsole: false
  });
  jasmine.randomizeTests(false);
  jasmine.onComplete(() => {
    printParseable(report);
  });
  jasmine.execute([specFile]);
};

// check if the arguments spec file and config file have been provided
if (process.argv.length < 3) {
  printParseable({
    error: 'expected 2 arguments. [1] spec file, [2] config file'
  });
};

// execute the tests
execTest(process.argv[2], process.argv[3]);
