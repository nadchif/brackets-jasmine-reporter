/* jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/* global */

define(function(require, exports, module) {
  'use strict';
  const FileSystem = brackets.getModule('filesystem/FileSystem');
  const ProjectManager = brackets.getModule('project/ProjectManager');

  const findConfigFile = () => {
    const Dialogs = brackets.getModule('widgets/Dialogs');
    return new Promise((resolve, reject) => {
      try {
        // Get the user's working project directory
        const projectDirectory = ProjectManager.getProjectRoot();
        projectDirectory.getContents((err, files) => {
          if (err) {
            reject(err);
          }
          const matchingFile = files.find((file) => {
            return (file.fullPath.toLowerCase().endsWith('/jasmine.json'));
          });
          if (!matchingFile) {
            console.warn('No jasmine.json file found in project directory. Brackets-jasmine will not run automatically');
            reject(Error('No jasmine.json file found'));
          }
          matchingFile.read((err, rawdata) => {
            if (err) {
              reject(err);
            }
            try {
              const data = JSON.parse(rawdata);
              resolve(data);
            } catch (e) {
              // notify the user that the jasmine.json is corrupt or unreadable
              Dialogs.showModalDialog('',
                  'Jasmine.json Configuration Error',
                  `${matchingFile.fullPath} could not be parsed!`);
              reject(e);
            }
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  };

  exports.findConfigFile = findConfigFile;
});
