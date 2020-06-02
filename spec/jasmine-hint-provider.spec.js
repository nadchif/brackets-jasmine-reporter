// mock brackets api
const {mockBrackets, mockEditorWithMatch, mockEditorWithNoMatch} =
require('./support/brackets.mock');
global.brackets = mockBrackets;

require('amd-loader');
const {JasmineHintProvider} = require('../src/support/jasmine-hint-provider');

define(function(require, exports, module) {
  describe('/src/support/jasmine-hint-provider.js =>', () => {
    it('should return FALSE when theres a match of hints', ()=>{
      const jasmineHintProvider = new JasmineHintProvider();
      const hasHints = jasmineHintProvider.hasHints(mockEditorWithNoMatch, '(');
      expect(hasHints).toBeFalse();
    });
    it('should return TRUE when theres a match of hints', ()=>{
      const jasmineHintProvider = new JasmineHintProvider();
      const hasHints = jasmineHintProvider.hasHints(mockEditorWithMatch, '(');
      expect(hasHints).toBeTrue();
    });
    it('should return an array of hints when theres a match of hints', ()=>{
      const jasmineHintProvider = new JasmineHintProvider();
      jasmineHintProvider.hasHints(mockEditorWithMatch, '(');
      const getHints = jasmineHintProvider.getHints(mockEditorWithMatch, '(');
      expect(getHints.hints).toBeDefined();
      expect(getHints.hints).toEqual(jasmine.arrayContaining(['describe']));
      expect(getHints.selectInitial).toBeTrue();
    });
  });
});
