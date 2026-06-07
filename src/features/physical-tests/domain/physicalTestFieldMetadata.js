export const PHYSICAL_TEST_FIELD_METADATA = {
  estatura: {
    label: 'Estatura',
    unitLabel: 'Estatura (m)',
    shortLabel: 'Estatura',
    description: 'Altura total del estudiante medida en metros.'
  },
  peso: {
    label: 'Peso',
    unitLabel: 'Peso (kg)',
    shortLabel: 'Peso',
    description: 'Peso corporal del estudiante medido en kilogramos.'
  },
  envergadura_brazos_extendidos_lateral: {
    label: 'Envergadura lateral de brazos',
    unitLabel: 'Envergadura lateral de brazos (cm)',
    shortLabel: 'Envergadura',
    description: 'Distancia entre las puntas de los dedos con ambos brazos extendidos en cruz.'
  },
  brazo_extend_inicial: {
    label: 'Alcance de pie con brazo dominante',
    unitLabel: 'Alcance de pie con brazo dominante (cm)',
    shortLabel: 'Alcance de pie',
    description: 'Medida tomada con el estudiante de pie y estirando hacia arriba su brazo dominante.'
  },
  brazo_extend_sin_impulso: {
    label: 'Alcance vertical en salto estatico',
    unitLabel: 'Alcance vertical en salto estatico (cm)',
    shortLabel: 'Salto estatico',
    description: 'Alcance maximo en salto vertical desde parado, usando solo impulso vertical.'
  },
  brazo_extend_con_impulso: {
    label: 'Alcance vertical con carrera de remate',
    unitLabel: 'Alcance vertical con carrera de remate (cm)',
    shortLabel: 'Salto con carrera',
    description: 'Alcance maximo en salto vertical usando la carrera de remate.'
  },
  fuerza_explosiva_salto_largo: {
    label: 'Salto largo desde parado',
    unitLabel: 'Salto largo desde parado (m)',
    shortLabel: 'Salto largo',
    description: 'Distancia lograda al saltar hacia adelante desde parado con impulso de sentadilla.'
  },
  fuerza_abdomen: {
    label: 'Abdominales en 1 minuto',
    unitLabel: 'Abdominales en 1 minuto',
    shortLabel: 'Abdominales',
    description: 'Cantidad de abdominales realizadas en un minuto.'
  },
  fuerza_brazos: {
    label: 'Flexiones de brazo en 1 minuto',
    unitLabel: 'Flexiones de brazo en 1 minuto',
    shortLabel: 'Flexiones',
    description: 'Cantidad de flexiones de brazo realizadas en un minuto.'
  },
  fuerza_piernas: {
    label: 'Sentadillas en 1 minuto',
    unitLabel: 'Sentadillas en 1 minuto',
    shortLabel: 'Sentadillas',
    description: 'Cantidad de sentadillas realizadas en un minuto.'
  },
  elevaciones_barra: {
    label: 'Dominadas en barra en 1 minuto',
    unitLabel: 'Dominadas en barra en 1 minuto',
    shortLabel: 'Dominadas en barra',
    description: 'Cantidad de dominadas en barra realizadas en un minuto.'
  },
  observaciones: {
    label: 'Observaciones',
    unitLabel: 'Observaciones',
    shortLabel: 'Observaciones',
    description: 'Comentarios adicionales sobre el rendimiento, la tecnica o recomendaciones.'
  }
};

export const getPhysicalTestFieldMeta = (fieldKey) =>
  PHYSICAL_TEST_FIELD_METADATA[fieldKey] || {
    label: fieldKey,
    unitLabel: fieldKey,
    shortLabel: fieldKey,
    description: ''
  };
