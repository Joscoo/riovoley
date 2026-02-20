// src/utils/dateUtils.js
// Utilidades para manejo de fechas con zona horaria de Ecuador

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en zona horaria de Ecuador (America/Guayaquil)
 * @param {Date} date - Fecha a convertir (por defecto es la fecha actual)
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getEcuadorDate = (date = new Date()) => {
  // Crear fecha en zona horaria de Ecuador (UTC-5)
  const ecuadorDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
  const year = ecuadorDate.getFullYear();
  const month = String(ecuadorDate.getMonth() + 1).padStart(2, '0');
  const day = String(ecuadorDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene la fecha y hora actual en zona horaria de Ecuador
 * @returns {Date} Objeto Date ajustado a zona horaria de Ecuador
 */
export const getEcuadorDateTime = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
};

/**
 * Resta días a la fecha actual en zona horaria de Ecuador
 * @param {number} days - Número de días a restar
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getEcuadorDateMinusDays = (days) => {
  const date = getEcuadorDateTime();
  date.setDate(date.getDate() - days);
  return getEcuadorDate(date);
};

/**
 * Suma días a la fecha actual en zona horaria de Ecuador
 * @param {number} days - Número de días a sumar
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getEcuadorDatePlusDays = (days) => {
  const date = getEcuadorDateTime();
  date.setDate(date.getDate() + days);
  return getEcuadorDate(date);
};

/**
 * Obtiene el primer día del mes actual en zona horaria de Ecuador
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getEcuadorFirstDayOfMonth = () => {
  const date = getEcuadorDateTime();
  date.setDate(1);
  return getEcuadorDate(date);
};

/**
 * Obtiene el último día del mes actual en zona horaria de Ecuador
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getEcuadorLastDayOfMonth = () => {
  const date = getEcuadorDateTime();
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return getEcuadorDate(date);
};

/**
 * Formatea una fecha string (YYYY-MM-DD) para visualización sin problemas de zona horaria
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @param {object} options - Opciones de formato para toLocaleDateString
 * @returns {string} Fecha formateada
 */
export const formatDateString = (dateString, options = {}) => {
  if (!dateString) return '';
  
  // Separar los componentes de la fecha
  const [year, month, day] = dateString.split('-').map(num => Number.parseInt(num, 10));
  
  // Crear fecha usando componentes individuales (evita problemas de zona horaria)
  const date = new Date(year, month - 1, day);
  
  // Opciones por defecto
  const defaultOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Guayaquil'
  };
  
  return date.toLocaleDateString('es-ES', { ...defaultOptions, ...options });
};

/**
 * Formatea una fecha string (YYYY-MM-DD) de forma corta
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada (ej: "20/02/2026")
 */
export const formatDateStringShort = (dateString) => {
  if (!dateString) return '';
  
  const [year, month, day] = dateString.split('-').map(num => Number.parseInt(num, 10));
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
