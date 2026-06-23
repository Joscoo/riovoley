import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FaChartBar, FaDumbbell } from 'react-icons/fa';
import { Card, EmptyState, SectionHeader } from '../../../../shared/ui';
import { buildStudentPhysicalProfile } from './physical-tests/buildStudentPhysicalProfile';
import StudentPhysicalHero from './physical-tests/StudentPhysicalHero';
import StudentPhysicalTrendChart from './physical-tests/StudentPhysicalTrendChart';
import StudentPhysicalInsights from './physical-tests/StudentPhysicalInsights';
import StudentPhysicalRecommendations from './physical-tests/StudentPhysicalRecommendations';
import StudentPhysicalHistory from './physical-tests/StudentPhysicalHistory';

const DEFAULT_BLOCK = 'jump';

const StudentPhysicalTests = ({ physicalTests, studentData }) => {
  const profile = useMemo(
    () => buildStudentPhysicalProfile({ physicalTests, studentData }),
    [physicalTests, studentData]
  );
  const [activeBlock, setActiveBlock] = useState(DEFAULT_BLOCK);

  return (
    <Card className="border-rv-gold/20 bg-black/30" padding="lg">
      <SectionHeader
        title="Tests Fisicos y Rendimiento"
        subtitle="Monitorea tu progreso con una lectura clara de tu evolucion y prioridades."
        icon={<FaDumbbell />}
      />

      {!profile.hasTests ? (
        <EmptyState
          icon={<FaChartBar />}
          title="Aun no tienes tests fisicos registrados"
          description="Los entrenadores realizaran evaluaciones periodicas para activar tu perfil de rendimiento."
        />
      ) : (
        <div className="space-y-4 mobile:space-y-5">
          <StudentPhysicalHero hero={profile.hero} />
          <StudentPhysicalTrendChart
            activeBlock={activeBlock}
            blocks={profile.chartGroups}
            onBlockChange={setActiveBlock}
          />
          <StudentPhysicalInsights insights={profile.insights} />
          <StudentPhysicalRecommendations recommendations={profile.recommendations} />
          <div data-guide-id="student-physical-history">
            <StudentPhysicalHistory items={profile.history} />
          </div>
        </div>
      )}
    </Card>
  );
};

StudentPhysicalTests.propTypes = {
  physicalTests: PropTypes.array.isRequired,
  studentData: PropTypes.object,
};

export default StudentPhysicalTests;
