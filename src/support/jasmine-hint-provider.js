/* jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/* global */
define((require, exports, module) => {
  'use strict';
  const CodeHintManager = brackets.getModule('editor/CodeHintManager');
  const LanguageManager = brackets.getModule('language/LanguageManager');
  const {keyFunctions, keyMatchers} = require('./jasmine-keywords')();
  /**
   * Jasmine Hint Provider for brackets
   */
  class JasmineHintProvider {
    /**
     * The constructor
     */
    constructor() {
      this.editor = null;
    }
    /**
     * The method by which the provider indicates intent to provide hints for a given editor
     * @param {Editor} editor
     * @param {String} implicitChar - contains just the last character inserted into the editor's document and the request for hints is implicit
     * @return {Boolean}
     */
    hasHints(editor, implicitChar) {
      this.editor = editor;
      if (implicitChar == null || !/[a-zA-Z().=>{'"]/.test(implicitChar)) {
        return null;
      }
      const cursor = this.editor.getCursorPos();
      const lineBeginning = {line: cursor.line, ch: 0};
      const textBeforeCursor = this.editor.document.getRange(
          lineBeginning,
          cursor
      );
      return this.matchHints(textBeforeCursor).length > 0;
    }
    /**
     * [description]
     * @param {String} implicitChar - contains just the last character inserted into the editor's document and the request for hints is implicit
     * @return {Object}
     */
    getHints(implicitChar) {
      if (implicitChar == null || !/[a-zA-Z().=>{'"]/.test(implicitChar)) {
        return null;
      }
      const cursor = this.editor.getCursorPos();
      const lineBeginning = {line: cursor.line, ch: 0};
      const textBeforeCursor = this.editor.document.getRange(
          lineBeginning,
          cursor
      );
      const hints = this.matchHints(textBeforeCursor);
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
    matchHints(textBeforeCursor) {
      let result;
      // match functions
      const confirmedMatches = [];
      const wordBeforeCursor = textBeforeCursor.match(
          // eslint-disable-next-line max-len
          /((\w+)(|(\("|\('|\()))$|((expect)(\()(.*)(\))(\.))$ |((expect)(\()(.*)(\))(\.)(.*))$/i
      );
      if (!wordBeforeCursor || wordBeforeCursor[0].length < 1) {
        return [];
      }
      keyFunctions.forEach((fnName) => {
        if (fnName.startsWith(wordBeforeCursor[0])) {
          confirmedMatches.push(fnName);
        }
      });
      // match matchers
      if (/((expect)(\()(.*)(\))(\.))$/i.test(textBeforeCursor)) {
        result = confirmedMatches.concat(keyMatchers);
      } else {
        if (/((expect)(\()(.*)(\))(\.)(.*))$/i.test(textBeforeCursor)) {
          const lastInputChars = wordBeforeCursor[0].match(/\)\.(\w+)/);
          keyMatchers.forEach((matcher) => {
            const startString = `).${matcher}`;
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
    insertHint(hint) {
      const cursorPos = this.editor.getCursorPos();
      const line = this.editor.document.getLine(cursorPos.line);
      const textBeforeCursor = line.slice(0, cursorPos.ch);
      const wordBeforeCursor = textBeforeCursor
          // eslint-disable-next-line max-len
          .match(/((\w+)(|(\("|\('|\()))$|((expect)(\()(.*)(\))(\.))$ |((expect)(\()(.*)(\))(\.)(.*))$/i
          );
      if (!wordBeforeCursor || wordBeforeCursor[0].length < 1) {
        return false;
      }
      const start = {
        line: cursorPos.line,
        ch: cursorPos.ch - wordBeforeCursor[0].length
      };
      const end = {line: cursorPos.line, ch: cursorPos.ch};
      /* autocomplete for:
      * ---------------------------------
      *     expect(<anything>).
      * ---------------------------------
      */
      if (/((expect)(\()(.*)(\))(\.))$/i.test(textBeforeCursor)) {
        const filler = /((expect)(\()(.*)(\))(\.))/i.test(textBeforeCursor)? '' : ').';
        this.editor.document.replaceRange(
            `${wordBeforeCursor[0]}${filler}${hint}()`,
            start,
            end
        );
        const pos = this.editor.getCursorPos();
        pos.ch -= 1;
        this.editor.setCursorPos(pos);
        return true;
      }
      /* autocomplete for:
      * ---------------------------------
      *     expect(<anything>).<anything>
      * ---------------------------------
      */
      if (/((expect)(\()(.*)(\))(\.)(.*))$/i.test(textBeforeCursor)) {
        const lastInputChars = wordBeforeCursor[0].match(/\)\.(\w+)/);
        const targetText = wordBeforeCursor[0].slice(
            0,
            wordBeforeCursor[0].length - lastInputChars[0].length
        );
        this.editor.document.replaceRange(
            `${targetText}).${hint}()`,
            start,
            end
        );
        const pos = this.editor.getCursorPos();
        pos.ch -= 1;
        this.editor.setCursorPos(pos);
        return true;
      }
      /* autocomplete for functions like:
      * ---------------------------------
      *     describe
      * ---------------------------------
      */
      if (keyFunctions.includes(hint) && hint != 'expect') {
        this.editor.document.replaceRange(
            `${hint}('', () => {})`,
            start,
            end
        );
        const pos = this.editor.getCursorPos();
        pos.ch -= 12;
        this.editor.setCursorPos(pos);
        return true;
      }
      if (hint == 'expect') {
        this.editor.document.replaceRange(
            `${hint}()`,
            start,
            end
        );
        const pos = this.editor.getCursorPos();
        pos.ch -= 1;
        this.editor.setCursorPos(pos);
        return true;
      }
      /* autocomplete for:
      * ---------------------------------
      *     <anything>
      * ---------------------------------
      */
      this.editor.document.replaceRange(
          hint,
          start,
          end
      );
      return true;
    }
  }
  module.exports = () => {
    const langIds = ['js', 'ts']
        .map((extension) => {
          const language = LanguageManager.getLanguageForExtension(extension);
          return language ? language.getId() : null;
        })
        .filter((x) => x != null);
    CodeHintManager.registerHintProvider(new JasmineHintProvider(), langIds, 1);
  };
});
