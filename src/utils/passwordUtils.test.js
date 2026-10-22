import { generateRandomPassword, validatePassword } from './passwordUtils';

describe('politica y generacion de contrasenas', () => {
  it.each(['Aa123456!', 'abcdefghij', 'ABCDEFGHIJ', 'Abcdefghij', 'Abcdefgh1 ', ' Abcdefgh1!'])('rechaza %s', (password) => {
    expect(validatePassword(password).isValid).toBe(false);
  });
  it('acepta una contrasena fuerte de diez caracteres', () => {
    expect(validatePassword('Abcdefgh1!').isValid).toBe(true);
  });
  it('genera claves validas usando entropia criptografica', () => {
    const insecureRandom = jest.spyOn(Math, 'random').mockImplementation(() => { throw new Error('random inseguro'); });
    try {
      const password = generateRandomPassword(16);
      expect(password).toHaveLength(16);
      expect(validatePassword(password).isValid).toBe(true);
    } finally {
      insecureRandom.mockRestore();
    }
  });
});
