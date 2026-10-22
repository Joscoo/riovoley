import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import StudentGamificationPanel from './StudentGamificationPanel';
import { gamificationService } from '../../gamificationService';

jest.mock('../../gamificationService', () => ({
  gamificationService: {
    purchaseCosmeticItem: jest.fn(), equipCosmeticItem: jest.fn(), unequipCosmeticItem: jest.fn(),
  },
}));

const item = (slug, category, priceCoins = 10) => ({
  slug, category, name: slug, description: `Descripcion ${slug}`, priceCoins,
  rarity: 'common', isUnlocked: true, canAfford: true, canPurchase: true,
});
const initialState = () => ({
  profile: { currentLevel: 1, summary: {} }, identity: { displayName: 'Lia' },
  currency: { balance: 100, totalEarned: 100, totalSpent: 0, ledger: [] },
  cosmetics: { equipment: {}, items: [item('Marco nuevo', 'frame'), item('Fondo nuevo', 'background')], inventoryCount: 0 },
  leaderboards: [{ type: 'overall', rows: [{ isCurrentStudent: true, cosmeticEquipment: {}, equippedCosmeticItems: {} }] }],
});
const Harness = ({ initial = initialState(), onRefresh }) => {
  const [value, setValue] = useState(initial);
  return <><StudentGamificationPanel userId="u1" gamification={value} onIdentityUpdated={setValue} onRefresh={onRefresh} /><div data-testid="state">{JSON.stringify(value)}</div></>;
};
const state = () => JSON.parse(screen.getByTestId('state').textContent);
const openStore = () => {
  fireEvent.click(screen.getByRole('button', { name: /^Identidad/ }));
  fireEvent.click(screen.getByRole('button', { name: /^Tienda/ }));
};

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });

it('bloquea otras compras mientras una esta pendiente y usa saldo e historial confirmados', async () => {
  let finish;
  gamificationService.purchaseCosmeticItem.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  render(<Harness />);
  openStore();
  const buttons = screen.getAllByRole('button', { name: /Comprar ahora/ });
  fireEvent.click(buttons[0]);
  expect(buttons[1]).toBeDisabled();
  fireEvent.click(buttons[1]);
  expect(gamificationService.purchaseCosmeticItem).toHaveBeenCalledTimes(1);
  await act(async () => finish({ ok: true, itemSlug: 'Marco nuevo', priceCoins: 0,
    wallet: { balance: 73, totalEarned: 120, totalSpent: 47 },
    ledgerEntry: { id: 'purchase-1', label: 'Compra cosmetica', description: 'Compraste Marco nuevo', coinsDelta: 0 },
  }));
  expect(state().currency).toMatchObject({ balance: 73, totalSpent: 47, totalEarned: 120 });
  expect(state().currency.ledger[0].id).toBe('purchase-1');
  expect(state().cosmetics.items.filter((entry) => entry.isOwned)).toHaveLength(1);
  expect(screen.getByRole('status')).toHaveTextContent(/coleccion/i);
});

it('actualiza la metadata del cosmetico en los rankings al equipar', async () => {
  const initial = initialState();
  initial.cosmetics.items[0] = { ...initial.cosmetics.items[0], isOwned: true, canPurchase: false, metadata: { frameVariant: 'crown' } };
  gamificationService.equipCosmeticItem.mockResolvedValue({ ok: true, category: 'frame' });
  render(<Harness initial={initial} />);
  openStore();
  await act(async () => fireEvent.click(screen.getAllByRole('button', { name: /^Equipar$/ })[0]));
  expect(state().leaderboards[0].rows[0].equippedCosmeticItems.frame.metadata.frameVariant).toBe('crown');
});

it('muestra gratis y cuanto falta para comprar', () => {
  const initial = initialState();
  initial.cosmetics.items = [item('Gratis', 'frame', 0), { ...item('Caro', 'background', 150), canPurchase: false, canAfford: false }];
  render(<Harness initial={initial} />);
  openStore();
  expect(screen.getByRole('button', { name: /Obtener gratis/ })).toBeEnabled();
  expect(screen.getByRole('button', { name: /Faltan 50 monedas/ })).toBeDisabled();
});

it('mantiene las categorias sin soporte bloqueadas tras recalcular el saldo', async () => {
  const initial = initialState();
  initial.cosmetics.items.push({ ...item('Producto fisico', 'riovoley', 1), canPurchase: false });
  gamificationService.purchaseCosmeticItem.mockResolvedValue({ ok: true, priceCoins: 10 });
  render(<Harness initial={initial} />);
  openStore();
  await act(async () => fireEvent.click(screen.getAllByRole('button', { name: /Comprar ahora/ }).find((button) => !button.disabled)));
  expect(state().cosmetics.items.find((entry) => entry.category === 'riovoley').canPurchase).toBe(false);
});
