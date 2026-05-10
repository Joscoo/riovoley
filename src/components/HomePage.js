import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';
import PageShell from './ui/PageShell';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';

const FEATURES = [
  {
    title: 'Entrenadores Profesionales',
    description: 'Staff tecnico certificado con experiencia a nivel nacional.',
    icon: (
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    )
  },
  {
    title: 'Instalaciones Modernas',
    description: 'Canchas de primer nivel totalmente equipadas para entrenar todo el ano.',
    icon: (
      <>
        <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z" stroke="currentColor" strokeWidth="2" />
        <path d="M17 11v1a5 5 0 0 1-10 0v-1M12 19v2M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    )
  },
  {
    title: 'Resultados Comprobados',
    description: 'Multiples campeonatos y logros regionales y nacionales.',
    icon: (
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    )
  }
];

const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 120);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <PageShell>
      <section
        className={cn(
          'relative flex min-h-[calc(100dvh-56px)] items-center justify-center px-4 pb-16 pt-12 transition-all duration-700 mobile:min-h-[calc(100dvh-65px)] mobile:px-6 tablet:px-10',
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <div className="relative mb-4 inline-flex items-center justify-center">
            <div className="absolute -inset-6 rounded-full bg-rv-gold/20 blur-2xl" aria-hidden="true" />
            <h1 className="relative bg-gradient-to-r from-white via-rv-gold to-amber-300 bg-clip-text text-5xl font-black tracking-tight text-transparent mobile:text-6xl tablet:text-7xl">
              Rio<span className="text-white">voley</span>
            </h1>
          </div>

          <p className="max-w-3xl text-xl font-semibold text-rv-gold mobile:text-2xl">Formando Campeones, Construyendo Suenos</p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-100 mobile:text-lg">
            La escuela de voleibol mas prestigiosa de Riobamba. Desarrollamos talento deportivo con excelencia y pasion en
            un entorno moderno y competitivo.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 mobile:mt-10 mobile:flex-row mobile:justify-center">
            <Link
              to="/sobre"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rv-gold to-amber-400 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-rv-dark shadow-rv-gold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 mobile:min-w-[240px]"
            >
              Conoce Nuestra Historia
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>
            <Link
              to="/horarios"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-rv-gold/45 bg-black/35 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-rv-gold/15 mobile:min-w-[220px]"
            >
              Ver Horarios
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>
          </div>

          <div className="mt-12 hidden items-center gap-2 text-sm text-slate-200 mobile:inline-flex">
            <span className="inline-flex h-6 w-4 justify-center rounded-full border border-white/45 p-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rv-gold animate-bounce" />
            </span>
            Desliza para mas
          </div>
        </div>
      </section>

      <section className="px-4 py-12 mobile:px-6 tablet:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <SectionHeader title="Por Que Elegirnos?" centered />
          <div className="mt-6 grid gap-4 tablet:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="h-full">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rv-gold/20 text-rv-gold">
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 mobile:px-6 tablet:px-10">
        <div className="mx-auto grid w-full max-w-4xl gap-4 mobile:grid-cols-2">
          <Card className="text-center">
            <p className="text-4xl font-black text-rv-gold">50+</p>
            <p className="mt-1 text-sm text-slate-100">Estudiantes Activos</p>
          </Card>
          <Card className="text-center">
            <p className="text-4xl font-black text-rv-gold">5+</p>
            <p className="mt-1 text-sm text-slate-100">Anos de Experiencia</p>
          </Card>
        </div>
      </section>

      <section className="px-4 pb-16 pt-10 mobile:px-6 tablet:px-10">
        <Card className="mx-auto max-w-4xl text-center" padding="lg">
          <h2 className="text-3xl font-black text-white mobile:text-4xl">Listo para Empezar?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-200 mobile:text-base">
            Comienza tu viaje hacia la excelencia deportiva hoy mismo.
          </p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rv-gold to-amber-400 px-8 py-3 text-sm font-extrabold uppercase tracking-wide text-rv-dark shadow-rv-gold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105"
            >
              Acceder al Portal
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </Card>
      </section>
    </PageShell>
  );
};

export default HomePage;
