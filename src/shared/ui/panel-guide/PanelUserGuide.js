import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaBookOpen,
  FaBullseye,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaCrosshairs,
  FaForward,
} from 'react-icons/fa';
import Button from '../Button';
import { cn } from '../../../lib/cn';

const DESKTOP_TOOLTIP_WIDTH = 560;
const TOOLTIP_GAP = 18;
const HIGHLIGHT_PADDING = 8;
const MAX_LOOKUPS = 18;
const MOBILE_BREAKPOINT = 768;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const measureElement = (element) => {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  return {
    top: Math.max(0, rect.top - HIGHLIGHT_PADDING),
    left: Math.max(0, rect.left - HIGHLIGHT_PADDING),
    width: rect.width + HIGHLIGHT_PADDING * 2,
    height: rect.height + HIGHLIGHT_PADDING * 2,
  };
};

const resolveDesktopTooltipPosition = (rect, placement = 'right') => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const fallbackTop = clamp((viewportHeight - 320) / 2, 20, Math.max(20, viewportHeight - 340));
  const fallbackLeft = clamp(
    (viewportWidth - DESKTOP_TOOLTIP_WIDTH) / 2,
    16,
    Math.max(16, viewportWidth - DESKTOP_TOOLTIP_WIDTH - 16)
  );

  if (!rect) {
    return { top: fallbackTop, left: fallbackLeft };
  }

  const centeredTop = clamp(rect.top + rect.height / 2 - 170, 20, Math.max(20, viewportHeight - 340));
  const centeredLeft = clamp(
    rect.left + rect.width / 2 - DESKTOP_TOOLTIP_WIDTH / 2,
    16,
    Math.max(16, viewportWidth - DESKTOP_TOOLTIP_WIDTH - 16)
  );

  if (placement === 'left') {
    return {
      top: centeredTop,
      left: clamp(rect.left - DESKTOP_TOOLTIP_WIDTH - TOOLTIP_GAP, 16, Math.max(16, viewportWidth - DESKTOP_TOOLTIP_WIDTH - 16)),
    };
  }

  if (placement === 'top') {
    return {
      top: clamp(rect.top - 300, 20, Math.max(20, viewportHeight - 340)),
      left: centeredLeft,
    };
  }

  if (placement === 'bottom') {
    return {
      top: clamp(rect.top + rect.height + TOOLTIP_GAP, 20, Math.max(20, viewportHeight - 340)),
      left: centeredLeft,
    };
  }

  return {
    top: centeredTop,
    left: clamp(rect.left + rect.width + TOOLTIP_GAP, 16, Math.max(16, viewportWidth - DESKTOP_TOOLTIP_WIDTH - 16)),
  };
};

