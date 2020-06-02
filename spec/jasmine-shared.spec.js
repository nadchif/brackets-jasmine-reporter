require('amd-loader');
const {
  matchesSpecPattern,
  getFeedbackLines
} = require('../src/support/jasmine-shared.js');
// mock brackets api
const {
  mockFilePath,
  mockTestCode
} = require('./support/brackets.mock');

define(function(require, exports, module) {
  describe('/src/support/jasmine-shared.js =>', () => {
    describe('matchesSpecPattern =>', () => {
      it('should return FALSE when provided a filename/path that does not match the jasmine spec naming patten', () => {
        expect(matchesSpecPattern('test.js')).toBeFalse();
        expect(matchesSpecPattern('spec-test.js')).toBeFalse();
      });
      it('should return TRUE when provided a filename/path that does not match the jasmine spec naming patten', () => {
        expect(matchesSpecPattern('test.spec.js')).toBeTrue();
        expect(matchesSpecPattern('test.Spec.js')).toBeTrue();
      });
    });
    describe('getFeedbackLines =>', () => {
      it('should return an object with numbers of lines that contain errors', () => {
        const codeLines = mockTestCode.split('\n');
        const mockSpec = {
          id: 'spec1',
          description: 'should fail second test',
          fullName: 'dummy test should fail second test',
          failedExpectations: [
            {
              matcherName: 'toEqual',
              message: 'Expected 1 to equal 2.',
              stack:
                'Error: Expected 1 to equal 2.\n    at <Jasmine>\n    at UserContext.it (/Users/demouser/Library/Application Support/Brackets/extensions/user/brackets-jasmine-reporter/spec/support/dummy.spec.js:6:19)\n    at <Jasmine>',
              passed: false,
              expected: 2,
              actual: 1
            },
            {
              matcherName: 'toEqual',
              message: 'Expected 2 to equal 3.',
              stack:
                'Error: Expected 2 to equal 3.\n    at <Jasmine>\n    at UserContext.it (/Users/demouser/Library/Application Support/Brackets/extensions/user/brackets-jasmine-reporter/spec/support/dummy.spec.js:8:19)\n    at <Jasmine>',
              passed: false,
              expected: 3,
              actual: 2
            }
          ],
          passedExpectations: [
            {
              matcherName: 'toEqual',
              message: 'Passed.',
              stack: '',
              passed: true
            }
          ],
          deprecationWarnings: [],
          pendingReason: '',
          duration: null,
          status: 'failed'
        };
        const expectedObj = {
          0: 5,
          1: 7
        };
        const result = getFeedbackLines(
            mockSpec,
            codeLines,
            '/Users/demouser/Library/Application Support/Brackets/extensions/user/brackets-jasmine-reporter/spec/support/dummy.spec.js'
        );
        expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedObj));
      });
      it('should return an object with key 0 and line number of passing test', () => {
        const codeLines = mockTestCode.split('\n');
        const mockSpec = {
          id: 'spec0',
          description: 'should pass first test',
          fullName: 'dummy test should pass first test',
          failedExpectations: [],
          passedExpectations: [
            {
              matcherName: 'toEqual',
              message: 'Passed.',
              stack: '',
              passed: true
            }
          ],
          deprecationWarnings: [],
          pendingReason: '',
          duration: null,
          status: 'passed'
        };
        const expectedObj = {0: 2};
        const result = getFeedbackLines(
            mockSpec,
            codeLines,
            mockFilePath
        );
        expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedObj));
      });
    });
  });
});
