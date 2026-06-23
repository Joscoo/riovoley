import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FaIdCard, FaImage, FaSave, FaStar, FaSyncAlt, FaUserCircle } from 'react-icons/fa';
import { gamificationService, IdentityPortrait } from '../../../gamification';
import { getAvatarStyleMeta } from '../../../gamification/domain/avatarCatalog';
import { buildAvatarUrl } from '../../../gamification/domain/buildAvatarUrl';
import { Button, Card, EmptyState, SectionHeader, StatusBadge } from '../../../../shared/ui';

const MAX_PHOTO_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const buildAvatarPreviewUrl = ({ identity, userId, avatarStyle, avatarModelSlug, equipment }) =>
  buildAvatarUrl({
    seed: `${identity?.studentId || userId || 'student'}-${identity?.displayName || identity?.realName || 'estudiante'}`,
    style: avatarStyle,
    modelSlug: avatarModelSlug,
    equipment,
  });

const buildInitialState = (identity) => ({
  nickname: identity?.nickname || '',
  selectedTitleSlug: identity?.selectedTitleSlug || '',
  selectedAvatarStyle: identity?.avatarStyle || 'adventurer-neutral',
  selectedAvatarModelSlug: identity?.avatarModelSlug || '',
  selectedProfileImageMode: identity?.profileImageMode || 'avatar',
  profilePhotoPreviewUrl: identity?.profilePhotoUrl || '',
});

