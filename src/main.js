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

  const ddMethod = new DropdownButton.DropdownButton('Jasmine Tests', [
    ' Run Tests',
    'Enable/Disable'
  ]);
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
  let activeText = [];

  const extractLine = (spec, fileName) => {
    if (spec.status == 'passed') {
      const reg = 'it\\((?:\'|")('+spec.description+')(?:\'|")';
      const lineMatcher = new RegExp(reg, 'g');
      console.log(lineMatcher);
      let lineNo = 0;
      for (let i = 0; i < activeText.length; i++) {
        const stackString = activeText[i];
        const fileTroubleLine = stackString.match(lineMatcher);
        if (fileTroubleLine) {
          lineNo = i;
          break;
        };
      }
      return lineNo;
    }
    const reg = fileName+':([0-9]+)';
    const lineMatcher = new RegExp(reg, 'g');
    const stackString = spec.failedExpectations[0].stack;
    const fileTroubleLine = stackString.match(lineMatcher);
    if (fileTroubleLine) {
      const parts = fileTroubleLine[0].split(':');
      const line = parseInt(parts[parts.length-1]) - 1;
      return line > 0 ? line : 0;
    };
    return 0;
  };

  const generateReport = (results, fileName, text) => {
    activeText = text.split('\n');
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
        type: spec.status == 'passed' ? CodeInspection.Type.META : CodeInspection.Type.ERROR,
        message
      });
    });
    return {reportData, gutterReportData};
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

    // StatusBar.showBusyIndicator(false);
    isWorking = true;
    updateStatus();
    bracketsJasmineDomain.exec('runTests', params).done(
        function(result) {
          isWorking = false;
          updateStatus();
          // StatusBar.hideBusyIndicator();
          const {reportData, gutterReportData} =
          generateReport(result, filePath, text);
          try {
            if (window.bracketsInspectionGutters) {
              window.bracketsInspectionGutters.set(
                  EXTENSION_UNIQUE_NAME,
                  filePath,
                  gutterReportData,
                  true
              );
            } else {
              log.error(
                  `No bracketsInspectionGutters found on window`
              );
            }
          } catch (e) {
            console.error(log(e));
          }
          isReattemptRun = false;
          deferred.resolve(reportData);
          return new $.Deferred().resolve().promise();
        }).fail(function(err) {
      if (!isReattemptRun) {
        deferred.resolve({errors: []});
        setTimeout(() => CodeInspection.requestRun(), 1500);
        isReattemptRun = true;
        isWorking = true;
        updateStatus();
        return;
      } else {
        isReattemptRun = false;
        isWorking = false;
        // StatusBar.hideBusyIndicator();
        updateStatus();
      }
      deferred.reject(err);
    }
    );

    return deferred.promise();
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
    ddMethod.$button.text(`Jasmine: ${status}`);
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
      ddMethod.$button,
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
