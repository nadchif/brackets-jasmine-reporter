"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */

/* global */
define(function (require, exports, module) {
  'use strict';

  var CodeHintManager = brackets.getModule('editor/CodeHintManager');
  var LanguageManager = brackets.getModule('language/LanguageManager');

  var _require = require('./jasmine-keywords')(),
      keyFunctions = _require.keyFunctions,
      keyMatchers = _require.keyMatchers;
  /**
   * Jasmine Hint Provider for brackets
   */


  var JasmineHintProvider = /*#__PURE__*/function () {
    /**
     * The constructor
     */
    function JasmineHintProvider() {
      _classCallCheck(this, JasmineHintProvider);

      this.editor = null;
    }
    /**
     * The method by which the provider indicates intent to provide hints for a given editor
     * @param {Editor} editor
     * @param {String} implicitChar - contains just the last character inserted into the editor's document and the request for hints is implicit
     * @return {Boolean}
     */


    _createClass(JasmineHintProvider, [{
      key: "hasHints",
      value: function hasHints(editor, implicitChar) {
        this.editor = editor;

        if (implicitChar == null || !/[a-zA-Z().=>{'"]/.test(implicitChar)) {
          return null;
        }

        var cursor = this.editor.getCursorPos();
        var lineBeginning = {
          line: cursor.line,
          ch: 0
        };
        var textBeforeCursor = this.editor.document.getRange(lineBeginning, cursor);
        return this.matchHints(textBeforeCursor).length > 0;
      }
      /**
       * [description]
       * @param {String} implicitChar - contains just the last character inserted into the editor's document and the request for hints is implicit
       * @return {Object}
       */

    }, {
      key: "getHints",
      value: function getHints(implicitChar) {
        console.log(implicitChar);

        if (implicitChar == null || !/[a-zA-Z().=>{'"]/.test(implicitChar)) {
          return null;
        }

        var cursor = this.editor.getCursorPos();
        var lineBeginning = {
          line: cursor.line,
          ch: 0
        };
        var textBeforeCursor = this.editor.document.getRange(lineBeginning, cursor);
        var hints = this.matchHints(textBeforeCursor);
        return {
          hints: hints,
          match: null,
          selectInitial: true,
          handleWideResults: false
        };
      }
      /**
       * Finds and matches hints to the available keywords
       * @param {String} textBeforeCursor
       * @return {Array}
       */

    }, {
      key: "matchHints",
      value: function matchHints(textBeforeCursor) {
        var result; // match functions

        var confirmedMatches = [];
        var wordBeforeCursor = textBeforeCursor.match( // eslint-disable-next-line max-len
        /((\w+)(|(\("|\('|\()))$|((expect)(\()(.*)(\))(\.))$ |((expect)(\()(.*)(\))(\.)(.*))$/);

        if (!wordBeforeCursor || wordBeforeCursor[0].length < 2) {
          return [];
        }

        keyFunctions.forEach(function (fnName) {
          if (fnName.startsWith(wordBeforeCursor[0])) {
            confirmedMatches.push(fnName);
          }
        }); // match matchers

        if (/((expect)(\()(.*)(\))(\.))$/.test(textBeforeCursor)) {
          result = confirmedMatches.concat(keyMatchers);
        } else {
          if (/((expect)(\()(.*)(\))(\.)(.*))$/.test(textBeforeCursor)) {
            var lastInputChars = wordBeforeCursor[0].match(/\)\.(\w+)/);
            keyMatchers.forEach(function (matcher) {
              var startString = ").".concat(matcher);

              if (startString.startsWith(lastInputChars[0])) {
                confirmedMatches.push(matcher);
              }
            });
          }

          result = confirmedMatches;
        }

        return result;
      }
      /**
       * Inserts the selected hint
       * @param {String} hint
       * @return {Boolean}
       */

    }, {
      key: "insertHint",
      value: function insertHint(hint) {
        var cursorPos = this.editor.getCursorPos();
        var line = this.editor.document.getLine(cursorPos.line);
        var textBeforeCursor = line.slice(0, cursorPos.ch);
        var wordBeforeCursor = textBeforeCursor // eslint-disable-next-line max-len
        .match(/((\w+)(|(\("|\('|\()))$|((expect)(\()(.*)(\))(\.))$ |((expect)(\()(.*)(\))(\.)(.*))$/);

        if (!wordBeforeCursor || wordBeforeCursor[0].length < 2) {
          return false;
        }

        var start = {
          line: cursorPos.line,
          ch: cursorPos.ch - wordBeforeCursor[0].length
        };
        var end = {
          line: cursorPos.line,
          ch: cursorPos.ch
        };
        console.log('beforecur', wordBeforeCursor[0]);
        /* autocomplete for:
        * ---------------------------------
        *     expect(<anything>).
        * ---------------------------------
        */

        if (/((expect)(\()(.*)(\))(\.))$/.test(textBeforeCursor)) {
          this.editor.document.replaceRange("".concat(wordBeforeCursor[0], ").").concat(hint, "()"), start, end);
          var pos = this.editor.getCursorPos();
          pos.ch -= 1;
          this.editor.setCursorPos(pos);
          return true;
        }
        /* autocomplete for:
        * ---------------------------------
        *     expect(<anything>).<anything>
        * ---------------------------------
        */


        if (/((expect)(\()(.*)(\))(\.)(.*))$/.test(textBeforeCursor)) {
          var lastInputChars = wordBeforeCursor[0].match(/\)\.(\w+)/);
          var targetText = wordBeforeCursor[0].slice(0, wordBeforeCursor[0].length - lastInputChars[0].length);
          this.editor.document.replaceRange("".concat(targetText, ").").concat(hint, "()"), start, end);

          var _pos = this.editor.getCursorPos();

          _pos.ch -= 1;
          this.editor.setCursorPos(_pos);
          return true;
        }
        /* autocomplete for:
        * ---------------------------------
        *     <anything>
        * ---------------------------------
        */


        this.editor.document.replaceRange(hint, start, end);
        return true;
      }
    }]);

    return JasmineHintProvider;
  }();

  module.exports = function () {
    var langIds = ['js', 'ts'].map(function (extension) {
      var language = LanguageManager.getLanguageForExtension(extension);
      return language ? language.getId() : null;
    }).filter(function (x) {
      return x != null;
    });
    CodeHintManager.registerHintProvider(new JasmineHintProvider(), langIds, 1);
  };
});