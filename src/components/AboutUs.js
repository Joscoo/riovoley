import React from 'react';
import { FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import PageShell from './ui/PageShell';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';

const VALUES = [
  {
    title: 'Disciplina',
    text: 'Fomentamos la puntualidad, el respeto por el proceso y la perseverancia. La disciplina es el puente entre metas y logros.'
  },
  {
    title: 'Trabajo en Equipo',
    text: 'Ensenamos que el voleibol se construye en conjunto. Confiamos, apoyamos y celebramos el progreso colectivo.'
  },
  {
    title: 'Excelencia',
    text: 'Buscamos mejora continua en cada entrenamiento para llevar a cada atleta a su mejor version.'
  },
  {
    title: 'Pasion',
    text: 'Cultivamos alegria por el juego y respeto por el rival, jugando siempre con deportividad.'
  }
];

const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/rio.voley',
    icon: <FaInstagram />
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@riovoley',
    icon: <FaTiktok />
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/593963840728',
    icon: <FaWhatsapp />
  }
];

const AboutUs = () => {
  return (
    <PageShell>
      <section className="px-4 pb-10 pt-16 text-center mobile:px-6 tablet:px-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="bg-gradient-to-r from-white via-rv-gold to-amber-300 bg-clip-text text-4xl font-black text-transparent mobile:text-5xl">
            Sobre Nosotros
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-100 mobile:text-lg">Conoce nuestra historia y lo que nos hace unicos.</p>
        </div>
      </section>

      <section className="px-4 py-6 mobile:px-6 tablet:px-10">
        <div className="mx-auto grid max-w-6xl gap-4 tablet:grid-cols-2">
          <Card className="h-full" padding="lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white">Nuestra Mision</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-200 mobile:text-base">
              Formar integralmente a ninos, ninas y jovenes de Riobamba en voleibol con un programa estructurado de iniciacion,
              aprendizaje y perfeccionamiento tecnico, promoviendo disciplina, respeto y valores.
            </p>
          </Card>

          <Card className="h-full" padding="lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white">Nuestra Vision</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-200 mobile:text-base">
              Ser la escuela de voleibol lider en Riobamba y referente en la region, reconocida por excelencia metodologica,
              desarrollo humano y formacion de atletas con integridad dentro y fuera de la cancha.
            </p>
          </Card>
        </div>
      </section>

      <section className="px-4 py-10 mobile:px-6 tablet:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHeader title="Nuestros Valores" centered />
          <div className="mt-6 grid gap-4 mobile:grid-cols-2">
            {VALUES.map((value) => (
              <Card key={value.title} className="h-full" padding="lg">
                <h4 className="text-xl font-bold text-rv-gold">{value.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-200 mobile:text-base">{value.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 mobile:px-6 tablet:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHeader title="Contactanos" centered />
          <div className="mt-6 grid gap-4 tablet:grid-cols-2">
            <Card className="text-center" padding="lg">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rv-gold/20 text-rv-gold">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">Telefono</h4>
              <p className="mt-1 text-slate-200">0963 840 728</p>
              <a
                href="tel:+593963840728"
                className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-rv-gold px-6 py-3 text-sm font-bold text-rv-dark transition-all duration-200 hover:brightness-105"
              >
                Llamar
              </a>
            </Card>

            <Card className="text-center" padding="lg">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">WhatsApp</h4>
              <p className="mt-1 text-slate-200">Escribenos ahora</p>
              <a
                href="https://wa.me/593963840728?text=Hola,%20me%20interesa%20informacion%20sobre%20Riovoley"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:brightness-110"
              >
                Chatear
              </a>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 mobile:px-6 tablet:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHeader title="Siguenos" centered />
          <div className="mt-6 grid gap-4 mobile:grid-cols-3">
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black/35 text-white transition-all duration-200 hover:-translate-y-1 hover:border-rv-gold/60 hover:bg-rv-gold/15"
              >
                <span className="text-3xl text-rv-gold">{social.icon}</span>
                <span className="font-semibold">{social.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-10 mobile:px-6 tablet:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHeader title="Nuestra Ubicacion" centered />
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4798.2580374811805!2d-78.6524372242609!3d-1.6507429983339346!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d3a9bdb6b16f71%3A0xb4f5ad9daa85eb65!2sEscuela%20de%20Voleibol%20%22RIOVOLEY%22!5e1!3m2!1ses-419!2sec!4v1753062935200!5m2!1ses-419!2sec"
              width="100%"
              height="420"
              className="border-0"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicacion Escuela de Voleibol Riovoley"
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export default AboutUs;
