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

  let date;

  if (dateString instanceof Date) {
    date = dateString;
  } else if (typeof dateString === 'number') {
    date = new Date(dateString);
  } else if (typeof dateString === 'string') {
    if (dateString.includes('-')) {
      // Separar los componentes de la fecha (YYYY-MM-DD)
      const [year, month, day] = dateString.split('-').map(num => Number.parseInt(num, 10));
      date = new Date(year, month - 1, day);
    } else {
      // Fallback para strings ISO u otros formatos parseables
      date = new Date(dateString);
    }
  } else {
    return '';
  }

  if (Number.isNaN(date.getTime())) return '';
  
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

/**
 * Convierte una fecha string (YYYY-MM-DD) a un objeto Date en zona horaria de Ecuador
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @param {string} time - Hora en formato HH:MM:SS (opcional, por defecto '00:00:00')
 * @returns {Date} Objeto Date ajustado a zona horaria de Ecuador
 */
export const parseEcuadorDate = (dateString, time = '00:00:00') => {
  if (!dateString) return null;
  
  // Parsear componentes de la fecha
  const [year, month, day] = dateString.split('-').map(num => Number.parseInt(num, 10));
  
  // Crear fecha usando los componentes individuales (en zona horaria local)
  const date = new Date(year, month - 1, day);
  
  // Si se proporciona hora, parsearla
  if (time !== '00:00:00') {
    const [hours, minutes, seconds] = time.split(':').map(num => Number.parseInt(num, 10));
    date.setHours(hours, minutes, seconds, 0);
  }
  
  return date;
};

/**
 * Calcula la diferencia en días entre dos fechas en zona horaria de Ecuador
 * @param {string} fechaFin - Fecha final en formato YYYY-MM-DD
 * @param {string} fechaInicio - Fecha inicial en formato YYYY-MM-DD (opcional, por defecto hoy)
 * @returns {number} Diferencia en días (positivo si fechaFin es futura, negativo si es pasada)
 */
export const calcularDiferenciaDias = (fechaFin, fechaInicio = null) => {
  if (!fechaFin) return 0;
  
  const hoy = fechaInicio || getEcuadorDate();
  
  // Parsear ambas fechas sin consideración de hora
  const [year1, month1, day1] = fechaFin.split('-').map(num => Number.parseInt(num, 10));
  const [year2, month2, day2] = hoy.split('-').map(num => Number.parseInt(num, 10));
  
  // Crear fechas a medianoche
  const fecha1 = new Date(year1, month1 - 1, day1, 0, 0, 0, 0);
  const fecha2 = new Date(year2, month2 - 1, day2, 0, 0, 0, 0);
  
  // Calcular diferencia en milisegundos y convertir a días
  const diferenciaMilisegundos = fecha1.getTime() - fecha2.getTime();
  const diferenciaDias = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
  
  return diferenciaDias;
};

/**
 * Obtiene la fecha de Ecuador como string ISO para usar en nuevas inserciones en BD
 * @returns {string} Fecha y hora en formato ISO (ej: "2026-03-10T15:30:00")
 */
export const getEcuadorISOString = () => {
  const ecuadorDate = getEcuadorDateTime();
  const year = ecuadorDate.getFullYear();
  const month = String(ecuadorDate.getMonth() + 1).padStart(2, '0');
  const day = String(ecuadorDate.getDate()).padStart(2, '0');
  const hours = String(ecuadorDate.getHours()).padStart(2, '0');
  const minutes = String(ecuadorDate.getMinutes()).padStart(2, '0');
  const seconds = String(ecuadorDate.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

