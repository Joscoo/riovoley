import { createGamificationAdminUseCases } from './createGamificationAdminUseCases';

const validItem = () => ({ slug: 'marco', name: 'Marco', description: 'Un marco', category: 'frame', rarity: 'common', price_coins: 10 });

it.each([NaN, Infinity, 1.5, '', -1])('rechaza precios invalidos: %s', async (price) => {
  const repository = { upsertCosmeticItem: jest.fn() };
  await expect(createGamificationAdminUseCases(repository).upsertCosmeticItemUseCase.execute({
    item: { ...validItem(), price_coins: price }, isNew: true,
  })).rejects.toThrow();
  expect(repository.upsertCosmeticItem).not.toHaveBeenCalled();
});

it('guarda un marco personalizado en el slot frame que soporta el equipamiento', async () => {
  const repository = { upsertCosmeticItem: jest.fn() };
  await createGamificationAdminUseCases(repository).upsertCosmeticItemUseCase.execute({ item: {
    ...validItem(), category: 'custom_frame', metadata: { imageUrl: 'https://example.com/frame.png' },
  }, isNew: true });
  expect(repository.upsertCosmeticItem).toHaveBeenCalledWith(expect.objectContaining({ category: 'frame', metadata: expect.objectContaining({ imageUrl: 'https://example.com/frame.png' }) }));
});

it('impide publicar productos fisicos sin un flujo de canje implementado', async () => {
  const repository = { upsertCosmeticItem: jest.fn() };
  await expect(createGamificationAdminUseCases(repository).upsertCosmeticItemUseCase.execute({
    item: { ...validItem(), category: 'riovoley' }, isNew: true,
  })).rejects.toThrow(/canje/i);
});
