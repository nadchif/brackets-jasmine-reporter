/* eslint-disable require-jsdoc */
/*
 * A mock module to simulate the structure of the Brackets module
 * IMPORTANT NOTE: This is not a requireJS module.
 */
const DUMMY_FULLPATH =
  '/Users/demouser/Library/Application Support/Brackets/extensions/user/brackets-jasmine-reporter/spec/support/dummy.spec.js';
const DUMMY_PROJECT_FULLPATH =
  '/Users/demouser/Library/Application Support/Brackets/extensions/user/brackets-jasmine-reporter/';
const mockStatusValues = {
  buttonText: ''
};
const MOCK_TEST_CODE = `
describe('dummy test', () => {
  it('should pass first test', () => {
      expect(1).toEqual(1)
  })
  it('should fail second test', () => {
      expect(1).toEqual(2)
      expect(2).toEqual(2)
      expect(2).toEqual(3)
  })
  it('should pass third test', () => {
      expect(3).toEqual(3)
  })
})`;
const mockBrackets = {
  getModule: (module) => {
    switch (module) {
      case 'document/DocumentManager':
        return {
          getCurrentDocument: () => {
            return {
              file: {
                fullPath: DUMMY_FULLPATH
              }
            };
          }
        };
      case 'widgets/StatusBar':
        return {
          addIndicator: () => {}
        };
      case 'utils/ExtensionUtils':
        return {
          getModulePath: () => {}
        };
      case 'utils/NodeDomain':
        return class NodeDomain {
          constructor() {}
        };
      case 'widgets/DropdownButton':
        return {
          DropdownButton: class DropdownButton {
            constructor() {
              this.$button = {
                text: (status) => (mockStatusValues.buttonText = status)
              };
            }
            on() {}
          }
        };
      case 'language/CodeInspection':
        return {
          register: () => {},
          requestRun: () => {},
          Type: {
            WARNING: 'warning',
            ERROR: 'error',
            META: 'meta'
          }
        };
      case 'project/ProjectManager':
        return {
          on: () => {},
          getProjectRoot: () => {
            return {
              fullPath: DUMMY_PROJECT_FULLPATH
            };
          }
        };
      case 'utils/AppInit':
        return {
          appReady: (fn) => fn()
        };
      case 'filesystem/FileSystem':
        return {
          resolve: (path, callback) => {
            if (
              path ==
              '/Users/demouser/Library/Application Support/Brackets/extensions/user/brackets-jasmine-reporter/spec/support/jasmine.json'
            ) {
              callback(null, {fullPath: DUMMY_FULLPATH});
              return;
            }
            callback('Dummy Error Message: File does not exist', null);
          }
        };
      case 'language/LanguageManager':
        return {
          getLanguageForExtension: () => {
            getId: () => 'js';
          }
        };
      case 'editor/CodeHintManager': {
        return {
          registerHintProvider: () => {}
        };
      }
    }
  }
};

const mockEditorWithMatch = {
  getCursorPos: () => {
    return {
      line: 2,
      ch: 4
    };
  },
  document: {
    getRange: (start, end) => {
      return `    describe`;
    }
  }
};

const mockEditorWithNoMatch = {
  getCursorPos: () => {
    return {
      line: 2,
      ch: 4
    };
  },
  document: {
    getRange: (start, end) => {
      return `    google`;
    }
  }
};

const mockRawResult =
  ' ---JASMINERESULT--- {"specs":[{"id":"spec0","description":"should pass first test","fullName":"dummy test should pass first test","failedExpectations":[],"passedExpectations":[{"matcherName":"toEqual","message":"Passed.","stack":"","passed":true}],"deprecationWarnings":[],"pendingReason":"","duration":null,"status":"passed"},{"id":"spec1","description":"should fail second test","fullName":"dummy test should fail second test","failedExpectations":[{"matcherName":"toEqual","message":"Expected 1 to equal 2.","stack":"Error: Expected 1 to equal 2.\\n    at <Jasmine>\\n    at UserContext.it (/Users/macbookpro/Library/Application Support/Brackets/extensions/user/brackets-jasmine-reporter/spec/dummy.spec.js:7:17)\\n    at <Jasmine>","passed":false,"expected":2,"actual":1},{"matcherName":"toEqual","message":"Expected 2 to equal 3.","stack":"Error: Expected 2 to equal 3.\\n    at <Jasmine>\\n    at UserContext.it (/Users/macbookpro/Library/Application Support/Brackets/extensions/user/brackets-jasmine-reporter/spec/dummy.spec.js:9:17)\\n    at <Jasmine>","passed":false,"expected":3,"actual":2}],"passedExpectations":[{"matcherName":"toEqual","message":"Passed.","stack":"","passed":true}],"deprecationWarnings":[],"pendingReason":"","duration":null,"status":"failed"},{"id":"spec2","description":"should pass third test","fullName":"dummy test should pass third test","failedExpectations":[],"passedExpectations":[{"matcherName":"toEqual","message":"Passed.","stack":"","passed":true}],"deprecationWarnings":[],"pendingReason":"","duration":null,"status":"passed"}],"suites":[{"id":"suite1","description":"dummy test","fullName":"dummy test","failedExpectations":[],"deprecationWarnings":[],"duration":0,"status":"passed"}],"params":{"specFile":"/Users/macbookpro/Library/Application Support/Brackets/extensions/user/brackets-jasmine-reporter/spec/dummy.spec.js","configFile":"/Users/macbookpro/Library/Application Support/Brackets/extensions/user/brackets-jasmine-reporter//spec/support/jasmine.json"},"start_info":{"totalSpecsDefined":3,"order":{"random":false,"seed":"70388"}},"end_info":{"overallStatus":"failed","totalTime":43,"order":{"random":false,"seed":"70388"},"failedExpectations":[],"deprecationWarnings":[]}} ---JASMINERESULT--- ';

module.exports = {
  mockBrackets,
  mockEditorWithMatch,
  mockEditorWithNoMatch,
  mockStatusValues,
  mockTestCode: MOCK_TEST_CODE,
  mockRawResult,
  mockFilePath: DUMMY_FULLPATH
};
