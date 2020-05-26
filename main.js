define(function(require, exports, module) {
  'use strict';
  const AppInit = brackets.getModule('utils/AppInit');
  AppInit.appReady(function() {
    require('dist/jasmine-lint')();
  });
});
