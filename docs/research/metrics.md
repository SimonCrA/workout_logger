<!--
Research note. Written 2026-10-28 by a research sub-agent during the rewrite grilling.
Verification tags inside: [V] verified in a fetched page, [S] secondary source only, [M] from the agent's memory, NOT verified.
Do not use [M] numbers (per-muscle MEV/MAV/MRV table, DOTS female, IPF GL women, Sinclair) without checking the source.
Decisions taken from this note are recorded in docs/adr/.
-->

# Research: per-set metrics, progress metrics and standards for a gym logger

Method note: WebSearch/WebFetch only. Several primary pages were blocked (PubMed 403/captcha, Hevy help 403, Stronger by Science 404, RP landmark per-muscle pages not returned). Tags: [V] = verified in a fetched/searched page this session; [M] = from model memory, NOT verified, check before shipping; [S] = secondary source only. Searched app coverage was thin: only Hevy was checked at all. Strong, Boostcamp, RP Hypertrophy, Juggernaut AI, Alpha Progression, Fitbod were NOT verified.

## 1. Per-set metrics

| Metric | Purpose | Evidence | Logging cost | Apps |
|---|---|---|---|---|
| RIR / RPE (Zourdos RIR-based RPE: 10 = 0 RIR, 9 = 1 RIR ...) | Autoregulate load, proximity to failure | Moderate. Scale validated against bar velocity in squat, r = -0.88 experienced / -0.77 novice [V]; novices/experienced differ in accuracy. Proximity-to-failure meta-regression: hypertrophy rises as sets end nearer failure, strength barely affected [S] | Low (1 tap, 6-10) | Hevy: RPE optional, off by default, 6-10, not for warm-ups [V]. Others unverified |
| Tempo | Control time under tension | Weak as a tracked variable | High (3-4 numbers) | Unverified; rare in logs |
| Rest time | Recovery/performance | Rest-interval Bayesian meta-analysis on hypertrophy exists (PubMed 39205815, title only seen) [V title]; Hevy has auto rest timer [V] | Zero if auto-timed from set completion | Hevy [V] |
| Bar velocity (VBT) | Load/fatigue autoregulation | Good for barbell lifts, needs a device | Very high without sensor | Not in simple loggers [M] |
| Set type: warm-up, normal, failure, drop | Exclude warm-ups from volume/PRs; mark intensity techniques | Convention, not a research variable; warm-ups must be excluded from "hard sets" | Low (one selector) | Hevy: normal, warm-up, failure, drop; failure = log last completed rep; timer not auto-started before a drop set [V] |
| Myo-reps, cluster, rest-pause | Technique labels | Weak; RP/popular-coaching concepts, little direct evidence | Medium; model as notes or a set-type enum | Not verified |
| Partial reps | Extend set past failure | Weak/mixed | Medium | Not verified |
| Assisted vs added weight (bodyweight) | Correct load for dips/pull-ups | Pure arithmetic | Low if exercise has a type | Hevy has 3 types: bodyweight, assisted (load = BW - assist), weighted (BW + added) [V]; Hevy adds bodyweight to volume only for library exercises that use full BW [V] |
| Unilateral reps per side | Imbalances | Convention | Medium (double entry) | Unverified |

Sources: Zourdos 2016 JSCR 30(1):267-275, abstract via https://openrepository.aut.ac.nz/items/efef3b25-6701-4fb5-bb82-55fcd2a26027/full ; Helms et al. 2016 S&CJ 38(4):42-49 (RIR/%1RM chart; values not retrieved); Robinson et al. 2024 Sports Med 54(9):2209-2231 doi 10.1007/s40279-024-02069-2 (abstract-level only); Hevy: https://help.hevyapp.com/hc/en-us/articles/34896293707927 , https://help.hevyapp.com/hc/en-us/articles/38386262243223 , https://www.hevyapp.com/features/how-to-calculate-rpe/

## 2. Progress metrics per exercise

