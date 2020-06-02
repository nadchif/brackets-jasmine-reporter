require('amd-loader');
const jasmineKeywords = require('../src/support/jasmine-keywords.js')();

define(function(require, exports, module) {
  describe('/src/support/jasmine-keywords.js =>', () => {
    it('should have an init method', ()=>{
      expect(jasmineKeywords.keyFunctions).toBeDefined();
    });
    it('should have an init method', ()=>{
      expect(jasmineKeywords.keyMatchers).toBeDefined();
    });
  });
});
