import { createPhysicalTestsUseCases } from '../application/useCases/createPhysicalTestsUseCases';
import { SupabasePhysicalTestsRepository } from '../infrastructure/repositories/supabasePhysicalTestsRepository';
import { gamificationService } from '../../gamification';

export const createPhysicalTestsService = (
  repository = new SupabasePhysicalTestsRepository(),
  deps = { gamificationService }
) => {
  const useCases = createPhysicalTestsUseCases(repository, deps);
  const loadAtletas = async () => useCases.loadAtletasUseCase.execute();
  const loadTests = async ({ filters }) => useCases.loadTestsUseCase.execute({ filters });
  const createTest = async ({ formData }) => useCases.createTestUseCase.execute({ formData });
  const updateTest = async ({ testId, formData }) => useCases.updateTestUseCase.execute({ testId, formData });
  const deleteTest = async ({ testId }) => useCases.deleteTestUseCase.execute({ testId });
  const buildInitialForm = () => useCases.buildInitialFormUseCase.execute();
  const buildFormFromTest = ({ test }) => useCases.buildFormFromTestUseCase.execute({ test });
  const validateTestForm = ({ formData, athletes }) => useCases.validateTestFormUseCase.execute({ formData, athletes });
  const calculateStats = ({ athletes, tests }) => useCases.calculateStatsUseCase.execute({ athletes, tests });

  return {
    loadAtletas,
    loadTests,
    createTest,
    updateTest,
    deleteTest,
    buildInitialForm,
    buildFormFromTest,
    validateTestForm,
    calculateStats,
  };
};
