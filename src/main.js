/* jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/* global */
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
  const {getFeedbackLines, matchesSpecPattern} = require('./support/jasmine-shared');
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
   * Generates CodeInspection ready reports
   *
   * @param   {Object}  rawResult   raw string of results from the node process
   * @param   {String}  fileName  fullpath to the file being linted
   * @param   {String}  text      The text being linted
   * @return  {Object<String, Object>}  two reports. one for the bottom panel, one for the gutters
   */
  const generateReport = (rawResult, fileName, text) => {
    lintedCodeLines = text.split('\n');
    let results;
    const reportData = {
      errors: []
    };
    const gutterReportData = {
      errors: []
    };
    try {
      results = JSON.parse(rawResult.split('---JASMINERESULT---')[1]);
    } catch (e) {
      console.error('Failed to parse', rawResult);
      const failureMessage = {
        pos: {line: 0, ch: 1},
        type: CodeInspection.Type.WARNING,
        message: `Jasmine Wrapper error - ${rawResult}`
      };
      reportData.errors.push(failureMessage);
      gutterReportData.errors.push(failureMessage);
      return {reportData, gutterReportData};
    }
    results.specs.forEach((spec) => {
      let message;
      const feedbackLines = getFeedbackLines(spec, lintedCodeLines, fileName);
      if (spec.status == 'passed') {
        // eslint-disable-next-line no-irregular-whitespace
        message = `✅‏‏‎  [PASS] ${spec.fullName}`;
        reportData.errors.push({
          pos: {line: feedbackLines[0], ch: 1},
          type: CodeInspection.Type.META,
          message
        });
        gutterReportData.errors.push({
          pos: {line: feedbackLines[0], ch: 1},
          type:
            spec.status == 'passed' ?
              CodeInspection.Type.META :
              CodeInspection.Type.ERROR,
          message
        });
      } else {
        spec.failedExpectations.forEach((failedExpect, index) => {
          const details = spec.failedExpectations[index].message;
          reportData.errors.push({
            pos: {line: feedbackLines[index], ch: 1},
            type: CodeInspection.Type.META,
            // eslint-disable-next-line no-irregular-whitespace
            message: `❌  [FAIL] ${spec.fullName} -- ${details}`
          });
          gutterReportData.errors.push({
            pos: {line: feedbackLines[index], ch: 1},
            type:
              spec.status == 'passed' ?
                CodeInspection.Type.META :
                CodeInspection.Type.ERROR,
            // eslint-disable-next-line no-irregular-whitespace
            message: `❌  [FAIL] ${details}`
          });
        });
      }
    });
    return {reportData, gutterReportData};
  };
  /**
   * Handles projects opening and refreshing
   * @param   {Event}  event          The event
   * @param   {any}  projectRoot  The active project root
   * @return  {void}
   */
  const handleProjectOpen = (event, projectRoot) => {
    // immediately set hasJasmineConfig to false
    hasJasmineConfig = false;
    isWorking = false;
    // check if the project path contains /spec/support/jasmine.json
    resolveConfigFile(projectRoot.fullPath);
  };
  /**
   * Handles scanFileAsync calls to lint the current file
   * @param   {String}  text      The text of the file going to be linted
   * @param   {String}  filePath  Full filepath of the file going to be linted
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
    console.log(
        `[JasmineTests] ${isReattemptRun ? 'Reattempting Test' : 'Testing'}...`,
        filePath
    );
    const params = {file: filePath, config: configFilePath};
    isWorking = true;
    updateStatus();
    bracketsJasmineDomain
        .exec('runTests', params)
        .done(function(result) {
          isWorking = false;
          updateStatus();
          const {reportData, gutterReportData} = generateReport(
              result,
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
              console.error(`No bracketsInspectionGutters found on window`);
            }
          } catch (e) {
            console.error(e);
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
            def.resolve({errors: [
              {
                pos: {line: 0, ch: 1},
                type: CodeInspection.Type.WARNING,
                message: `[Jasmine error occurred] ${err}`
              }
            ]});
          }
        });
    return def.promise();
  };
  /**
   * Updates the status bar to reflect the extensions current status: enabled, disabled or running
   */
  const updateStatus = () => {
    const status = hasJasmineConfig ?
      isWorking ?
        '⚪ Running...' :
        '🔵 Enabled' :
      '🔴 Disabled';
    statusDropDownBtn.$button.text(`Jasmine: ${status}`);
  };
  /**
   * Resolves whether the project path includes a /spec/support/jasmine.json
   * @param   {String}  projectPath        path to Project
   * @param   {Boolean}  triggerInspection  triggers a CodeInspection run if the path resolves
   * @return  {void}
   */
  const resolveConfigFile = (projectPath, triggerInspection) => {
    FileSystem.resolve(
        `${projectPath}/spec/support/jasmine.json`,
        (err, file) => {
          if (err) {
            hasJasmineConfig = false;
            updateStatus();
          } else {
            configFilePath = `${projectPath}/spec/support/jasmine.json`;
            hasJasmineConfig = true;
            if (triggerInspection) {
              CodeInspection.requestRun();
            }
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
  // add the Jasmine Tests button to the status bar
  StatusBar.addIndicator(
      'jasmineTestsStatus',
      statusDropDownBtn.$button,
      true,
      'btn btn-dropdown btn-status-bar',
      'Jasmine Tests',
      'status-overwrite'
  );
  ProjectManager.on('projectOpen', handleProjectOpen);
  ProjectManager.on('projectRefresh', handleProjectOpen);
  AppInit.appReady(function() {
    resolveConfigFile(ProjectManager.getProjectRoot().fullPath, true);
    require('support/jasmine-hint-provider')();
    updateStatus();
  });
  // exports for unit test purposes
  exports.updateStatus = updateStatus;
  exports.resolveConfigFile = resolveConfigFile;
  exports.generateReport = generateReport;
  exports.handleLinterAsync = handleLinterAsync;
});
