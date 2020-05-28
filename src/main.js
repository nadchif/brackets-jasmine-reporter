define(function(require, exports, module) {
  'use strict';
  const AppInit = brackets.getModule('utils/AppInit');
  const CodeInspection = brackets.getModule('language/CodeInspection');
  const ExtensionUtils = brackets.getModule('utils/ExtensionUtils');
  const NodeDomain = brackets.getModule('utils/NodeDomain');
  const FileSystem = brackets.getModule('filesystem/FileSystem');
  const ProjectManager = brackets.getModule('project/ProjectManager');
  const StatusBar = brackets.getModule('widgets/StatusBar');
  const DropdownButton = brackets.getModule('widgets/DropdownButton');

  /**
   * Unique name of this Brackets extension
   * @type {String}
   */
  const EXTENSION_UNIQUE_NAME = 'nadchif.BracketsJasmine';
  /**
   * Indicates whether the current workspace/project has a /spec/support/jasmine.json file.
   * @type {Boolean}
   */
  let hasJasmineConfig = false;
  /**
   * Path to the active jasmine.json config file
   * @type {String}
   */
  let configFilePath;

  /**
   * Array of code lines for the document that was linted
   * @type {Array}
   */
  let lintedCodeLines = [];

  /**
   * Indicates that Jasmine tests are currently running
   * @type {Boolean}
   */
  let isWorking = false;

  /**
   * Indicates that tests are running as a reattempt resulting from a possible Node failure
   * @type {Boolean}
   */
  let isReattemptRun = false;

  /**
   * The Node Domain that we will be using for this extension
   * @type {NodeDomain}
   */
  const bracketsJasmineDomain = new NodeDomain(
      'bracketsJasmineTests',
      ExtensionUtils.getModulePath(module, 'node/domain')
  );
  /**
   * The status bar dropdown button that presents the options
   *  - Run Test
   *  - Enable/Disable
   */
  const statusDropDownBtn = new DropdownButton.DropdownButton('Jasmine Tests', [
    ' Run Tests',
    'Enable/Disable'
  ]);
  statusDropDownBtn.on('select', function(event, item, itemIndex) {
    switch (itemIndex) {
      case 1:
        // Enable/Disable automatic Jasmine Tests from running on save
        hasJasmineConfig = !hasJasmineConfig;
        updateStatus();
        break;
      case 0:
        // Request CodeInspection to lint current file, which in turn will trigger JasmineTests to lint
        CodeInspection.requestRun();
        break;
    }
  });

  /**
   * Locates the line related to the spec (for error reporting)
   * @param   {Object<String, String>}  spec      the spec result
   * @param   {String}  fileName  the fullpath to the file being linted
   * @return  {Number} the line number
   */
  const extractLine = (spec, fileName) => {
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
      return lineNo;
    }
    const reg = fileName + ':([0-9]+)';
    const lineMatcher = new RegExp(reg, 'g');
    const stackString = spec.failedExpectations[0].stack;
    const fileTroubleLine = stackString.match(lineMatcher);
    if (fileTroubleLine) {
      const parts = fileTroubleLine[0].split(':');
      const line = parseInt(parts[parts.length - 1]) - 1;
      return line > 0 ? line : 0;
    }
    return 0;
  };

  /**
   * Generates CodeInspection ready reports
   *
   * @param   {Object}  results   results object of the file being linted
   * @param   {String}  fileName  fullpath to the file being linted
   * @param   {String}  text      The text being linted
   *
   * @return  {Object<String, Object>}            [return description]
   */
  const generateReport = (results, fileName, text) => {
    lintedCodeLines = text.split('\n');
    const reportData = {
      errors: []
    };
    const gutterReportData = {
      errors: []
    };
    results.specs.forEach((spec) => {
      let message;
      if (spec.status == 'passed') {
        // eslint-disable-next-line no-irregular-whitespace
        message = `✅‏‏‎  ${spec.fullName}`;
      } else {
        const details = spec.failedExpectations[0].message;
        // eslint-disable-next-line no-irregular-whitespace
        message = `❌  ${spec.fullName} -- ${details}`;
      }
      const lineNo = extractLine(spec, fileName);
      reportData.errors.push({
        pos: {line: lineNo, ch: 1},
        type: CodeInspection.Type.META,
        message
      });
      gutterReportData.errors.push({
        pos: {line: lineNo, ch: 1},
        type:
          spec.status == 'passed' ?
            CodeInspection.Type.META :
            CodeInspection.Type.ERROR,
        message
      });
    });
    return {reportData, gutterReportData};
  };

  /**
   * Handles projects opening and refreshing
   *
   * @param   {Event}  event          The event
   * @param   {any}  projectRoot  The active project root
   * @return  {void}
   */
  const handleProjectOpen = (event, projectRoot) => {
    // immediately set hasJasmineConfig to false
    console.log('refreshed', projectRoot.fullPath);
    hasJasmineConfig = false;
    isWorking = false;
    // check if the project path contains /spec/support/jasmine.json
    resolveConfigFile(projectRoot.fullPath);
  };

  /**
   * Handles scanFileAsync calls to lint the current file
   *
   * @param   {String}  text      The text of the file going to be linted
   * @param   {String}  filePath  Full filepath of the file going to be linted
   *
   * @return  {Promise}           a jQuery.Promise
   */
  const handleLinterAsync = (text, filePath) => {
    const def = new $.Deferred();
    if (!hasJasmineConfig || !matchesSpecPattern(filePath) || isWorking) {
      console.log('[JasmineTests] ignoring...', filePath);
      isWorking = false;
      updateStatus();
      def.resolve({errors: []});
      return def.promise();
    }
    console.log('[JasmineTests] testing...', filePath);
    const params = {file: filePath, config: configFilePath};

    // StatusBar.showBusyIndicator(false);
    isWorking = true;
    updateStatus();
    bracketsJasmineDomain
        .exec('runTests', params)
        .done(function(result) {
          isWorking = false;
          updateStatus();
          // StatusBar.hideBusyIndicator();
          const {reportData, gutterReportData} = generateReport(
              JSON.parse(result),
              filePath,
              text
          );
          try {
            if (window.bracketsInspectionGutters) {
              window.bracketsInspectionGutters.set(
                  EXTENSION_UNIQUE_NAME,
                  filePath,
                  gutterReportData,
                  true
              );
            } else {
              log.error(`No bracketsInspectionGutters found on window`);
            }
          } catch (e) {
            console.error(log(e));
          }
          isReattemptRun = false;
          def.resolve(reportData);
        })
        .fail(function(err) {
          if (!isReattemptRun) {
            isReattemptRun = true;
            isWorking = false;
            new Promise((resolve) =>
              setTimeout(resolve, (Math.random() + 1) * 1000)
            ).then(() => CodeInspection.requestRun());
            return;
          } else {
            isReattemptRun = false;
            isWorking = false;
            // StatusBar.hideBusyIndicator();
            updateStatus();
            def.reject(err);
          }
        });
    return def.promise();
  };

  const matchesSpecPattern = (filename) => {
    // @todo load the project config jasmine.json and determine patten match from there
    return filename.toLowerCase().endsWith('spec.js');
  };

  const updateStatus = () => {
    const status = hasJasmineConfig ?
      isWorking ?
        '⚪ Running...' :
        '🔵 Enabled' :
      '🔴 Disabled';
    statusDropDownBtn.$button.text(`Jasmine: ${status}`);
  };
  const resolveConfigFile = (projectPath) => {
    FileSystem.resolve(
        `${projectPath}/spec/support/jasmine.json`,
        (err, file) => {
          if (err) {
            hasJasmineConfig = false;
            updateStatus();
          } else {
            configFilePath = `${projectPath}/spec/support/jasmine.json`;
            hasJasmineConfig = true;
            updateStatus();
          }
        }
    );
  };

  // register linter
  CodeInspection.register('javascript', {
    name: 'JasmineTests',
    scanFileAsync: handleLinterAsync
  });

  StatusBar.addIndicator(
      'jasmineTestsStatus',
      statusDropDownBtn.$button,
      true,
      'btn btn-dropdown btn-status-bar',
      'Jasmine Tests',
      'status-overwrite'
  );
  updateStatus();

  AppInit.appReady(function() {
    ProjectManager.on('projectOpen', handleProjectOpen);
    ProjectManager.on('projectRefresh', handleProjectOpen);
    resolveConfigFile(ProjectManager.getProjectRoot().fullPath);
  });
});
