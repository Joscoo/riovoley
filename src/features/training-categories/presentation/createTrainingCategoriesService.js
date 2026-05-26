import { createTrainingCategoriesUseCases } from '../application/useCases/createTrainingCategoriesUseCases';
import { SupabaseTrainingCategoriesRepository } from '../infrastructure/repositories/supabaseTrainingCategoriesRepository';

export const createTrainingCategoriesService = (
  repository = new SupabaseTrainingCategoriesRepository()
) => {
  const useCases = createTrainingCategoriesUseCases(repository);

  const listCategories = ({ query } = {}) => useCases.loadCategoriesUseCase.execute({ query });

  const listScheduleCategories = () =>
    listCategories({
      query: {
        filters: {
          for_schedules: true,
          is_active: true,
        },
      },
    });

  const listStudentCategories = () =>
    listCategories({
      query: {
        filters: {
          for_students: true,
          is_active: true,
        },
      },
    });

  const getDefaultDescription = ({ categories, code }) =>
    useCases.findDefaultDescriptionUseCase.execute({ categories, code });

  const getCategoryLabel = ({ category }) =>
    useCases.buildCategoryLabelUseCase.execute({ category });

  const createCategory = async ({
    code,
    label,
    default_description,
    for_schedules = true,
    for_students = true,
    is_active = true,
  }) => repository.createTrainingCategory({
    code,
    label,
    default_description,
    for_schedules,
    for_students,
    is_active,
  });

  const updateCategory = async (code, payload) =>
    repository.updateTrainingCategory(code, payload);

  const toggleCategoryActive = async ({ code, is_active }) =>
    updateCategory(code, { is_active });

  const deleteCategory = async (code) =>
    repository.deleteTrainingCategory(code);

  return {
    listCategories,
    listScheduleCategories,
    listStudentCategories,
    getDefaultDescription,
    getCategoryLabel,
    createCategory,
    updateCategory,
    toggleCategoryActive,
    deleteCategory,
  };
};
