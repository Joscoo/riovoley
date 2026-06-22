import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('../../../gamification', () => {
  return {
    gamificationService: {
      updateStudentIdentity: jest.fn(),
    },
    IdentityPortrait: ({ displayName }) => <div>{displayName || 'Portrait'}</div>,
  };
});

import StudentProfileIdentityCard from './StudentProfileIdentityCard';
import { gamificationService } from '../../../gamification';

describe('StudentProfileIdentityCard', () => {
  const baseGamification = {
    identity: {
      studentId: 'student-1',
      displayName: 'Rayo Leo',
      realName: 'Leonardo Perez',
      nickname: 'RayoLeo',
      selectedTitleSlug: '',
      avatarStyle: 'adventurer-neutral',
      avatarModelSlug: 'adventurer-01',
      profileImageMode: 'avatar',
      profilePhotoUrl: '',
      availableTitles: [
        { slug: 'primer-impulso', name: 'Primer Impulso', isUnlocked: true },
      ],
      avatarStyleOptions: [
        { slug: 'adventurer-neutral', name: 'Aventurero' },
      ],
      avatarModelsByStyle: {
        'adventurer-neutral': {
          available: [
            {
              slug: 'adventurer-01',
              name: 'Aventurero Base',
              description: 'Modelo inicial',
              unlockHint: 'Disponible desde el inicio.',
            },
          ],
        },
      },
    },
    cosmetics: {
      equipment: {},
      equippedItems: {},
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:preview-photo');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('guarda foto de perfil desde mi perfil usando gamificationService', async () => {
    const onIdentityUpdated = jest.fn();
    gamificationService.updateStudentIdentity.mockResolvedValue({
      ...baseGamification,
      identity: {
        ...baseGamification.identity,
        profileImageMode: 'photo',
        profilePhotoUrl: 'https://example.com/profile.png',
      },
    });

    render(
      <StudentProfileIdentityCard
        userId="user-1"
        gamification={baseGamification}
        onIdentityUpdated={onIdentityUpdated}
      />
    );

    const file = new File(['photo'], 'profile.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/foto de perfil/i, { selector: 'input' }), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(gamificationService.updateStudentIdentity).toHaveBeenCalledWith({
        userId: 'user-1',
        nickname: 'RayoLeo',
        selectedTitleSlug: null,
        avatarStyle: 'adventurer-neutral',
        avatarModelSlug: 'adventurer-01',
        profileImageMode: 'photo',
        profilePhotoFile: file,
        removeProfilePhoto: false,
      });
    });

    expect(onIdentityUpdated).toHaveBeenCalled();
    expect(await screen.findByText(/tu foto\/avatar se actualizo correctamente/i)).toBeInTheDocument();
  });

  it('muestra error si la foto supera el limite permitido', async () => {
    render(<StudentProfileIdentityCard userId="user-1" gamification={baseGamification} />);

    const oversizedFile = new File(['photo'], 'profile.png', { type: 'image/png' });
    Object.defineProperty(oversizedFile, 'size', { value: 5 * 1024 * 1024 });

    fireEvent.change(screen.getByLabelText(/foto de perfil/i, { selector: 'input' }), {
      target: { files: [oversizedFile] },
    });

    expect(await screen.findByText(/no puede superar los 4 mb/i)).toBeInTheDocument();
    expect(gamificationService.updateStudentIdentity).not.toHaveBeenCalled();
  });
});
