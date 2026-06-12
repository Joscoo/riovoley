process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

const React = require('react');
const { fireEvent, render, screen } = require('@testing-library/react');
const StudentPhysicalTests = require('./StudentPhysicalTests').default;

const baseStudent = {
  categoria: 'juvenil',
  fecha_nacimiento: '2010-03-20',
};

describe('StudentPhysicalTests', () => {
  it('shows the empty state when there are no tests', () => {
    render(<StudentPhysicalTests physicalTests={[]} studentData={baseStudent} onRefresh={jest.fn()} />);

    expect(screen.getByText(/aun no tienes tests fisicos registrados/i)).toBeInTheDocument();
    expect(screen.queryByText(/lo que mejoro/i)).not.toBeInTheDocument();
  });

  it('shows preliminary recommendations for a single test', () => {
    render(
      <StudentPhysicalTests
        physicalTests={[{ id: 't1', fecha_test: '2026-06-01', peso: 60, estatura: 1.68, brazo_extend_con_impulso: 278 }]}
        studentData={baseStudent}
        onRefresh={jest.fn()}
      />
    );

    expect(screen.getByText(/confianza preliminar/i)).toBeInTheDocument();
    expect(screen.getByText(/completar seguimiento/i)).toBeInTheDocument();
  });

  it('switches chart blocks and renders narrative insights for multiple tests', () => {
    render(
      <StudentPhysicalTests
        physicalTests={[
          { id: 't1', fecha_test: '2026-05-01', peso: 61, estatura: 1.68, brazo_extend_con_impulso: 274, fuerza_piernas: 42 },
          { id: 't2', fecha_test: '2026-06-01', peso: 61, estatura: 1.68, brazo_extend_con_impulso: 281, fuerza_piernas: 47 },
        ]}
        studentData={baseStudent}
        onRefresh={jest.fn()}
      />
    );

    expect(screen.getByText(/lo que mejoro/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /fuerza/i }));
    expect(screen.getByText(/fuerza de piernas/i)).toBeInTheDocument();
  });

  it('shows a useful empty message when the selected block lacks enough series data', () => {
    render(
      <StudentPhysicalTests
        physicalTests={[
          { id: 't1', fecha_test: '2026-06-01', peso: 60, estatura: 1.68 },
        ]}
        studentData={{ categoria: 'juvenil' }}
        onRefresh={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /fuerza/i }));
    expect(screen.getByText(/sin datos de fuerza suficientes/i)).toBeInTheDocument();
  });

  it('renders historical observations only when they exist', () => {
    render(
      <StudentPhysicalTests
        physicalTests={[
          { id: 't1', fecha_test: '2026-05-01', peso: 60, estatura: 1.68, observaciones: '' },
          { id: 't2', fecha_test: '2026-06-01', peso: 61, estatura: 1.68, observaciones: 'Mejor tecnica en el salto.' },
        ]}
        studentData={{ categoria: 'juvenil' }}
        onRefresh={jest.fn()}
      />
    );

    expect(screen.getByText(/mejor tecnica en el salto/i)).toBeInTheDocument();
    expect(screen.getAllByText(/observaciones/i)).toHaveLength(1);
  });
});