1RM formulas (w = weight, r = reps). Source for all: https://en.wikipedia.org/wiki/One-repetition_maximum [V, secondary]
- Epley (1985): w * (1 + r/30)
- Brzycki (1998): w * 36 / (37 - r)
- Lombardi: w * r^0.10
- O'Conner: w * (1 + 0.025 r)
- Mayhew: w / (0.522 + 0.419 e^(-0.055 r))
- Wathan: w / (0.4880 + 0.538 e^(-0.075 r)); Lander: w / (1.013 - 0.0267123 r)
- Validity: the page states no formal range; says formulas diverge greatly after ~10 reps, Epley = Brzycki at 10 reps and Epley is higher below 10, errors can reach 10%+, exercise-specific formulas are better. Brzycki is undefined at r = 37. LeSuer 1997 (JSCR 11(4):211-213): no single formula best; accuracy varies by lift and rep range; 5RM predictions most accurate (secondary accounts) [S]. Wikipedia/others claim Epley came from a poundage chart, not a paper [S].
- RPE/RIR-based: e1RM = w / pct(r + RIR) using a %1RM table (Helms 2016 chart; I could not read values). Simple approximation: treat r + RIR as total reps to failure and use Epley/Brzycki. Accuracy of RIR drops with high reps and fatigue.
- Default formula in apps: could not verify any app's choice. Epley and Brzycki are the common calculator defaults [S]. Do not claim Hevy's.
- Volume load (tonnage) = sum(weight * reps) over working sets. Convention; no validity claim. For assisted: use (BW - assist).
- Effective/stimulating reps (Beardsley): popularly "last ~5 reps before failure"; critiqued, and some studies show growth at 6-7 RIR [S: https://forum.barbellmedicine.com/t/stimulating-reps/4958 , https://ajac.substack.com/p/effective-reps-hypothesis-and-myo]. Do NOT implement as a headline metric.
- PR definitions (convention): weight PR (heaviest weight for r >= 1), rep PR (most reps at a given weight), e1RM PR, volume PR (best set weight*reps). I found no authoritative standard; Hevy's PR rules not retrieved (403).

## 3. Muscle "attention" metrics

- Schoenfeld, Ogborn, Krieger 2017, J Sports Sci 35(11):1073-1082: 34 groups/15 studies; weekly sets as continuous predictor P = 0.002; high vs low volume ~3.9% more gain (P = 0.03); 3-bin (<5, 5-9, 10+ sets) only a trend P = 0.074 [V]. https://pubmed.ncbi.nlm.nih.gov/27433992/ , https://www.tandfonline.com/doi/full/10.1080/02640414.2016.1210197 . Caution: the abstract does NOT itself prove "10-20 sets"; little data above ~10.
- Pelland et al. meta-regression (PubMed 41343037; abstract not read, details from [S] summaries): graded return with diminishing returns (sqrt-like), direct set = 1, indirect set = 0.5 fits best, small effective dose ~4 fractional sets/week, frequency effect negligible at equal volume for hypertrophy. https://pubmed.ncbi.nlm.nih.gov/41343037/ ; summaries https://sci-sport.com/en/muscle-hypertrophy-strength-and-volume-how-does-the-relationship-evolve-272/ , https://www.preprints.org/manuscript/202610.1022
- RP landmarks [V definitions]: MV = preserve muscle (~6 working sets/week if trained 2x/week); MEV = lowest dose that grows; MAV = range of best gains; MRV = upper limit of recovery. Only direct work counts in RP's own page; triceps MRV 18 (direct). Page gives no per-muscle table. https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth
- Frequency: Schoenfeld 2016 (Sports Med) and 2019 volume-equated analyses found frequency matters little once weekly volume is equal [M, not fetched]; Pelland agrees [S].
- Secondary muscles: two conventions. RP: direct only [V]. Research (Pelland): 1.0 direct / 0.5 indirect [S]. Hevy: could not confirm any fractional rule; users request it, and Hevy limits custom exercises to one muscle group to avoid double counting [S: https://strongsplit.userjot.com/board/p/exercise-muscle-improvements]. 0.33 has no source I found.
- "Days since last trained": no evidence-based threshold found; purely informational.
- Per-muscle ranges: no credible primary table retrieved. Third-party blogs disagree (MEV 4-10, MAV 12-20, MRV 18-30) [S: https://arvo.guru/resources/volume-landmarks]. From memory of Israetel's book [M, UNVERIFIED], approximate (MEV / MAV / MRV): chest 8/12-20/22; back 8/14-22/25; quads 8/12-18/20; hamstrings 6/10-16/20; biceps 8/14-20/26; triceps 6/10-14/18; side delts 8/16-22/26; calves 8/12-16/20; glutes 0/4-12/16; abs 0/16-20/25.

## 4. Strength standards and relative-strength scores

- Strength Level: standards from user logs since 2015, 287 exercises, ~46M qualifying results, compared by sex, bodyweight, age; (c) Strength Level Limited, all rights reserved [V: https://www.strengthlevel.com/strength-standards]. Do not copy their tables.
- Symmetric Strength: sex, bodyweight, age inputs; methodology not verified [S: store listings]. ExRx and NSCA/Kraemer tables: NOT verified (no pages retrieved).
- Wilks (original): coef = 500 / (a + bx + cx^2 + dx^3 + ex^4 + fx^5), x = BW kg [V: https://en.wikipedia.org/wiki/Wilks_coefficient]. Men: a=-216.0475144 b=16.2606339 c=-0.002388645 d=-0.00113732 e=7.01863e-6 f=-1.291e-8. Women: a=594.31747775582 b=-27.23842536447 c=0.82112226871 d=-0.00930733913 e=4.731582e-5 f=-9.054e-8. Wilks-2 (2020) uses 600/... with other coefficients (same page). Used by IPF until end 2018 [V].
- DOTS: score = total * 500 / (a + b x + c x^2 + d x^3 + e x^4), x clamped to roughly 40-150 kg. Men a=-307.75076, b=24.0900756, c=-0.1918759221, d=0.0007391293, e=-0.000001093 [V via 2 calculator sites, e.g. https://coachway.io/tools/dots-calculator/ ; coefficient table of OpenPowerlifting source not retrieved]. Women [M, UNVERIFIED]: a=-57.96288, b=13.6175032, c=-0.1126655495, d=0.0005158568, e=-0.0000010706.
- IPF GL: points = total * 100 / (A - B * e^(-C * BW)); A,B,C by sex, equipment, lift. Men classic powerlifting [S]: A=1199.72839, B=1025.18162, C=0.00921 (official PDF text seemed to read 0.09210, likely extraction error; unresolved). Women classic PL [M]: 610.32796, 1045.59282, 0.03048. IPF page: https://www.powerlifting.sport/rules/codes/info/ipf-formula (PDF could not be parsed). GL is for a TOTAL or a single lift category, not arbitrary exercises.
- Sinclair (weightlifting) [M, UNVERIFIED]: coef = 10^(A * log10(BW/b)^2) for BW < b else 1; men A=0.751945030 b=175.508; women A=0.783497476 b=153.655.
- Licensing: no terms found on the IPF page; I did not verify any license for DOTS/Wilks/GL. Formulas are published and widely reimplemented, but check before commercial use. All are sex-specific; none age-adjusted (age factors such as McCulloch/Foster are a separate thing [M]). Inputs: bodyweight, sex, total or lift. They apply to powerlifting totals, not machines/free-weight accessories.
- Practical alternative for a free app: ratio-to-bodyweight standards bands per exercise (sex-specific). Peer-reviewed percentile example (van den Hoek et al. 2024, 90th pct squat 2.83x male / 2.26x female BW) is only via a blog [S: https://www.bodyspec.com/blog/post/strength_standards_benchmarks_across_lifts_demographics]; verify.

## 5. Profile data

- Body weight (dated history): feeds assisted/weighted/bodyweight-exercise load, relative strength (x BW), DOTS/Wilks/GL. Needs history so past sessions use BW at that date.
- Sex: feeds standards bands and Wilks/DOTS/GL coefficients. Required for those only.
- Age: feeds age-based standards (Strength Level / Symmetric Strength use it) only. Informational otherwise.
- Height: no calculation above needs it (anthropometrics did not improve 1RM prediction [V, Wikipedia]). Informational.

## Recommendations

### Per-set metrics
v1:
- weight, reps (core).
- RIR (optional, 0-5+): best-supported autoregulation/proximity signal; cheap; Zourdos RPE mapping lets RPE be derived (RPE = 10 - RIR).
- set type: warm-up / normal / failure / drop: excludes warm-ups from volume, PRs and e1RM; matches Hevy.
- load mode per exercise: weight, bodyweight, assisted, weighted (with dated body weight).
- auto rest duration (timestamp-derived, no entry).
Later:
- per-side (unilateral) reps: doubles input cost.
- free-text note for myo-reps, cluster, rest-pause, partials, tempo (weak evidence; keep as note, not fields).
- bar velocity: needs sensor.

### Formulas to implement
- e1RM = Epley w(1 + r/30) for r in 2-10 (r = 1 -> w), Brzycki w*36/(37-r) as alt; only warm-up-excluded sets, optionally r_eff = r + RIR (cap r_eff <= 10-12); show nothing above that. Source: Wikipedia 1RM page above; LeSuer 1997.
- Volume load = sum(w*r), with w = BW - assist or BW + added.
- Weekly hard sets per muscle = sum direct sets + 0.5 * indirect sets (Pelland [S]); count only non-warm-up sets; also show a direct-only number (RP).
- Relative strength = e1RM / BW; optional DOTS (male coefficients verified, female need verification) or Wilks with the verified coefficients above.
- PRs: weight PR, rep PR at weight, e1RM PR (convention).

### Default weekly set ranges per muscle
No credible published per-muscle default table was retrieved. Defensible generic defaults: ~6 sets = maintenance (RP) [V], roughly 10-20 fractional-or-direct sets as a target band (Schoenfeld + RP-style MAV), shown as "guidance, not rule" and user-editable. The per-muscle numbers in section 3 are from memory and must be checked against RP's per-muscle guides at rpstrength.com before use.
