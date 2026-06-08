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

### 2026-06-07 - Multi-leaderboard competition
- Phase: 4
- Topic: Competitive rankings by activity and measurement
- Context: A single leaderboard by total XP is not enough to motivate different student profiles or make specific strengths visible.
- Decision: Expose multiple category leaderboards derived from real activity, including overall progress, physical measurements, attendances, and registered monthly payments.
- Alternatives discarded:
  - Keep only one global ranking by XP.
  - Show ranking rows only for students with persisted gamification profiles.
- Product impact: More students can compete from different strengths, and any student with real activity can appear in at least one relevant table.
- Technical impact: Leaderboards are now derived from category students plus physical tests, attendances, and payments, instead of depending only on stored snapshots.
- Dependencies: `gamification` use cases, `student-dashboard`, `physical-tests`, `attendance`, `payments`.
- Status: accepted

### 2026-06-07 - Named competition inside category
- Phase: 4
- Topic: Visible competitor identity in student rankings
- Context: The competitive goal of the product now prioritizes recognizing direct rivals and record holders, not only anonymous positions.
- Decision: Show readable student names in category leaderboards and emphasize who leads each record table.
- Alternatives discarded:
  - Keep all leaderboards anonymized with aliases.
  - Reveal names only for the top three positions.
- Product impact: The leaderboard feels more like a real competition and makes each record holder visible to the rest of the category.
- Technical impact: Leaderboard rows now expose readable competitor names and the UI adds record-oriented copy per table.
- Dependencies: `gamification` leaderboard derivation, student progress panel.
- Status: accepted

### 2026-06-07 - Structured expansion for progression and identity
- Phase: 5
- Topic: Next-stage gamification architecture
- Context: The current system already covers physical progress, attendance, payments and category competition, but the next iteration needs stronger retention, clearer progression traceability and a richer sense of identity.
- Decision: Expand the feature through a structured internal architecture composed of XP, streak, achievement, challenge, competition, recommendation, identity and economy engines inside `gamification`.
- Alternatives discarded:
  - Keep adding rules directly inside one growing projection file.
  - Expand only the UI without formalizing new internal responsibilities.
- Product impact: Students get a deeper and more scalable motivational system instead of isolated new widgets.
- Technical impact: The feature should evolve into multiple bounded subdomains and new persistence models such as XP ledger, identity and economy.
- Dependencies: `gamification` feature, `auth-session`, `attendance`, `payments`, `physical-tests`.
- Status: accepted

### 2026-06-07 - Daily login reward boundary
- Phase: 5
- Topic: Login-based rewards
- Context: Daily login can help habit formation, but if it becomes too valuable it will distort the system and encourage low-value farming.
- Decision: Allow a minimum daily login reward at most once per day, while keeping verified sports and continuity actions as the primary progression sources.
- Alternatives discarded:
  - No reward at all for login activity.
  - Meaningful XP gains for frequent logins.
- Product impact: The system reinforces return habit without allowing login to dominate progression.
- Technical impact: A dedicated daily login reward flow and persistence guard are required.
- Dependencies: `auth-session`, XP ledger, daily reward storage.
- Status: accepted

### 2026-06-07 - Weekday attendance streak
- Phase: 5
- Topic: Attendance continuity model
- Context: Monthly or generic streaks do not make weekday training rhythm visible enough.
- Decision: Add a streak based on consecutive business days from Monday to Friday, allowing the chain to continue across calendar weeks.
- Alternatives discarded:
  - Reset the streak every Monday.
  - Keep only month-level consistency streaks.
- Product impact: Students can perceive continuity in day-to-day training rhythm more clearly.
- Technical impact: The streak engine must understand business-day continuity instead of only month buckets.
- Dependencies: `attendance`, streak engine, student progress UI.
- Status: accepted

### 2026-06-07 - Detailed XP ledger
- Phase: 5
- Topic: XP traceability
- Context: Students need to understand exactly where their progress comes from if the system is going to grow in complexity.
- Decision: Introduce a detailed XP extract with one auditable row per XP source and contextual copy.
- Alternatives discarded:
  - Keep only aggregate XP totals.
  - Show grouped summaries without event traceability.
- Product impact: The student gains clarity, trust and stronger perception of earned progress.
- Technical impact: A new ledger table and read model are required.
- Dependencies: XP engine, student progress UI, persistence layer.
- Status: accepted

### 2026-06-07 - Large mixed objective catalog
- Phase: 5
- Topic: Goal system depth
- Context: The current catalog is useful but still too narrow to sustain long-term motivation.
- Decision: Use a mixed objective model with a wide permanent catalog plus monthly, weekly and pre-cycle temporary objectives.
- Alternatives discarded:
  - Keep most goals permanent only.
  - Rely mostly on temporary challenges with little long-term progression.
