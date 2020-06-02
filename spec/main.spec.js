// mock brackets api
const {
  mockBrackets,
  mockStatusValues,
  mockTestCode,
  mockFilePath,
  mockRawResult
} = require('./support/brackets.mock');
global.brackets = mockBrackets;
global.$ = require('jquery');

require('amd-loader');

define(function(require, exports, module) {
  const main = require('../src/main');
  describe('main.js =>', () => {
    describe('updateStatus =>', () => {
      it('should update statusbar button to match extension status', () => {
        main.updateStatus();
        expect(mockStatusValues.buttonText).not.toEqual('');
      });
    });
    describe('resolveConfigFile =>', () => {
      it('should set hasJasmineConfig to TRUE if the file resolves', () => {
        main.resolveConfigFile(
            '/Users/demouser/Library/Application Support/Brackets/extensions/user/brackets-jasmine-reporter/'
        );
        expect(main.hasJasmineConfig).toBeTrue();
      });
    });
    describe('generateReport =>', () => {
      it('should return an object with reportData and gutterReportData', () => {
        const result = main.generateReport(
            mockRawResult,
            mockFilePath,
            mockTestCode
        );
        expect(Object.keys(result)).toEqual(
            jasmine.arrayContaining(['reportData', 'gutterReportData'])
        );
      });
      describe('reportData.errors => ', () => {
        it('should return an array with error objects containing line numbers', () => {
          const result = main.generateReport(
              mockRawResult,
              mockFilePath,
              mockTestCode
          );
          expect(result.reportData.errors[0].pos.line).toBeGreaterThanOrEqual(
              1
          );
        });
      });
    });
  });
});
