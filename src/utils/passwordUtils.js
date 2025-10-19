// src/utils/passwordUtils.js

/**
 * Genera una contraseña aleatoria segura
 * @param {number} length - Longitud de la contraseña (por defecto 12)
 * @returns {string} - Contraseña generada
 */
export const generateRandomPassword = (length = 12) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Asegurar que tenga al menos uno de cada tipo
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Completar el resto con caracteres aleatorios
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar los caracteres para que no sigan un patrón
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Valida que una contraseña cumpla con los requisitos de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {object} - Resultado de validación
 */
export const validatePassword = (password) => {
  const minLength = 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password);
  
  const errors = [];
  
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
  const numbers = Math.floor(Math.random() * 900) + 100; // 100-999
  const symbol = '!@#$%'[Math.floor(Math.random() * 5)];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${numbers}${symbol}`;
};