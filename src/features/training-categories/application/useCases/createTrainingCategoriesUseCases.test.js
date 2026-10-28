import { createTrainingCategoriesUseCases } from './createTrainingCategoriesUseCases';

describe('training category use cases', () => {
  test('preserves filters and propagates permission errors instead of presenting an empty catalog', async () => {
    const failure = new Error('permission denied');
    const repository = { listTrainingCategories: jest.fn().mockRejectedValue(failure) };
    const { loadCategoriesUseCase } = createTrainingCategoriesUseCases(repository);
    const query = { filters: { for_students: true, is_active: true } };
    await expect(loadCategoriesUseCase.execute({ query })).rejects.toBe(failure);
    expect(repository.listTrainingCategories).toHaveBeenCalledWith({ query });
  });

  test('finds descriptions by category code and tolerates missing categories', () => {
    const { findDefaultDescriptionUseCase } = createTrainingCategoriesUseCases({});
    const categories = [{ code: 'open_gym', default_description: 'Juego libre' }];
    expect(findDefaultDescriptionUseCase.execute({ categories, code: 'open_gym' })).toBe('Juego libre');
    expect(findDefaultDescriptionUseCase.execute({ categories, code: 'unknown' })).toBe('');
    expect(findDefaultDescriptionUseCase.execute({ code: 'open_gym' })).toBe('');
  });

  test('prefers the configured label and formats codes as a fallback', () => {
    const { buildCategoryLabelUseCase } = createTrainingCategoriesUseCases({});
    expect(buildCategoryLabelUseCase.execute({ category: { code: 'open_gym', label: 'Juego libre' } })).toBe('Juego libre');
    expect(buildCategoryLabelUseCase.execute({ category: { code: 'open_gym' } })).toBe('Open Gym');
  });
});
