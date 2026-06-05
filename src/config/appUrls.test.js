describe('appUrls', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('uses public web reset url on web platform', async () => {
    jest.doMock('../shared/platform', () => ({
      buildNativeUrl: jest.fn((path) => `riovoley://${path.replace(/^\//, '')}`),
      buildPublicUrl: jest.fn((path) => `https://riovoley.com${path}`),
      getPublicAppBaseUrl: jest.fn(() => 'https://riovoley.com'),
      getRuntimeAppBaseUrl: jest.fn(() => 'https://riovoley.com'),
      isNativePlatform: jest.fn(() => false),
    }));

    const urls = await import('./appUrls');

    expect(urls.APP_BASE_URL).toBe('https://riovoley.com');
    expect(urls.APP_RESET_PASSWORD_URL).toBe('https://riovoley.com/reset-password');
    expect(urls.AUTH_RESET_PASSWORD_REDIRECT_URL).toBe('https://riovoley.com/reset-password');
  });

  it('uses native reset url on native platform', async () => {
    jest.doMock('../shared/platform', () => ({
      buildNativeUrl: jest.fn((path) => `riovoley://${path.replace(/^\//, '')}`),
      buildPublicUrl: jest.fn((path) => `https://riovoley.com${path}`),
      getPublicAppBaseUrl: jest.fn(() => 'https://riovoley.com'),
      getRuntimeAppBaseUrl: jest.fn(() => 'riovoley://'),
      isNativePlatform: jest.fn(() => true),
    }));

    const urls = await import('./appUrls');

    expect(urls.AUTH_RESET_PASSWORD_REDIRECT_URL).toBe('riovoley://reset-password');
  });
});
