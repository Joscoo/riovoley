import { userProvisioningService } from '../../../user-provisioning';
import { withEncryptedUserContactFields } from '../../../../utils/piiCrypto';

export const createTrainerManagementUseCases = (repository) => {
  const loadEntrenadoresUseCase = {
    execute: async ({ query } = {}) => repository.listTrainers({ query }),
  };

  const updateEntrenadorUseCase = {
    execute: async ({ editingEntrenador, formData }) => {
      const updateData = await withEncryptedUserContactFields({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        fecha_nacimiento: formData.fecha_nacimiento || null
      });

      await repository.updateTrainer(editingEntrenador.id, updateData);
    },
  };

  const createEntrenadorUseCase = {
    execute: async ({ formData }) => userProvisioningService.createUser({
      email: formData.email,
      nombre: formData.nombre,
      apellido: formData.apellido,
      fecha_nacimiento: formData.fecha_nacimiento || null,
      telefono: formData.telefono || null,
      role: 'entrenador'
    }),
  };

  const saveEntrenadorUseCase = {
    execute: async ({ editingEntrenador, formData }) => {
      if (editingEntrenador) {
        await updateEntrenadorUseCase.execute({ editingEntrenador, formData });
        return { mode: 'updated' };
      }

      const userResult = await createEntrenadorUseCase.execute({ formData });
      return { mode: 'created', userResult };
    },
  };

  const deleteEntrenadorUseCase = {
    execute: async ({ trainerId }) => repository.deleteTrainer(trainerId),
  };

  return {
    loadEntrenadoresUseCase,
    updateEntrenadorUseCase,
    createEntrenadorUseCase,
    saveEntrenadorUseCase,
    deleteEntrenadorUseCase,
  };
};
