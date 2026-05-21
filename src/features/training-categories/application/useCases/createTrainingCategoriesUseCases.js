import { formatCategoryLabel } from '../../../../shared/lib/trainingCategoryFormatting';

export const createTrainingCategoriesUseCases = (repository) => {
  const loadCategoriesUseCase = {
    execute: ({ query } = {}) => repository.listTrainingCategories({ query }),
  };

  const findDefaultDescriptionUseCase = {
    execute: ({ categories, code }) => {
      const match = (categories || []).find((category) => category.code === code);
      return match?.default_description || '';
    },
  };

  const buildCategoryLabelUseCase = {
    execute: ({ category }) => category?.label || formatCategoryLabel(category?.code),
  };

  return {
    loadCategoriesUseCase,
    findDefaultDescriptionUseCase,
    buildCategoryLabelUseCase,
  };
};

