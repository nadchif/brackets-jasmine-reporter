/*jslint vars: true, nomen: true, indent: 4*/
/*global define, brackets, console, $*/
define(function (require, exports, module) {
  "use strict";

  const CodeInspection = brackets.getModule("language/CodeInspection");
  const ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
  const NodeDomain = brackets.getModule("utils/NodeDomain");  
  const FileSystem = brackets.getModule('filesystem/FileSystem');
  const ProjectManager = brackets.getModule('project/ProjectManager');

  let hasJasmineConfig = false;
  let configFilePath;

  const bracketsJasmineDomain = new NodeDomain(
    "bracketsJasmineTests",
    ExtensionUtils.getModulePath(module, "node/domain")
  );

  const generateReport = (results) => {
    console.log(results);
    return null;
  };

  const handleProjectOpen = (evt, projectRoot) => {
    // path is: projectRoot.fullPath
    // immediately set hasJasmineConfig to false
    hasJasmineConfig = false;
    //check if the project path contains /spec/support/jasmine.json
    FileSystem.
  }

  const handleLinterAsync = (text, filePath) => {
    const deferred = $.Deferred();
    //if theres no jasmine config within the project /spec/support/jasmine.json
    //or
    //if the file does not match jasmine spec regex pattern.
    if(!hasJasmineConfig || matchesSpecPattern(filePath)){
    deferred.resolve(null);
    return deferred.promise();
    }
    bracketsJasmineDomain
      .exec("runTests", {
        file: filePath,
        config: "c:/test/",
      })
      .then((result) => {
        const report = generateReport(result);
        deferred.resolve(report);
      })
      .catch((error) => {
        deferred.reject(error);
      });
    return deferred.promise();
  };

  const matchesSpecPattern = (filename) => {
    //@todo load the project config jasmine.json and determine patten match from there
    console.log('test pattern', filename);
    return false;
  }


  module.exports = () => {
    //listen for changes in current project
    ProjectManager.on('projectOpen', handleProjectOpen);
    ProjectManager.on('projectRefresh', handleProjectOpen);
    //register linter
    CodeInspection.register("javascript", {
      name: "JasmineTests",
      scanFileAsync: handleLinterAsync,
    });
  };
});
