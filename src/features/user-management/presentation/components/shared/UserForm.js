import React, { useState, useEffect, useRef } from 'react';
import { Field, Button, iconRegistry } from '../../../../../shared/ui';
import { validateAthleteBirthDate, MIN_ATHLETE_AGE } from '../../../../../utils/athleteValidation';

const INPUT_BASE =
  'min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70';

const CATEGORIAS = [
  'iniciacion_hombres',
  'iniciacion_mujeres',
  'perfeccionamiento_hombres',
  'perfeccionamiento_mujeres',
  'master_mujeres',
];

const formatCategoria = (categoria) => {
  const categorias = {
    iniciacion_hombres: 'Iniciación Hombres',
    iniciacion_mujeres: 'Iniciación Mujeres',
    perfeccionamiento_hombres: 'Perfeccionamiento Hombres',
    perfeccionamiento_mujeres: 'Perfeccionamiento Mujeres',
    master_mujeres: 'Master Mujeres',
  };
  return categorias[categoria] || categoria;
};

const INITIAL_FORM = {
  atleta: {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
    categoria: '',
  },
  entrenador: {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
  },
  administrador: {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
  },
};

const UserForm = ({ userType, initialData, onSubmit, onCancel, submitLabel = 'Guardar' }) => {
  const UserIcon = iconRegistry.user;
  const SportsIcon = iconRegistry.sports;

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        nombre: initialData.nombre || '',
        apellido: initialData.apellido || '',
        email: initialData.email || '',
        telefono: initialData.telefono || '',
        fecha_nacimiento: initialData.fecha_nacimiento || '',
        categoria: initialData.categoria || '',
      };
    }
    return INITIAL_FORM[userType] || INITIAL_FORM.atleta;
  });

  const [formErrors, setFormErrors] = useState({});
  const initialFocusRef = useRef(null);

  useEffect(() => {
    globalThis.setTimeout(() => {
      initialFocusRef.current?.focus();
    }, 0);
  }, []);

  const isEditing = Boolean(initialData);

  const validate = () => {
    const errors = {};

    if (!formData.nombre?.trim()) {
      errors.nombre = 'El nombre es requerido';
    }

    if (!formData.apellido?.trim()) {
      errors.apellido = 'El apellido es requerido';
    }

    if (!formData.email?.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.fecha_nacimiento) {
      errors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    }

    if (userType === 'atleta') {
      if (!formData.categoria) {
        errors.categoria = 'Selecciona una categoría';
      }

      if (formData.fecha_nacimiento) {
        const birthDateValidation = validateAthleteBirthDate(formData.fecha_nacimiento, MIN_ATHLETE_AGE);
        if (!birthDateValidation.isValid) {
          errors.fecha_nacimiento = birthDateValidation.error;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {Object.values(formErrors).filter(Boolean).length > 0 && (
        <div className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200" role="alert">
          {Object.values(formErrors).filter(Boolean)[0]}
        </div>
      )}

      <section className="space-y-3 rounded-xl border border-rv-gold/20 bg-black/20 p-4">
        <h4 className="text-sm font-bold uppercase tracking-[0.8px] text-rv-gold">
          <UserIcon className="mr-2 inline align-middle" /> Información Personal
        </h4>

        <div className="grid gap-4 mobile:grid-cols-2">
          <Field label="Nombre *" icon={<UserIcon className="text-white/90" />}>
            <input
              ref={initialFocusRef}
              type="text"
              value={formData.nombre}
              onChange={(event) => handleChange('nombre', event.target.value)}
              className={INPUT_BASE}
              placeholder="Ingrese el nombre"
              required
            />
            {formErrors.nombre && (
              <p className="mt-1 text-xs text-red-400">{formErrors.nombre}</p>
            )}
          </Field>

          <Field label="Apellido *">
            <input
              type="text"
              value={formData.apellido}
              onChange={(event) => handleChange('apellido', event.target.value)}
              className={INPUT_BASE}
              placeholder="Ingrese el apellido"
              required
            />
            {formErrors.apellido && (
              <p className="mt-1 text-xs text-red-400">{formErrors.apellido}</p>
            )}
          </Field>

          <Field label="Email *">
            <input
              type="email"
              value={formData.email}
              onChange={(event) => handleChange('email', event.target.value)}
              className={INPUT_BASE}
              placeholder="correo@ejemplo.com"
              disabled={isEditing}
              required
            />
            {isEditing && (
              <p className="mt-1 text-xs text-slate-400">El email no es editable</p>
            )}
            {formErrors.email && (
              <p className="mt-1 text-xs text-red-400">{formErrors.email}</p>
            )}
          </Field>

          <Field label="Teléfono">
            <input
              type="tel"
              value={formData.telefono}
              onChange={(event) => handleChange('telefono', event.target.value)}
              className={INPUT_BASE}
              placeholder="099 123 4567"
            />
          </Field>

          <Field label="Fecha de Nacimiento *">
            <input
              type="date"
              value={formData.fecha_nacimiento}
              onChange={(event) => handleChange('fecha_nacimiento', event.target.value)}
              className={INPUT_BASE}
              required
            />
            {formErrors.fecha_nacimiento && (
              <p className="mt-1 text-xs text-red-400">{formErrors.fecha_nacimiento}</p>
            )}
          </Field>
        </div>
      </section>

      {userType === 'atleta' && (
        <section className="space-y-3 rounded-xl border border-rv-gold/20 bg-black/20 p-4">
          <h4 className="text-sm font-bold uppercase tracking-[0.8px] text-rv-gold">
            <SportsIcon className="mr-2 inline align-middle" /> Información del Estudiante
          </h4>

          <Field label="Categoría *">
            <select
              value={formData.categoria}
              onChange={(event) => handleChange('categoria', event.target.value)}
              className={INPUT_BASE}
              required
            >
              <option value="">Seleccionar categoría</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>{formatCategoria(cat)}</option>
              ))}
            </select>
            {formErrors.categoria && (
              <p className="mt-1 text-xs text-red-400">{formErrors.categoria}</p>
            )}
          </Field>
        </section>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-rv-gold/20 pt-4 mobile:flex-row mobile:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="w-full mobile:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="w-full mobile:w-auto"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
