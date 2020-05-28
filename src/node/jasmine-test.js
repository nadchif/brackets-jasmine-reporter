const Jasmine = require('jasmine');
const jasmine = new Jasmine();

const printParseable = (data) => {
  process.stdout._handle.setBlocking(true);
  process.stdout.write('---JASMINERESULT---');
  process.stdout.write(JSON.stringify(data));
  process.stdout.write('---JASMINERESULT---');
  process.exit(0);
};

if (process.argv.length < 3) {
  printParseable({
    error: 'expected 2 arguments. [1] spec file, [2] config file'
  });
}

const params = {
  file: process.argv[2],
  config: process.argv[3]
};

const execTest = () => {
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
  jasmine.env.configure({
    captureConsole: false
  });
  jasmine.randomizeTests(false);
  jasmine.onComplete(() => {
    printParseable(tempRes);
  });
  jasmine.execute([params.file]);
};
execTest();
