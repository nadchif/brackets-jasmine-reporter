/* jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/* global */

define((require, exports, module) => {
  'use strict';

  const keywordList = {
    keyFunctions: [
      'describe',
      'it',
      'beforeEach',
      'beforeAll',
      'afterEach',
      'afterAll',
      'expect'
    ],
    keyMatchers: [
      'toBe',
      'toBeCloseTo',
      'toBeDefined',
      'toBeFalse',
      'toBeFalsy',
      'toBeGreaterThan',
      'toBeGreaterThanOrEqual',
      'toBeInstanceOf',
      'toBeLessThan',
      'toBeLessThanOrEqual',
      'toBeNaN',
      'toBeNegativeInfinity',
      'toBeNull',
      'toBePositiveInfinity',
      'toBeTrue',
      'toBeTruthy',
      'toBeUndefined',
      'toContain',
      'toEqual',
      'toHaveBeenCalled',
      'toHaveBeenCalledBefore',
      'toHaveBeenCalledTimes',
      'toHaveBeenCalledWith',
      'toHaveClass',
      'toHaveSize',
      'toMatch',
      'toThrow',
      'toThrowError',
      'toThrowMatching()'
    ]
  };

  module.exports = () => keywordList;
});
