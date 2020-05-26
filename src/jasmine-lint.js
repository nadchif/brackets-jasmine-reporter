/* jslint vars: true, nomen: true, indent: 4*/
/* global define, brackets, console, $*/
define(function(require, exports, module) {
  'use strict';
  const CodeInspection = brackets.getModule('language/CodeInspection');
  const ExtensionUtils = brackets.getModule('utils/ExtensionUtils');
  const NodeDomain = brackets.getModule('utils/NodeDomain');
  const FileSystem = brackets.getModule('filesystem/FileSystem');
  const ProjectManager = brackets.getModule('project/ProjectManager');

  const EXTENSION_UNIQUE_NAME = 'nadchif.BracketsJasmine';
  let hasJasmineConfig = false;
  let configFilePath;

  const bracketsJasmineDomain = new NodeDomain(
      'bracketsJasmineTests',
      ExtensionUtils.getModulePath(module, 'node/domain')
  );

  const generateReport = (results) => {
    console.log(results);
    const report = {
      errors: []
    };
    let i = 1;
    results.specs.forEach((spec)=>{
      i++;
      report.errors.push({
        pos: {line: i, ch: 1},
        type: spec.status == 'passed' ? CodeInspection.Type.META : CodeInspection.Type.ERROR,
        message: spec.description
      });
    });
    return {errors: []};
  };

  const handleProjectOpen = (evt, projectRoot) => {
    // immediately set hasJasmineConfig to false
    hasJasmineConfig = false;
    // check if the project path contains /spec/support/jasmine.json
    resolveConfigFile(projectRoot.fullPath);
  };

  const handleLinterAsync = (text, filePath) => {
    const deferred = $.Deferred();
    // if theres no jasmine config within the project /spec/support/jasmine.json
    //                   or
    // if the file does not match jasmine spec regex pattern.
    if (!hasJasmineConfig || !matchesSpecPattern(filePath)) {
      deferred.resolve({errors: []});
      return deferred.promise();
    }

    bracketsJasmineDomain.exec('runTests', {file: filePath, config: configFilePath})
        .then((result) => {
          const report = generateReport(result);
          const w = window;
          if (w.bracketsInspectionGutters) {
            w.bracketsInspectionGutters.set(
                EXTENSION_UNIQUE_NAME, filePath, report, true
            );
          } else {
            log.error(`No bracketsInspectionGutters found on window, gutters disabled.`);
          }
          deferred.resolve(report);
        }, (err) => deferred.reject(err));
    return deferred.promise();
  };

  const matchesSpecPattern = (filename) => {
    // @todo load the project config jasmine.json and determine patten match from there
    console.log('test pattern', filename);
    return (filename.toLowerCase().endsWith('spec.js'));
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
    // listen for changes in current project
    ProjectManager.on('projectOpen', handleProjectOpen);
    ProjectManager.on('projectRefresh', handleProjectOpen);
    // check if open project has config file
    resolveConfigFile(ProjectManager.getProjectRoot().fullPath);
    // register linter
    CodeInspection.register('javascript', {
      name: 'JasmineTests',
      scanFileAsync: handleLinterAsync
    });
  };
});
