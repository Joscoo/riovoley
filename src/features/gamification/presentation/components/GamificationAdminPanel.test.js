import { flatToForm, formToItem } from './GamificationAdminPanel';
jest.mock('../../gamificationAdminService', () => ({ gamificationAdminService: {} }));

it('preserva metadata de prestigio al editar el cosmetico', () => {
  const form = flatToForm({ category: 'frame', metadata: { frameVariant: 'crown', accent: 'gold', unlockType: 'leaderboard_top', unlockTarget: 1, boardType: 'jump_approach' } });
  expect(formToItem(form).metadata).toMatchObject({ accent: 'gold', boardType: 'jump_approach', unlockTarget: 1 });
});

it('elimina la imagen anterior al convertir un marco personalizado en uno normal', () => {
  const form = flatToForm({ category: 'frame', metadata: { imageUrl: 'https://example.com/frame.png' } });
  form.category = 'frame';
  form.frameVariant = 'crown';
  const result = formToItem(form);
  expect(result.metadata.imageUrl).toBeUndefined();
  expect(result.metadata.frameVariant).toBe('crown');
  expect(flatToForm(result).category).toBe('frame');
});
