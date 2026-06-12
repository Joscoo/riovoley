const { buildStudentPhysicalProfile } = require('./buildStudentPhysicalProfile');

describe('buildStudentPhysicalProfile', () => {
  it('returns an empty profile when there are no tests', () => {
    const result = buildStudentPhysicalProfile({
      physicalTests: [],
      studentData: { categoria: 'juvenil' },
    });

    expect(result.hasTests).toBe(false);
    expect(result.recommendations.confidence).toBe('preliminar');
    expect(result.blocks.body.status).toBe('sin_datos');
    expect(result.insights.needsWork).toEqual([]);
  });

  it('sorts by fecha_test and computes mixed-profile output', () => {
    const result = buildStudentPhysicalProfile({
      physicalTests: [
        { id: 't2', fecha_test: '2026-06-10', peso: 64, estatura: 1.7, brazo_extend_con_impulso: 286 },
        { id: 't1', fecha_test: '2026-05-10', peso: 63, estatura: 1.7, brazo_extend_con_impulso: 280 },
      ],
      studentData: { categoria: 'juvenil' },
    });

    expect(result.latestTestId).toBe('t2');
    expect(result.blocks.jump.current.brazo_extend_con_impulso).toBe(286);
    expect(result.blocks.jump.deltaFromPrevious.brazo_extend_con_impulso).toBe(6);
    expect(result.recommendations.confidence).toBe('media');
  });

  it('flags weight increase plus jump regression as a mixed-profile alert', () => {
    const result = buildStudentPhysicalProfile({
      physicalTests: [
        { id: 't1', fecha_test: '2026-05-01', peso: 62, estatura: 1.7, brazo_extend_con_impulso: 288, fuerza_piernas: 45 },
        { id: 't2', fecha_test: '2026-06-01', peso: 65, estatura: 1.7, brazo_extend_con_impulso: 281, fuerza_piernas: 45 },
      ],
      studentData: { categoria: 'juvenil' },
    });

    expect(result.blocks.body.status).toBe('alerta');
    expect(result.blocks.jump.status).toBe('alerta');
    expect(result.recommendations.priority).toMatch(/explosividad|carga corporal/i);
    expect(result.insights.needsWork[0]).toMatch(/salto|peso/i);
  });

  it('keeps force conclusions empty when force metrics are missing', () => {
    const result = buildStudentPhysicalProfile({
      physicalTests: [
        { id: 't1', fecha_test: '2026-05-01', peso: 61, estatura: 1.68, brazo_extend_con_impulso: 275 },
        { id: 't2', fecha_test: '2026-06-01', peso: 61, estatura: 1.68, brazo_extend_con_impulso: 282 },
      ],
      studentData: { categoria: 'juvenil' },
    });

    expect(result.blocks.strength.status).toBe('sin_datos');
    expect(result.recommendations.headline).toMatch(/salto/i);
    expect(result.recommendations.recommendations.join(' ')).not.toMatch(/fuerza base/);
  });
});