- Product impact: Students can always see both enduring milestones and short-term urgency.
- Technical impact: Challenge and achievement engines must support more categories, visibility states and future-cycle previews.
- Dependencies: achievement engine, challenge engine, UI visibility rules.
- Status: accepted

### 2026-06-07 - Balanced competition and self-improvement
- Phase: 5
- Topic: Motivational balance in expanded objectives
- Context: The user explicitly wants stronger competition, but not at the cost of fairness for late joiners or weaker students.
- Decision: Balance goals evenly between self-improvement and competition, with visible competitive mechanics but enough personal progress routes to avoid dead ends.
- Alternatives discarded:
  - Mostly self-improvement with light competition.
  - Mostly competitive progression.
- Product impact: The system pushes students to compare and improve without becoming exclusionary.
- Technical impact: Goal catalog, leaderboards and recommendations must mix rival-facing and self-facing progress routes.
- Dependencies: competition engine, recommendation engine, achievements, challenges.
- Status: accepted

### 2026-06-07 - Preparatory pre-challenges
- Phase: 5
- Topic: What happens after monthly completion
- Context: Students should not feel that progress stalls after finishing the current month.
- Decision: When monthly goals are completed, show and enable preparatory pre-challenges for the following cycle, with limited but real reward value.
- Alternatives discarded:
  - Show only a preview of the next month.
  - Leave the student with no further objective once the month is complete.
- Product impact: Anticipation and retention stay active at end-of-cycle moments.
- Technical impact: The challenge engine must support next-cycle generated objectives and differentiated rewards.
- Dependencies: challenge engine, upcoming challenge UI, challenge persistence.
- Status: accepted

### 2026-06-07 - Identity layer with moderated nicknames and collectible titles
- Phase: 5
- Topic: Public student identity
- Context: Competition becomes stronger when students can be recognized through self-expression, not only through legal names.
- Decision: Add moderated free-form nicknames and collectible titles that students can unlock and choose to display.
- Alternatives discarded:
  - Title assignment only by automatic best-achievement logic.
  - Nicknames limited to fixed templates.
- Product impact: Students gain stronger identity, belonging and visible status in rankings.
- Technical impact: Public identity projection, moderation rules and equipped title state are required.
- Dependencies: identity engine, leaderboard UI, student profile UI.
- Status: accepted

### 2026-06-07 - Soft-currency economy and configurable illustrated avatars
- Phase: 5
- Topic: Personalization economy
- Context: The user wants avatars, decoratives, clothing and visible customization, but does not want to design custom assets from scratch.
- Decision: Introduce a soft-currency economy tied to achievements, goals and levels, plus configurable illustrated avatars built on an existing tool or library instead of bespoke asset production.
- Alternatives discarded:
  - No economy layer.
  - Full custom art pipeline from day one.
- Product impact: The system gains ownership, curiosity and retention through collectable personalization.
- Technical impact: New wallet, currency ledger, catalog, inventory and equipped-items models are needed, plus integration with a reusable avatar solution.
- Dependencies: economy engine, identity engine, external avatar tooling, student profile UI.
- Status: accepted

### 2026-06-07 - Implemented XP ledger, daily login reward and weekday streak
- Phase: 5
- Topic: First structured rollout delivered
- Context: The approved expansion required a first vertical slice that students could feel immediately without waiting for identity or economy features.
- Decision: Implement the first foundation slice with a visible XP extract, a once-per-day minimum login reward, and a weekday attendance streak integrated into the student panel.
- Alternatives discarded:
  - Wait until avatar, titles and economy were ready before shipping any structured expansion.
  - Add login reward without persistence guard or without showing the source in the UI.
- Product impact: Students can now understand where XP comes from and see a more specific continuity mechanic around weekday training.
- Technical impact: Added `gamification.xp_ledger`, `gamification.login_rewards`, new repository/service methods, and student-panel support for XP extract plus weekday streak.
- Dependencies: `gamification`, `auth-session`, student progress UI, SQL migration `gamification_phase13_foundation_2026_06_07.sql`.
- Status: accepted

### 2026-06-07 - Implemented moderated nicknames and equipable titles
- Phase: 5
- Topic: Competitive identity rollout
- Context: The next approved slice after the XP foundation was to make competition more personal and visible without waiting for avatar or economy features.
- Decision: Implement `student_identity` with moderated nicknames, title catalog, title unlocking derived from achievements/levels/leaderboard leadership, and title selection by the student.
- Alternatives discarded:
  - Delay identity until avatar and currency were ready.
  - Keep legal names only and assign titles automatically with no choice.
- Product impact: Students can now be recognized in rankings by a chosen nickname and a visible collectible title, increasing ownership and social motivation.
- Technical impact: Added title catalog + student identity persistence, new service/use case flow to update identity, and leaderboard formatting that enriches rows with equipped titles.
- Dependencies: `gamification_phase14_identity_2026_06_07.sql`, identity UI in student panel, leaderboard projection formatting.
- Status: accepted
