# Gamification Decisions Log

This document records the product and technical decisions taken while applying Octalysis to Riovoley.

## Decision Log

### 2026-06-07 - Phase 1 scope
- Phase: 1
- Topic: Initial rollout scope
- Context: Octalysis can affect multiple subsystems, but the current repo already has mature `physical-tests` and `student-dashboard` features.
- Decision: Start with physical progress for students as the primary gamification source.
- Alternatives discarded:
  - Gamify the entire student panel in the first phase.
  - Roll out a system-wide cross-role gamification spec from day one.
- Product impact: The first release focuses on measurable value instead of superficial engagement.
- Technical impact: The first integration points are `physical-tests`, `student-dashboard`, and a new `gamification` feature.
- Dependencies: `physical-tests`, `student-dashboard`, Supabase tables and views.
- Status: accepted

### 2026-06-07 - Motivation style
- Phase: 1
- Topic: Motivation balance
- Context: The student population is mixed and includes minors, so purely competitive mechanics would add unnecessary risk.
- Decision: Use a mixed approach with progress-first feedback and light social comparison.
- Alternatives discarded:
  - Pure self-improvement with no public comparison.
  - Heavy competition with strong rank exposure.
- Product impact: The system can activate social drivers without turning the experience punitive.
- Technical impact: Leaderboards use alias-based visibility and remain category-scoped.
- Dependencies: leaderboard projection, student aliases, category metadata.
- Status: accepted

### 2026-06-07 - Data ownership
- Phase: 1
- Topic: Feature boundaries
- Context: The project follows clean-lite by feature and already separates domain logic from Supabase access.
- Decision: `physical-tests` remains the source of truth for physical data, while `gamification` owns derived motivational data.
- Alternatives discarded:
  - Spreading gamification logic across `student-dashboard` and `physical-tests`.
  - Keeping gamification as UI-only decoration.
- Product impact: Progress rules remain consistent across screens.
- Technical impact: A new transversal feature is introduced with its own repository, use cases, service, and views.
- Dependencies: clean-lite feature structure, Supabase compatibility views.
- Status: accepted

### 2026-06-07 - Rewards and operations
- Phase: 1
- Topic: Rewards model and operational load
- Context: The first rollout needs low manual overhead and no physical reward logistics.
- Decision: Use only digital rewards in phase 1 and automate recalculation from verified physical-test events.
- Alternatives discarded:
  - Physical or monetary rewards.
  - Manual badge curation as a primary flow.
- Product impact: Students receive immediate feedback without waiting for manual review.
- Technical impact: XP, levels, achievements, streaks, and challenge progress are derived automatically.
- Dependencies: physical test write flow, gamification sync use case.
- Status: accepted

### 2026-06-07 - Social visibility and privacy
- Phase: 1
- Topic: Leaderboard exposure
- Context: Rankings are useful for `Social Influence & Relatedness`, but full-name visibility is too aggressive for a mixed-age population.
- Decision: Expose rankings only by category and with public aliases instead of full names.
- Alternatives discarded:
  - Full name ranking by category.
  - No ranking at all.
- Product impact: The leaderboard remains motivating while reducing social friction.
- Technical impact: A public leaderboard view must expose aliases instead of user names.
- Dependencies: student category data, public compatibility view for leaderboard rows.
- Status: accepted

### 2026-06-07 - Health guidance boundary
- Phase: 1
- Topic: Physical and nutrition guidance
- Context: The existing student dashboard already shows IMC-driven recommendations, but the product is not a clinical tool.
- Decision: Keep all physical and nutrition guidance orientative and non-clinical.
- Alternatives discarded:
  - Prescriptive plans authored directly in the app.
  - Aggressive body-composition targets.
- Product impact: The app remains motivational and supportive without overpromising medical guidance.
- Technical impact: Copy and challenge logic must avoid clinical claims or punitive body metrics.
- Dependencies: student progress UI, challenge catalog, dashboard copy.
- Status: accepted

### 2026-06-07 - Persistence model
- Phase: 1
- Topic: What gets stored
- Context: The implementation needs durable motivational state without making raw physical data redundant.
- Decision: Persist student profiles, reward events, achievements, challenge progress, and leaderboard snapshots in a dedicated `gamification` schema, while still being able to derive a transient projection on read.
- Alternatives discarded:
  - UI-only calculations with no persistence.
  - Event logs without profile projections.
- Product impact: Students get stable progress state and administrators can evolve rules later.
- Technical impact: Phase 1 introduces dedicated tables, public compatibility views, and RLS policies.
- Dependencies: Supabase schema, public views, feature repository methods.
- Status: accepted

### 2026-06-07 - Consistency model
- Phase: 1
- Topic: Gamification sync behavior
- Context: Physical tests are created from the frontend and cannot rely on a database transaction that spans multiple public views.
- Decision: Treat gamification sync as best-effort after a physical test write; do not roll back the physical test if the derived sync fails.
- Alternatives discarded:
  - Failing the physical test write whenever gamification sync fails.
  - Leaving all recalculation to a future background worker.
- Product impact: Coaches do not lose valid test data due to secondary projection errors.
- Technical impact: The physical-test use case triggers gamification recalculation in a guarded follow-up call.
- Dependencies: `physical-tests` service/use cases, gamification processing use case.
- Status: accepted

