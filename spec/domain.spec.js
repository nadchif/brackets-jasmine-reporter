const customDomain = require('../src/node/domain.js');

describe('/src/node/domain.js =>', () => {
  it('should have an init method', ()=>{
    expect(customDomain.init).toBeDefined();
  });
});
