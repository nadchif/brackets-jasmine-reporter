/* jslint vars: true, nomen: true, indent: 4*/
/* global define, brackets, console, $*/
define(function(require, exports, module) {
  'use strict';
  const AppInit = brackets.getModule('utils/AppInit');
  const CodeInspection = brackets.getModule('language/CodeInspection');
  const ExtensionUtils = brackets.getModule('utils/ExtensionUtils');
  const NodeDomain = brackets.getModule('utils/NodeDomain');
  const FileSystem = brackets.getModule('filesystem/FileSystem');
  const ProjectManager = brackets.getModule('project/ProjectManager');
  const StatusBar = brackets.getModule('widgets/StatusBar');
  const path = ExtensionUtils.getModulePath(module);
  const EXTENSION_UNIQUE_NAME = 'nadchif.BracketsJasmine';
  let hasJasmineConfig = false;
  let configFilePath;

  const bracketsJasmineDomain = new NodeDomain(
      'bracketsJasmineTests',
      ExtensionUtils.getModulePath(module, 'node/domain')
  );

  const generateReport = (results) => {
    console.log(results);
    const reportData = {
      errors: []
    };
    let i = 1;
    results.specs.forEach((spec)=>{
      i++;
      let message;
      if (spec.status == 'passed') {
        message = `✅ - ${spec.description}`;
      } else {
        const details = spec.failedExpectations[0].message;
        message = `❌ - ${spec.description} -- ${details}`;
      }
      reportData.errors.push({
        pos: {line: i, ch: 1},
        type: CodeInspection.Type.META,
        message
      });
    });
    return reportData;
  };

  const handleProjectOpen = (evt, projectRoot) => {
    // immediately set hasJasmineConfig to false
    console.log('refreshed', projectRoot.fullPath);
    hasJasmineConfig = false;
    // check if the project path contains /spec/support/jasmine.json
    resolveConfigFile(projectRoot.fullPath);
  };

  let isWorking = false;
  const handleLinterAsync = (text, filePath) => {
    const deferred = new $.Deferred();
    if (!hasJasmineConfig || !matchesSpecPattern(filePath) || isWorking) {
      console.log('[JasmineTests] ignoring...', filePath);
      deferred.resolve({errors: []});
      return deferred.promise();
    }
    console.log('[JasmineTests] testing...', filePath);
    const params = {file: filePath, config: configFilePath};

    StatusBar.showBusyIndicator(false);
    isWorking = true;
    setStatusIndicators('Running');
    bracketsJasmineDomain.exec('runTests', params)
        .then(function(result) {
          const report = generateReport(result);
          try {
            if (window.bracketsInspectionGutters) {
              window.bracketsInspectionGutters.set(
                  EXTENSION_UNIQUE_NAME, filePath, report, true
              );
            } else {
              log.error(`No bracketsInspectionGutters found on window, gutters disabled.`);
            }
          } catch (e) {
            console.error(log(e));
          }

          isWorking = false;

          setStatusIndicators('Passed');
          StatusBar.hideBusyIndicator();
          deferred.resolve(report);
        }, function(err) {

          setStatusIndicators('Unknown');
          console.error('testtttt', err);
          isWorking = false;
          StatusBar.hideBusyIndicator();
          deferred.reject(err);
        });

    return deferred.promise();
  };

  const matchesSpecPattern = (filename) => {
    // @todo load the project config jasmine.json and determine patten match from there
    return (filename.toLowerCase().endsWith('spec.js'));
  };
  const setStatusIndicators = (status) => {
    StatusBar.updateIndicator('jasmineTestsFailed', false);
    StatusBar.updateIndicator('jasmineTestsRunning', false);
    StatusBar.updateIndicator('jasmineTestsSuccess', false);
    StatusBar.updateIndicator('jasmineTestsUnknown', false);
    StatusBar.updateIndicator(`jasmineTests${status}`, true);
  };
  const resolveConfigFile = (projectPath) => {
    FileSystem.resolve(`${projectPath}/spec/support/jasmine.json`,
        (err, file)=>{
          if (err) {
            return;
          } else {
            configFilePath = `${projectPath}/spec/support/jasmine.json`;
            hasJasmineConfig = true;
          }
        });
  };
  module.exports = () => {
    // register linter
    CodeInspection.register('javascript', {
      name: 'JasmineTests',
      scanFileAsync: handleLinterAsync
    });
    StatusBar.addIndicator('jasmineTestsFailed', $('<div>❌ &nbsp; &nbsp; JasmineTests [Failed]</div>'), false, '', 'Status: failed');
    StatusBar.addIndicator('jasmineTestsPassed', $('<div>✅ &nbsp; &nbsp; JasmineTests [Passed]</div>'), false, '', 'Status: passed');
    StatusBar.addIndicator('jasmineTestsRunning', $('<div>&nbsp; &nbsp; &nbsp; JasmineTests [Running...]</div>'), false, '', 'Status: running');
    StatusBar.addIndicator('jasmineTestsUnknown', $('<div>&nbsp; &nbsp; &nbsp; JasmineTests [Unknown]</div>'), false, '', 'Status: unknown');
    AppInit.appReady(function() {
    // check if open project has config file
      resolveConfigFile(ProjectManager.getProjectRoot().fullPath);
      // listen for changes in current project

      ProjectManager.on('projectOpen', handleProjectOpen);
      ProjectManager.on('projectRefresh', handleProjectOpen);
    });
  };
});
