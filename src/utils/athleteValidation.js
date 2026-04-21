export const MIN_ATHLETE_AGE = 5;

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseDateOnly = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const match = DATE_ONLY_REGEX.exec(dateString.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const formatDateOnly = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getMaxBirthDateForAge = (minAge = MIN_ATHLETE_AGE, now = new Date()) => {
  const maxBirthDate = new Date(Date.UTC(
    now.getUTCFullYear() - minAge,
    now.getUTCMonth(),
    now.getUTCDate(),
  ));

  return formatDateOnly(maxBirthDate);
};

export const calculateAgeFromDate = (birthDateString, now = new Date()) => {
  const birthDate = parseDateOnly(birthDateString);
  if (!birthDate) {
    return null;
  }

  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const currentDay = now.getUTCDate();
  const birthMonth = birthDate.getUTCMonth();
  const birthDay = birthDate.getUTCDate();

  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age -= 1;
  }

  return age;
};

export const validateAthleteBirthDate = (birthDateString, minAge = MIN_ATHLETE_AGE) => {
  const birthDate = parseDateOnly(birthDateString);

  if (!birthDate) {
    return {
      isValid: false,
      error: 'La fecha de nacimiento no es valida.',
      age: null,
    };
  }

  const today = new Date();
  const nowUtc = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  ));

  if (birthDate > nowUtc) {
    return {
      isValid: false,
      error: 'La fecha de nacimiento no puede estar en el futuro.',
      age: null,
    };
  }

  const age = calculateAgeFromDate(birthDateString, nowUtc);
  if (age === null) {
    return {
      isValid: false,
      error: 'No se pudo calcular la edad del atleta.',
      age: null,
    };
  }

  if (age < minAge) {
    return {
      isValid: false,
      error: `El atleta debe tener al menos ${minAge} anos.`,
      age,
    };
  }

  return {
    isValid: true,
    error: null,
    age,
  };
};