const PanelUserGuide = ({
  open,
  role,
  panelLabel,
  steps,
  onClose,
  onComplete,
  onSectionChange,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [targetFound, setTargetFound] = useState(false);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const syncViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, [open]);

  const currentStep = steps[stepIndex] || null;
  const totalSteps = steps.length;
  const isLastStep = stepIndex === totalSteps - 1;
  const progressPercent = totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;
  const isMobileLayout = viewport.width < MOBILE_BREAKPOINT;

  useEffect(() => {
    if (!open || !currentStep?.sectionId || typeof onSectionChange !== 'function') {
      return;
    }

    onSectionChange(currentStep.sectionId);
  }, [currentStep, onSectionChange, open]);

  useEffect(() => {
    if (!open || !currentStep) {
      setTargetRect(null);
      setTargetFound(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const updateTarget = () => {
      if (cancelled) return;

      const targetElement = currentStep.selector ? document.querySelector(currentStep.selector) : null;
      const nextRect = measureElement(targetElement);

      if (targetElement && attempts === 0) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: currentStep.scrollBlock || (isMobileLayout ? 'start' : 'center'),
          inline: 'center',
        });
      }

      if (nextRect) {
        setTargetRect(nextRect);
        setTargetFound(true);
      } else if (!currentStep.selector) {
        setTargetRect(null);
        setTargetFound(false);
      }

      if (!nextRect && currentStep.selector && attempts < MAX_LOOKUPS) {
        attempts += 1;
        window.setTimeout(updateTarget, attempts < 6 ? 80 : 140);
        return;
      }

      if (!nextRect && currentStep.selector) {
        setTargetRect(null);
        setTargetFound(false);
      }
    };

    const syncPosition = () => {
      if (!currentStep.selector) return;
      const targetElement = document.querySelector(currentStep.selector);
      const nextRect = measureElement(targetElement);
      if (nextRect) {
        setTargetRect(nextRect);
        setTargetFound(true);
      }
    };

    updateTarget();
    window.addEventListener('resize', syncPosition);
    window.addEventListener('scroll', syncPosition, true);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', syncPosition);
      window.removeEventListener('scroll', syncPosition, true);
    };
  }, [currentStep, isMobileLayout, open]);

  const roleAccentClass = useMemo(() => {
    if (role === 'student') return 'border-blue-300/30 bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(8,47,73,0.92))]';
    if (role === 'trainer') return 'border-orange-300/30 bg-[linear-gradient(135deg,rgba(249,115,22,0.18),rgba(67,20,7,0.92))]';
    return 'border-red-300/30 bg-[linear-gradient(135deg,rgba(239,68,68,0.18),rgba(69,10,10,0.92))]';
  }, [role]);

  const desktopTooltipPosition = useMemo(
    () => resolveDesktopTooltipPosition(targetRect, currentStep?.placement),
    [currentStep?.placement, targetRect]
  );

  const mobileCardMaxHeight = Math.max(480, Math.min(820, Math.round(viewport.height * 0.88)));
  const contentMaxHeight = isMobileLayout
    ? Math.max(320, mobileCardMaxHeight - 96)
    : Math.max(420, viewport.height - 112);

  if (!open || !currentStep) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[1600]">
      {targetRect && !isMobileLayout ? (
        <>
          <div className="fixed left-0 top-0 bg-black/65" style={{ width: '100vw', height: targetRect.top }} />
          <div className="fixed left-0 bg-black/65" style={{ top: targetRect.top, width: targetRect.left, height: targetRect.height }} />
          <div
            className="fixed bg-black/65"
            style={{
              top: targetRect.top,
              left: targetRect.left + targetRect.width,
              width: Math.max(0, viewport.width - (targetRect.left + targetRect.width)),
              height: targetRect.height,
            }}
          />
          <div
            className="fixed left-0 bg-black/65"
            style={{
              top: targetRect.top + targetRect.height,
              width: '100vw',
              height: Math.max(0, viewport.height - (targetRect.top + targetRect.height)),
            }}
          />
          <div
            className="fixed rounded-3xl border-2 border-rv-gold shadow-[0_0_0_9999px_rgba(0,0,0,0.12),0_0_0_4px_rgba(255,215,0,0.18),0_0_34px_rgba(255,215,0,0.5)] transition-all duration-300"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/72" />
      )}

      <div
        className={cn(
          'pointer-events-auto fixed flex flex-col overflow-hidden border text-white shadow-[0_24px_80px_rgba(0,0,0,0.46)] backdrop-blur-xl',
          isMobileLayout
            ? 'bottom-2 left-2 right-2 rounded-[22px]'
            : 'w-[min(560px,calc(100vw-32px))] rounded-[28px]',
          roleAccentClass
        )}
        style={
          isMobileLayout
            ? { maxHeight: `${mobileCardMaxHeight}px` }
            : {
              top: desktopTooltipPosition.top,
              left: desktopTooltipPosition.left,
              maxHeight: 'calc(100vh - 32px)',
            }
        }
      >
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-rv-gold">
                <FaBookOpen />
                Guia interactiva
              </p>
              <h3 className="mt-1 text-[15px] font-black leading-tight mobile:text-base">{currentStep.title}</h3>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/70">
                {panelLabel} · Paso {stepIndex + 1} de {totalSteps}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-2.5 py-1.5 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/65">Progreso</p>
              <p className="text-sm font-black text-white">{progressPercent}%</p>
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rv-gold via-amber-300 to-rv-gold transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 [touch-action:pan-y]"
          style={{ maxHeight: `${contentMaxHeight}px`, WebkitOverflowScrolling: 'touch' }}
        >
          <div className="space-y-2.5">
          <div className="rounded-2xl border border-rv-gold/20 bg-black/20 px-3 py-2.5 text-sm text-slate-100">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-white">
              <FaCrosshairs className="text-rv-gold" />
              Donde hacer click
            </p>
            <p className="mt-1 leading-5 desktop:text-[15px] desktop:leading-6">{currentStep.instruction || currentStep.summary}</p>
          </div>

          {currentStep.highlights?.length > 1 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-white">
                <FaBullseye className="text-rv-gold" />
                Puntos clave
              </p>
              <ul className="mt-1 grid gap-x-4 gap-y-1 desktop:grid-cols-2">
                {currentStep.highlights.map((item) => (
                  <li key={item} className="flex gap-2 text-[13px] leading-5 text-slate-200">
                    <span className="mt-1.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-rv-gold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : currentStep.highlights?.length === 1 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-[12px] leading-5 text-slate-200">
              <p className="inline-flex items-center gap-2 font-bold uppercase tracking-wide text-white">
                <FaBullseye className="text-rv-gold" />
                Resultado
              </p>
              <p className="mt-0.5">{currentStep.highlights[0]}</p>
            </div>
          ) : null}

          {currentStep.selector && (isMobileLayout || !targetFound) ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] leading-5 text-slate-300">
              {targetFound ? (
                <p>
                  En móvil la guía prioriza que todo el contenido sea visible. El paso ya cambió a la sección correcta y puedes usar esta tarjeta mientras haces scroll.
                </p>
              ) : (
                <p>
                  Buscando el elemento de esta etapa. Si tarda en aparecer, la guía ya cambió a la sección correcta y está esperando el bloque objetivo.
                </p>
              )}
            </div>
          ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex flex-col gap-3 mobile:flex-row mobile:items-center mobile:justify-between">
            <Button variant="ghost" size="sm" onClick={onClose} className="justify-center mobile:justify-start">
              <FaForward className="mr-2" />
              Omitir guia
            </Button>

            <div className="flex flex-col gap-3 mobile:flex-row">
              <Button
                variant="secondary"
                size="sm"
                className="w-full mobile:w-auto"
                onClick={() => setStepIndex((currentValue) => Math.max(0, currentValue - 1))}
                disabled={stepIndex === 0}
              >
                <FaChevronLeft className="mr-2" />
                Anterior
              </Button>

              <Button
                size="sm"
                className="w-full mobile:w-auto"
                onClick={() => {
                  if (isLastStep) {
                    onComplete();
                    return;
                  }

                  setStepIndex((currentValue) => Math.min(totalSteps - 1, currentValue + 1));
                }}
              >
                {isLastStep ? (
                  <>
                    <FaCheckCircle className="mr-2" />
                    Finalizar recorrido
                  </>
                ) : (
                  <>
                    Siguiente paso
                    <FaChevronRight className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PanelUserGuide.propTypes = {
  open: PropTypes.bool.isRequired,
  role: PropTypes.oneOf(['admin', 'trainer', 'student']).isRequired,
  panelLabel: PropTypes.string.isRequired,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      sectionId: PropTypes.string,
      selector: PropTypes.string,
      summary: PropTypes.string.isRequired,
      instruction: PropTypes.string,
      highlights: PropTypes.arrayOf(PropTypes.string),
      placement: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
      scrollBlock: PropTypes.oneOf(['start', 'center', 'end', 'nearest']),
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onSectionChange: PropTypes.func,
};

export default PanelUserGuide;
