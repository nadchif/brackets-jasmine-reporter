const fs = require('fs');
// files required in the /src folder
const srcFiles = [
  'main.js',
  'node',
  'support'
];
// files required in the /src/support folder
const supportFiles = [
  'jasmine-hint-provider.js',
  'jasmine-keywords.js',
  'jasmine-shared.js'
];
// files required in the /src/node folder
const nodeFiles = [
  'package.json',
  'domain.js',
  'jasmine-exec.js'
];

const srcFolder = fs.readdirSync(`${__dirname}/../src`);
describe('Project Structure =>', () => {
  describe('/src folder =>', () => {
    srcFiles.forEach((file) => {
      it(`should contain a ${file} file/folder`, () => {
        expect(srcFolder).toContain(file);
      });
    });
  });
  const srcSupportFolder = fs.readdirSync(`${__dirname}/../src/support`);
  describe('/src/support folder =>', () => {
    supportFiles.forEach((file) => {
      it(`should contain a ${file} file/folder`, () => {
        expect(srcSupportFolder).toContain(file);
      });
    });
  });
  const srcNodeFolder = fs.readdirSync(`${__dirname}/../src/node`);
  describe('/src/node folder =>', () => {
    nodeFiles.forEach((file) => {
      it(`should contain a ${file} file/folder`, () => {
        expect(srcNodeFolder).toContain(file);
      });
    });
  });
});
