/* jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/* global */
define((require, exports, module) => {
  'use strict';
  /**
   * Locates the line related to the spec (for error reporting)
   * @param   {Object<String, String>}  spec      the spec result
   * @param   {Array} lintedCodeLines an array of lines of code for the current doc
   * @param   {String}  fileName  the fullpath to the file being linted
   * @return  {Object<Number, Number>} object that pairs (expectation: line of feedback)
   */
  const getFeedbackLines = (spec, lintedCodeLines, fileName) => {
    const result = {};
    if (spec.status == 'passed') {
      const reg =
        'it([ ]{0,1})\\([ ]{0,1}(?:\'|")(' + spec.description + ')(?:\'|")';
      const lineMatcher = new RegExp(reg, 'g');
      let lineNo = 0;
      for (let i = 0; i < lintedCodeLines.length; i++) {
        const stackString = lintedCodeLines[i];
        const fileTroubleLine = stackString.match(lineMatcher);
        if (fileTroubleLine) {
          lineNo = i;
          break;
        }
      }
      result[0] = lineNo;
      return result;
    }
    const reg = ':([0-9]+):([0-9]+)(\\))$';
    const lineMatcher = new RegExp(reg, 'gm');
    spec.failedExpectations.forEach((failedExpect, index)=>{
      const stackString = spec.failedExpectations[index].stack;
      const fileTroubleLine = stackString.match(lineMatcher);
      if (fileTroubleLine) {
        const parts = fileTroubleLine[0].split(':');
        const line = parseInt(parts[1]) - 1;
        result[index] = (line > 0 ? line : 0);
      }
    });
    return result;
  };
  /**
   * Checks if a filename matches the Jasmine spec naming patterns
   * @param   {String}  filename  filepath and name
   * @return  {Boolean} true if file pattern matches the spec pattern
   */
  const matchesSpecPattern = (filename) => {
    // @todo load the project config jasmine.json and determine patten match from there
    return filename.toLowerCase().endsWith('spec.js');
  };

  // export methods
  module.exports = {
    matchesSpecPattern,
    getFeedbackLines
  };
});
