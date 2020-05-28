/* jslint vars: true, nomen: true, indent: 4*/
/* global define, brackets, console, $*/
define(function(require, exports, module) {
  'use strict';

  const EXTENSION_UNIQUE_NAME = 'nadchif.BracketsJasmine';
  let hasJasmineConfig = false;
  let configFilePath;

  const bracketsJasmineDomain = new NodeDomain(
      'bracketsJasmineTests',
      ExtensionUtils.getModulePath(module, 'node/domain')
  );


  const ddMethod = new DropdownButton.DropdownButton('Jasmine Tests', [' Run Tests', 'Enable/Disable']);
  ddMethod.on('select', function(event, item, itemIndex) {
    switch (itemIndex) {
      case 1:
        hasJasmineConfig = !hasJasmineConfig;
        updateStatus();
        break;
      case 0:
        CodeInspection.requestRun();
        break;
    }
  });

  const generateReport = (results) => {
    console.log('results', results);
    const reportData = {
      errors: []
    };
    let i = 1;
    results.specs.forEach((spec)=>{
      i++;
      let message;
      if (spec.status == 'passed') {
        message = `✅‏‏‎  ${spec.fullName}`;
      } else {
        const details = spec.failedExpectations[0].message;
        message = `❌  ${spec.fullName} -- ${details}`;
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
    isWorking = false;
    // check if the project path contains /spec/support/jasmine.json
    resolveConfigFile(projectRoot.fullPath);
  };

  let isWorking = false;
  let isReattemptRun = false;
  const handleLinterAsync = (text, filePath) => {
    const deferred = new $.Deferred();
    if (!hasJasmineConfig || !matchesSpecPattern(filePath) || isWorking) {
      console.log('[JasmineTests] ignoring...', filePath);
      isWorking = false;
      updateStatus();
      deferred.resolve({errors: []});
      return deferred.promise();
    }
    console.log('[JasmineTests] testing...', filePath);
    const params = {file: filePath, config: configFilePath};

    StatusBar.showBusyIndicator(false);
    isWorking = true;
    updateStatus();
    bracketsJasmineDomain.exec('runTests', params)
        .then(function(result) {
          isWorking = false;
          updateStatus();
          StatusBar.hideBusyIndicator();

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
          isReattemptRun = false;
          deferred.resolve(report);
        }, function(err) {
          isWorking = false;
          StatusBar.hideBusyIndicator();
          updateStatus();
          if (!isReattemptRun) {
            deferred.resolve({errors: []});
            setTimeout(()=>CodeInspection.requestRun(), 1000);
            isReattemptRun = true;
            return;
          } else {
            isReattemptRun = false;
          }
          deferred.reject(err);
        });

    return deferred.promise();
  };

  const matchesSpecPattern = (filename) => {
    // @todo load the project config jasmine.json and determine patten match from there
    return (filename.toLowerCase().endsWith('spec.js'));
  };

  const updateStatus = () => {
    const status = hasJasmineConfig ? isWorking ? '⚪ Running...' : '🔵 Enabled' : '🔴 Disabled';
    ddMethod.$button.text(`Jasmine: ${status}`);
  };
  const resolveConfigFile = (projectPath) => {
    FileSystem.resolve(`${projectPath}/spec/support/jasmine.json`,
        (err, file)=>{
          if (err) {
            hasJasmineConfig = false;
            updateStatus();
          } else {
            configFilePath = `${projectPath}/spec/support/jasmine.json`;
            hasJasmineConfig = true;
            updateStatus();
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
    updateStatus();

    AppInit.appReady(function() {
      ProjectManager.on('projectOpen', handleProjectOpen);
      ProjectManager.on('projectRefresh', handleProjectOpen);
      resolveConfigFile(ProjectManager.getProjectRoot().fullPath);
    });
  };
});
