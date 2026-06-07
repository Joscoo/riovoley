begin;

do $$
begin
  if to_regclass('public.physical_tests') is not null then
    execute $sql$
      comment on column public.physical_tests.estatura is 'Altura total del estudiante medida en metros.';
      comment on column public.physical_tests.peso is 'Peso corporal del estudiante medido en kilogramos.';
      comment on column public.physical_tests.envergadura_brazos_extendidos_lateral is 'Distancia entre las puntas de los dedos con ambos brazos extendidos en cruz.';
      comment on column public.physical_tests.brazo_extend_inicial is 'Medida tomada con el estudiante de pie y estirando hacia arriba su brazo dominante.';
      comment on column public.physical_tests.brazo_extend_sin_impulso is 'Alcance maximo en salto vertical desde parado, usando solo impulso vertical.';
      comment on column public.physical_tests.brazo_extend_con_impulso is 'Alcance maximo en salto vertical usando la carrera de remate.';
      comment on column public.physical_tests.fuerza_explosiva_salto_largo is 'Distancia lograda al saltar hacia adelante desde parado con impulso de sentadilla.';
      comment on column public.physical_tests.fuerza_abdomen is 'Cantidad de abdominales realizadas en un minuto.';
      comment on column public.physical_tests.fuerza_brazos is 'Cantidad de flexiones de brazo realizadas en un minuto.';
      comment on column public.physical_tests.fuerza_piernas is 'Cantidad de sentadillas realizadas en un minuto.';
      comment on column public.physical_tests.elevaciones_barra is 'Cantidad de dominadas en barra realizadas en un minuto.';
      comment on column public.physical_tests.observaciones is 'Comentarios adicionales sobre el rendimiento, la tecnica o recomendaciones.';
    $sql$;
  end if;

  if to_regclass('training.physical_tests') is not null then
    execute $sql$
      comment on column training.physical_tests.estatura is 'Altura total del estudiante medida en metros.';
      comment on column training.physical_tests.peso is 'Peso corporal del estudiante medido en kilogramos.';
      comment on column training.physical_tests.envergadura_brazos_extendidos_lateral is 'Distancia entre las puntas de los dedos con ambos brazos extendidos en cruz.';
      comment on column training.physical_tests.brazo_extend_inicial is 'Medida tomada con el estudiante de pie y estirando hacia arriba su brazo dominante.';
      comment on column training.physical_tests.brazo_extend_sin_impulso is 'Alcance maximo en salto vertical desde parado, usando solo impulso vertical.';
      comment on column training.physical_tests.brazo_extend_con_impulso is 'Alcance maximo en salto vertical usando la carrera de remate.';
      comment on column training.physical_tests.fuerza_explosiva_salto_largo is 'Distancia lograda al saltar hacia adelante desde parado con impulso de sentadilla.';
      comment on column training.physical_tests.fuerza_abdomen is 'Cantidad de abdominales realizadas en un minuto.';
      comment on column training.physical_tests.fuerza_brazos is 'Cantidad de flexiones de brazo realizadas en un minuto.';
      comment on column training.physical_tests.fuerza_piernas is 'Cantidad de sentadillas realizadas en un minuto.';
      comment on column training.physical_tests.elevaciones_barra is 'Cantidad de dominadas en barra realizadas en un minuto.';
      comment on column training.physical_tests.observaciones is 'Comentarios adicionales sobre el rendimiento, la tecnica o recomendaciones.';
    $sql$;
  end if;
end $$;

commit;
