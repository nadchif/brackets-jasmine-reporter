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

  const DropdownButton = brackets.getModule('widgets/DropdownButton');
  const EXTENSION_UNIQUE_NAME = 'nadchif.BracketsJasmine';
  let hasJasmineConfig = false;
  let configFilePath;

  const bracketsJasmineDomain = new NodeDomain(
      'bracketsJasmineTests',
      ExtensionUtils.getModulePath(module, 'node/domain')
  );


  const ddMethod = new DropdownButton.DropdownButton('OFF', 'JasmineTests');
  ddMethod.on('select', function(event, item, itemIndex) {
 alert(itemIndex);
  });
  const statusIndicators = {
    Failed: ' ❌ - Failed',
    Passed: ' ✅ - Passed',
    Running: ' Running...',
    Unknown: ' Unknown'
  };

  const generateReport = (results) => {
    console.log(results);
    const reportData = {
      errors: []
    };
    //overall report
    const overallResult = results.end_Info.overallStatus == 'passed'? 'Passed' : 'Failed';
    setStatusIndicators(overallResult);
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
    ddMethod.$button.text(`JasmineTests: ${statusIndicators[status]}`);
  };
  const resolveConfigFile = (projectPath) => {
    FileSystem.resolve(`${projectPath}/spec/support/jasmine.json`,
        (err, file)=>{
          if (err) {
            hasJasmineConfig = true;
            StatusBar.updateIndicator('false', true);
            return;
          } else {
            configFilePath = `${projectPath}/spec/support/jasmine.json`;
            hasJasmineConfig = true;
            StatusBar.updateIndicator('jasmineTestsStatus', true);
          }
        });
  };
  module.exports = () => {
    // register linter
    CodeInspection.register('javascript', {
      name: 'JasmineTests',
      scanFileAsync: handleLinterAsync
    });

    StatusBar.addIndicator('jasmineTestsStatus', ddMethod.$button, true,
     'btn btn-dropdown btn-status-bar', 'Jasmine Tests', 'status-overwrite');

    AppInit.appReady(function() {
      ProjectManager.on('projectOpen', handleProjectOpen);
      ProjectManager.on('projectRefresh', handleProjectOpen);
      resolveConfigFile(ProjectManager.getProjectRoot().fullPath);
    });
  };
});
