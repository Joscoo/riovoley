// src/utils/passwordUtils.js

const secureRandomIndex = (size) => {
  const crypto = globalThis.crypto;
  if (!crypto?.getRandomValues) throw new Error('No hay un generador seguro de contraseñas disponible.');
  const values = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / size) * size;
  do { crypto.getRandomValues(values); } while (values[0] >= limit);
  return values[0] % size;
};

/**
 * Genera una contraseña aleatoria segura
 * @param {number} length - Longitud de la contraseña (por defecto 12)
 * @returns {string} - Contraseña generada
 */
export const generateRandomPassword = (length = 12) => {
  if (!Number.isInteger(length) || length < 10) throw new Error('La contraseña debe tener al menos 10 caracteres.');
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Asegurar que tenga al menos uno de cada tipo
  let password = '';
  password += lowercase[secureRandomIndex(lowercase.length)];
  password += uppercase[secureRandomIndex(uppercase.length)];
  password += numbers[secureRandomIndex(numbers.length)];
  password += symbols[secureRandomIndex(symbols.length)];
  
  // Completar el resto con caracteres aleatorios
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 4; i < length; i++) {
    password += allChars[secureRandomIndex(allChars.length)];
  }
  
  // Mezclar los caracteres para que no sigan un patrón
  const characters = password.split('');
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const other = secureRandomIndex(index + 1);
    [characters[index], characters[other]] = [characters[other], characters[index]];
  }
  return characters.join('');
};

/**
 * Valida que una contraseña cumpla con los requisitos de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {object} - Resultado de validación
 */
export const validatePassword = (password) => {
  password = typeof password === 'string' ? password : '';
  const minLength = 10;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[^A-Za-z0-9\s]/.test(password);
  
  const errors = [];

  if (/\s/.test(password)) errors.push('No debe contener espacios');
  
  if (password.length < minLength) {
    errors.push(`Debe tener al menos ${minLength} caracteres`);
  }
  
  if (!hasLowercase) {
    errors.push('Debe contener al menos una letra minúscula');
  }
  
  if (!hasUppercase) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  
  if (!hasNumbers) {
    errors.push('Debe contener al menos un número');
  }
  
  if (!hasSymbols) {
    errors.push('Debe contener al menos un símbolo especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Genera una contraseña temporal más amigable para envío por correo
 * @returns {string} - Contraseña temporal
 */
export const generateTemporaryPassword = () => {
  // Contraseña más amigable pero segura para el primer uso
  const adjectives = ['Fuerte', 'Rapido', 'Alto', 'Poderoso', 'Agil', 'Valiente'];
  const nouns = ['Leon', 'Tigre', 'Aguila', 'Rayo', 'Estrella', 'Viento'];
  const numbers = secureRandomIndex(900) + 100; // 100-999
  const symbol = '!@#$%'[secureRandomIndex(5)];
  
  const adjective = adjectives[secureRandomIndex(adjectives.length)];
  const noun = nouns[secureRandomIndex(nouns.length)];
  
  return `${adjective}${noun}${numbers}${symbol}`;
};