const StudentProfileIdentityCard = ({ userId, gamification, onIdentityUpdated, loading = false }) => {
  const identity = gamification?.identity || null;
  const cosmetics = gamification?.cosmetics || { equipment: {}, equippedItems: {} };
  const [formState, setFormState] = useState(() => buildInitialState(identity));
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [message, setMessage] = useState(null);
  const photoInputRef = useRef(null);
  const blobPreviewUrlRef = useRef('');

  useEffect(() => {
    setFormState(buildInitialState(identity));
    setProfilePhotoFile(null);
    setRemoveProfilePhoto(false);
    setMessage(null);
  }, [identity]);

  useEffect(() => () => {
    if (blobPreviewUrlRef.current) {
      URL.revokeObjectURL(blobPreviewUrlRef.current);
    }
  }, []);

  const unlockedTitles = useMemo(
    () => (identity?.availableTitles || []).filter((title) => title.isUnlocked),
    [identity]
  );

  const availableAvatarModels = useMemo(
    () => identity?.avatarModelsByStyle?.[formState.selectedAvatarStyle]?.available || [],
    [identity, formState.selectedAvatarStyle]
  );

  const selectedAvatarModelSlug = useMemo(() => {
    if (availableAvatarModels.some((model) => model.slug === formState.selectedAvatarModelSlug)) {
      return formState.selectedAvatarModelSlug;
    }
    return availableAvatarModels[0]?.slug || formState.selectedAvatarModelSlug || '';
  }, [availableAvatarModels, formState.selectedAvatarModelSlug]);

  useEffect(() => {
    if (selectedAvatarModelSlug !== formState.selectedAvatarModelSlug) {
      setFormState((prev) => ({ ...prev, selectedAvatarModelSlug }));
    }
  }, [selectedAvatarModelSlug, formState.selectedAvatarModelSlug]);

  const hasProfilePhoto = Boolean(formState.profilePhotoPreviewUrl);
  const previewAvatarUrl = useMemo(
    () => buildAvatarPreviewUrl({
      identity,
      userId,
      avatarStyle: formState.selectedAvatarStyle,
      avatarModelSlug: selectedAvatarModelSlug,
      equipment: cosmetics.equipment,
    }),
    [cosmetics.equipment, formState.selectedAvatarStyle, identity, selectedAvatarModelSlug, userId]
  );
  const previewProfileImageUrl = formState.selectedProfileImageMode === 'photo' && formState.profilePhotoPreviewUrl
    ? formState.profilePhotoPreviewUrl
    : previewAvatarUrl;
  const selectedTitle = unlockedTitles.find((title) => title.slug === formState.selectedTitleSlug) || null;
  const selectedStyleMeta = getAvatarStyleMeta(formState.selectedAvatarStyle);

  const hasChanges = Boolean(
    profilePhotoFile
    || removeProfilePhoto
    || formState.nickname !== (identity?.nickname || '')
    || formState.selectedTitleSlug !== (identity?.selectedTitleSlug || '')
    || formState.selectedAvatarStyle !== (identity?.avatarStyle || 'adventurer-neutral')
    || selectedAvatarModelSlug !== (identity?.avatarModelSlug || '')
    || formState.selectedProfileImageMode !== (identity?.profileImageMode || 'avatar')
  );

  const updateFormField = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoChange = (event) => {
    const nextFile = event.target.files?.[0];
    event.target.value = '';

    if (!nextFile) return;

    if (!ALLOWED_PHOTO_TYPES.has(nextFile.type)) {
      setMessage({ tone: 'warning', text: 'La foto debe estar en formato JPG, PNG o WEBP.' });
      return;
    }

    if (Number(nextFile.size || 0) > MAX_PHOTO_SIZE_BYTES) {
      setMessage({ tone: 'warning', text: 'La foto no puede superar los 4 MB.' });
      return;
    }

    if (blobPreviewUrlRef.current) {
      URL.revokeObjectURL(blobPreviewUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(nextFile);
    blobPreviewUrlRef.current = nextPreviewUrl;
    setProfilePhotoFile(nextFile);
    setRemoveProfilePhoto(false);
    setMessage(null);
    setFormState((prev) => ({
      ...prev,
      selectedProfileImageMode: 'photo',
      profilePhotoPreviewUrl: nextPreviewUrl,
    }));
  };

  const handleRemoveProfilePhoto = () => {
    if (blobPreviewUrlRef.current) {
      URL.revokeObjectURL(blobPreviewUrlRef.current);
      blobPreviewUrlRef.current = '';
    }

    setProfilePhotoFile(null);
    setRemoveProfilePhoto(Boolean(identity?.profilePhotoUrl));
    setMessage(null);
    setFormState((prev) => ({
      ...prev,
      profilePhotoPreviewUrl: '',
      selectedProfileImageMode: 'avatar',
    }));
  };

  const handleSaveIdentity = async () => {
    if (!userId || !identity) return;

    setSavingIdentity(true);
    setMessage(null);

    try {
      const updatedGamification = await gamificationService.updateStudentIdentity({
        userId,
        nickname: formState.nickname,
        selectedTitleSlug: formState.selectedTitleSlug || null,
        avatarStyle: formState.selectedAvatarStyle,
        avatarModelSlug: selectedAvatarModelSlug || null,
        profileImageMode: formState.selectedProfileImageMode,
        profilePhotoFile,
        removeProfilePhoto,
      });

      if (typeof onIdentityUpdated === 'function') {
        onIdentityUpdated(updatedGamification);
      }

      setMessage({ tone: 'success', text: 'Tu foto/avatar se actualizo correctamente.' });
    } catch (error) {
      console.error('Error actualizando identidad del estudiante:', error);
      setMessage({
        tone: 'warning',
        text: error?.message || 'No se pudo actualizar tu foto o avatar.',
      });
    } finally {
      setSavingIdentity(false);
    }
  };

  if (!identity) {
    return (
      <Card className="border-cyan-300/20 bg-black/30" padding="lg">
        <SectionHeader
          title="Foto y Avatar"
          subtitle="Personaliza la imagen que se muestra en tu perfil y rankings."
          icon={<FaIdCard />}
        />
        <EmptyState
          title="Tu identidad aun no esta lista"
          description="Recarga el panel en unos segundos para habilitar la personalizacion de foto y avatar."
        />
      </Card>
    );
  }

  return (
    <Card className="border-cyan-300/20 bg-black/30" padding="lg">
      <SectionHeader
        title="Foto y Avatar"
        subtitle="Elige si tu perfil muestra foto personal o avatar competitivo."
        icon={<FaIdCard />}
        actionsGuideId="student-profile-photo-actions"
        actions={(
          <Button
            size="sm"
            onClick={handleSaveIdentity}
            disabled={!hasChanges || savingIdentity || loading}
          >
            {savingIdentity ? <FaSyncAlt className="mr-2 animate-spin" /> : <FaSave className="mr-2" />}
            Guardar imagen
          </Button>
        )}
      />

      {message ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            message.tone === 'success'
              ? 'border-emerald-300/35 bg-emerald-900/15 text-emerald-100'
              : 'border-amber-300/35 bg-amber-900/15 text-amber-100'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-4 desktop:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-cyan-300/20 bg-[linear-gradient(135deg,_rgba(34,211,238,0.14),_rgba(15,23,42,0.22)_55%,_rgba(245,158,11,0.10))] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">Vista previa</p>
          <div className="mt-4 flex flex-col items-center gap-4 text-center mobile:flex-row mobile:text-left">
            <IdentityPortrait
              imageUrl={previewProfileImageUrl}
              displayName={identity.displayName || identity.realName || 'Estudiante'}
              equipment={cosmetics.equipment}
              equippedItems={cosmetics.equippedItems}
              size="lg"
              showBadgeLabel
            />
            <div className="space-y-2">
              <p className="text-2xl font-black text-white">{identity.displayName || identity.realName || 'Estudiante'}</p>
              <p className="text-sm text-slate-300">
                Imagen principal: <span className="font-semibold text-white">{formState.selectedProfileImageMode === 'photo' ? 'Foto personal' : 'Avatar'}</span>
              </p>
              <p className="text-sm text-slate-300">
                Estilo: <span className="font-semibold text-white">{selectedStyleMeta?.name || 'Avatar'}</span>
              </p>
              <p className="text-sm text-slate-300">
                Modelo: <span className="font-semibold text-white">{availableAvatarModels.find((model) => model.slug === selectedAvatarModelSlug)?.name || 'Sin modelo'}</span>
              </p>
              <div className="flex flex-wrap justify-center gap-2 mobile:justify-start">
                <StatusBadge tone="info">{selectedTitle?.name || 'Sin titulo equipado'}</StatusBadge>
                <StatusBadge tone={hasProfilePhoto ? 'success' : 'warning'}>
                  {hasProfilePhoto ? 'Foto disponible' : 'Sin foto subida'}
                </StatusBadge>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-200">
            Esta imagen tambien se reutiliza en el sidebar, rankings y presencia competitiva del estudiante.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label="Foto de perfil"
            className="hidden"
            onChange={handleProfilePhotoChange}
          />

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-white">Apodo visible</span>
              <input
                type="text"
                value={formState.nickname}
                onChange={(event) => updateFormField('nickname', event.target.value)}
                maxLength={24}
                className="min-h-[46px] rounded-2xl border border-white/10 bg-slate-950/85 px-4 text-sm font-semibold text-white outline-none transition focus:border-rv-gold/45"
                placeholder="Ej: Rayo Leo"
              />
              <span className="text-xs text-slate-400">Se valida al guardar. Usa entre 3 y 24 caracteres.</span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-white">Titulo visible</span>
              <select
                value={formState.selectedTitleSlug}
                onChange={(event) => updateFormField('selectedTitleSlug', event.target.value)}
                className="min-h-[46px] rounded-2xl border border-white/10 bg-slate-950/85 px-4 text-sm font-semibold text-white outline-none transition focus:border-rv-gold/45"
              >
                <option value="">Sin titulo</option>
                {unlockedTitles.map((title) => (
                  <option key={title.slug} value={title.slug}>
                    {title.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-bold text-white">Imagen principal</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateFormField('selectedProfileImageMode', 'avatar')}
                  className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                    formState.selectedProfileImageMode === 'avatar'
                      ? 'border-rv-gold/60 bg-rv-gold/15 text-white'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                  }`}
                >
                  Usar avatar
                </button>
                <button
                  type="button"
                  onClick={() => hasProfilePhoto && updateFormField('selectedProfileImageMode', 'photo')}
                  disabled={!hasProfilePhoto}
                  className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                    formState.selectedProfileImageMode === 'photo'
                      ? 'border-cyan-300/60 bg-cyan-400/15 text-white'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-45'
                  }`}
                >
                  Usar foto
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-bold text-white">Foto de perfil</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => photoInputRef.current?.click()}>
                  <FaImage className="mr-2" />
                  {hasProfilePhoto ? 'Cambiar foto' : 'Subir foto'}
                </Button>
                {hasProfilePhoto ? (
                  <Button variant="secondary" size="sm" onClick={handleRemoveProfilePhoto}>
                    <FaUserCircle className="mr-2" />
                    Quitar foto
                  </Button>
                ) : null}
              </div>
              <span className="text-xs text-slate-400">Formatos permitidos: JPG, PNG o WEBP. Maximo 4 MB.</span>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-white">Estilo del avatar</span>
              <select
                value={formState.selectedAvatarStyle}
                onChange={(event) => updateFormField('selectedAvatarStyle', event.target.value)}
                className="min-h-[46px] rounded-2xl border border-white/10 bg-slate-950/85 px-4 text-sm font-semibold text-white outline-none transition focus:border-rv-gold/45"
              >
                {(identity.avatarStyleOptions || []).map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3">
              <div>
                <span className="text-sm font-bold text-white">Modelo del avatar</span>
                <p className="mt-1 text-xs text-slate-400">
                  Solo se muestran los modelos que ya tienes disponibles para el estilo elegido.
                </p>
              </div>

              <div className="grid gap-3 mobile:grid-cols-2">
                {availableAvatarModels.map((model) => (
                  <button
                    key={model.slug}
                    type="button"
                    onClick={() => updateFormField('selectedAvatarModelSlug', model.slug)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      selectedAvatarModelSlug === model.slug
                        ? 'border-cyan-300/50 bg-cyan-400/12'
                        : 'border-white/10 bg-black/20 hover:border-white/20'
                    }`}
                  >
                    <div className="mb-3 flex justify-center">
                      <IdentityPortrait
                        imageUrl={buildAvatarPreviewUrl({
                          identity,
                          userId,
                          avatarStyle: formState.selectedAvatarStyle,
                          avatarModelSlug: model.slug,
                          equipment: cosmetics.equipment,
                        })}
                        displayName={model.name}
                        equipment={cosmetics.equipment}
                        equippedItems={cosmetics.equippedItems}
                        size="sm"
                      />
                    </div>
                    <p className="text-sm font-black text-white">{model.name}</p>
                    <p className="mt-1 text-xs text-slate-300">{model.description}</p>
                    {model.unlockHint ? (
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                        {model.unlockHint}
                      </p>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 mobile:flex-row mobile:justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  if (blobPreviewUrlRef.current) {
                    URL.revokeObjectURL(blobPreviewUrlRef.current);
                    blobPreviewUrlRef.current = '';
                  }
                  setFormState(buildInitialState(identity));
                  setProfilePhotoFile(null);
                  setRemoveProfilePhoto(false);
                  setMessage(null);
                }}
                disabled={savingIdentity || loading || !hasChanges}
              >
                Restablecer
              </Button>
              <Button onClick={handleSaveIdentity} disabled={!hasChanges || savingIdentity || loading}>
                {savingIdentity ? <FaSyncAlt className="mr-2 animate-spin" /> : <FaStar className="mr-2" />}
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

StudentProfileIdentityCard.propTypes = {
  userId: PropTypes.string,
  gamification: PropTypes.shape({
    identity: PropTypes.shape({
      studentId: PropTypes.string,
      displayName: PropTypes.string,
      realName: PropTypes.string,
      nickname: PropTypes.string,
      selectedTitleSlug: PropTypes.string,
      avatarStyle: PropTypes.string,
      avatarModelSlug: PropTypes.string,
      profileImageMode: PropTypes.string,
      profilePhotoUrl: PropTypes.string,
      availableTitles: PropTypes.array,
      avatarStyleOptions: PropTypes.array,
      avatarModelsByStyle: PropTypes.object,
    }),
    cosmetics: PropTypes.shape({
      equipment: PropTypes.object,
      equippedItems: PropTypes.object,
    }),
  }),
  onIdentityUpdated: PropTypes.func,
  loading: PropTypes.bool,
};

export default StudentProfileIdentityCard;
