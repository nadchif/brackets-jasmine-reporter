const fs = require('fs');

const srcFolder = fs.readdirSync(`${__dirname}/../src`);

describe('Project Structure =>', () => {
  describe('src folder =>', () => {
    it('should contain a main.js file', () => {
      expect(srcFolder).toContain('main.js');
    });
    it('should contain a node folder', () => {
      expect(srcFolder).toContain('node');
    });
  });

  const srcNodeFolder = fs.readdirSync(`${__dirname}/../src/node`);
  describe('src/node folder =>', () => {
    it('should contain a package.json file', () => {
      expect(srcNodeFolder).toContain('package.json');
    });
    it('should contain a domain.js file', () => {
      expect(srcNodeFolder).toContain('domain.js');
    });
    it('should contain a jasmine-test.js file', () => {
      expect(srcNodeFolder).toContain('jasmine-test.js');
    });
  });
});
