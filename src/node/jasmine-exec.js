const Jasmine = require('jasmine');
const jasmine = new Jasmine();
/**
 * Prints out a JSON string of the data that can be parsed by decoding string between '---JASMINERESULT---'
 * @param   {any}  data  any type of data
 * @return  {void}
 */
const printParseable = (data) => {
  process.stdout._handle.setBlocking(true);
  process.stdout.write('---JASMINERESULT---');
  process.stdout.write(JSON.stringify(data));
  process.stdout.write('---JASMINERESULT---');
  process.exit(0);
};
// check if the arguments spec file and config file have been provided
if (process.argv.length < 3) {
  printParseable({
    error: 'expected 2 arguments. [1] spec file, [2] config file'
  });
}
// parameters
const params = {
  file: process.argv[2],
  config: process.argv[3]
};
/**
 * executes the Jasmine test
 */
const execTest = () => {
  /**
   * The object that contains the results from the Jasmine Reporter
   * @type {Object<string, any>}
   */
  const report = {
    specs: [],
    suites: [],
    params
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
  jasmine.execute([params.file]);
};
execTest();