### 2026-06-07 - Backfill strategy
- Phase: 1
- Topic: Existing students with historic tests
- Context: Once the SQL is applied, many students may already have physical test history but no persisted gamification profile yet.
- Decision: Mostrar gamificacion derivada en lectura para estudiantes y reservar la persistencia de backfill para flujos con permisos de entrenador/admin o procesos administrativos.
- Alternatives discarded:
  - Forzar que el estudiante persista el backfill desde su propia sesion.
  - Esperar siempre a un test nuevo sin mostrar nada mientras tanto.
- Product impact: Existing students see real progress without requiring a new privileged write.
- Technical impact: `student-dashboard` no longer attempts to write `gamification_profiles` or related tables during student read flows.
- Dependencies: `student-dashboard`, `gamification` feature, applied SQL views/tables.
- Status: accepted

### 2026-06-07 - Physical test terminology
- Phase: 1
- Topic: Naming and description of physical-test metrics
- Context: Several physical-test fields were visible with short or ambiguous labels, which made the student and coach views harder to understand.
- Decision: Standardize physical-test copy with descriptive Spanish labels and short explanations for each metric, keeping the stored field names unchanged.
- Alternatives discarded:
  - Preserve technical labels exactly as stored in the database.
  - Add long instructional text in every card and chart title.
- Product impact: Students and coaches can understand each measurement without guessing what the metric represents.
- Technical impact: A shared field-metadata catalog now drives labels across physical-test forms, charts, and student history, and SQL column comments were aligned with the same terminology.
- Dependencies: `physical-tests` feature, `student-dashboard`, physical test schema comments.
- Status: accepted

### 2026-06-07 - Student-facing gamification language
- Phase: 2
- Topic: Visible narrative and terminology
- Context: The internal design is based on Octalysis, but students do not need to see framework terminology or motivation-taxonomy labels.
- Decision: Keep Octalysis as an internal product framework and present the student experience as a visual progress journey focused on level, XP, streaks, challenges, and achievements.
- Alternatives discarded:
  - Mention Octalysis directly in the student UI.
  - Show `core drivers` labels as part of achievements and challenges.
- Product impact: The student experience feels more natural, aspirational, and less system-driven.
- Technical impact: The progress panel hides framework metadata and prioritizes dynamic visual progress components instead.
- Dependencies: `gamification` presentation layer, student dashboard integration.
- Status: accepted

### 2026-06-07 - Attendance as gamification source
- Phase: 2
- Topic: Secondary verified activity source
- Context: Physical tests measure progress quality, but they do not capture day-to-day consistency by themselves.
- Decision: Use attendance as a second verified source of XP, achievements, and monthly challenges.
- Alternatives discarded:
  - Keep attendance outside gamification entirely.
  - Award points for passive UI activity instead of real participation.
- Product impact: Students are rewarded both for measurable progress and for sustained presence in training.
- Technical impact: Attendance writes now trigger gamification recalculation and the projection includes attendance-based XP, achievements, and challenges.
- Dependencies: `attendance` feature, `gamification` feature, student leaderboard/profile projection.
- Status: accepted

### 2026-06-07 - Locked and hidden achievements
- Phase: 2
- Topic: Achievement progression visibility
- Context: Showing only unlocked achievements limits anticipation and weakens curiosity.
- Decision: Show a mix of blocked achievements with visible progress and hidden surprise achievements with partial information.
- Alternatives discarded:
  - Show only unlocked achievements.
  - Reveal every achievement rule in full from day one.
- Product impact: Students understand what they can pursue now while still keeping a surprise factor in the system.
- Technical impact: The gamification use case now returns `lockedAchievements` with progress indicators and hidden-state handling.
- Dependencies: `gamification` catalog defaults, student progress UI.
- Status: accepted

### 2026-06-07 - Activation and retention nudges
- Phase: 3
- Topic: Student activation without push dependency
- Context: The system already has levels, retos and logros, but students also need contextual reminders that keep momentum visible between milestones.
- Decision: Add in-panel nudges derived from current XP, nearest challenge, attendance rhythm and active streak, while also preparing push routing for future gamification notifications.
- Alternatives discarded:
  - Depend entirely on backend push before offering any retention cues.
  - Show static tips unrelated to the student's actual progress.
- Product impact: The student sees clear next actions and momentum reminders even when no new achievement has fired yet.
- Technical impact: `gamification` now returns `nudges` and mobile push routing recognizes progress-related notification types.
- Dependencies: `gamification` projection, student progress UI, shared mobile push routing.
- Status: accepted

### 2026-06-07 - Payments as progress source
- Phase: 4
- Topic: Verified financial continuity inside progress
- Context: Tests and attendance cover sports effort, but the system also needs to reflect verified monthly continuity without turning the panel into a collection screen.
- Decision: Count registered payments as a third source of progress, add a light bonus for active coverage, and create payment-based achievements and challenges.
- Alternatives discarded:
  - Ignore payments entirely in student progress.
  - Remove XP or punish students when a payment is overdue.
- Product impact: The student sees that continuity includes training, evaluation, and keeping membership current, without aggressive payment language.
- Technical impact: `payments` now triggers `refreshStudentProgress`, and `gamification` reads payment history to derive XP, achievements, challenges, nudges, and UI insights.
- Dependencies: `payments` feature, `gamification` feature, student progress panel.
- Status: accepted
