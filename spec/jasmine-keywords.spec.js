require('amd-loader');
const jasmineKeywords = require('../src/support/jasmine-keywords.js')();

define(function(require, exports, module) {
  describe('/src/support/jasmine-keywords.js =>', () => {
    it('should expose keywords array', ()=>{
      expect(jasmineKeywords.keyFunctions).toBeDefined();
    });
    it('should expose a keymatchers array', ()=>{
      expect(jasmineKeywords.keyMatchers).toBeDefined();
    });
  });
});
