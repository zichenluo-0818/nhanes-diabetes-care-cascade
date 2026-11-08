# Stage 2 Decision Log

## 2026-11-08 — Primary cycle range

**Decision:** Use pooled NHANES 2013–2018 as the primary dataset. Retain 2017–2018 as a cycle-restricted sensitivity analysis if model precision permits.

**Evidence:** The frozen feasibility cohort contains 2,758 adults with operational diabetes in 2013–2018, compared with 994 in 2017–2018. The pooled dataset retains 2,267 classifiable diagnosed adults for the treatment model and 1,882 treated adults for the glycemic-control model. The single-cycle design has several race/ethnicity and treatment-stage cells with fewer than 30 events or non-events. Pooling substantially improves these cells, although the other/multiracial category remains too sparse for stable primary adjusted contrasts.

**Comparability:** Core variable names and coding are consistent across the three cycles. HbA1c uses the same primary HPLC approach and laboratory site across 2013–2018. The 2017–2018 documentation notes a minor secondary-instrument change for retested specimens; NCHS reports that it did not significantly affect results.

## 2026-11-08 — Target population

**Decision:** Analyze nonpregnant U.S. civilian noninstitutionalized adults aged 20 years or older who participated in the MEC examination, have a positive MEC weight, have observed HbA1c, and have a valid `DIQ010` response of yes, no, or borderline.

**Rationale:** Age 20 aligns the target population with the released adult education variable `DMDEDUC2`. Requiring observed HbA1c provides one consistent examined cohort for defining probable undiagnosed diabetes and glycemic control. Current pregnancy is excluded because the project does not analyze gestational diabetes or pregnancy-specific glycemic interpretation.

## 2026-11-08 — Diabetes and cascade stages

**Operational diabetes:** `DIQ010 = 1`, or `DIQ010 in (2, 3)` with `LBXGH >= 6.5`.

**Diagnosis outcome:** `DIQ010 = 1` among adults with operational diabetes.

**Pharmacological-treatment outcome:** `DIQ050 = 1` or `DIQ070 = 1` among diagnosed adults. The outcome is zero only when both items are classifiable and neither is yes. Refused, don't know, and unresolved structural missingness remain missing.

**Primary glycemic-control outcome:** `LBXGH < 7.0` among diagnosed and pharmacologically treated adults. `LBXGH < 8.0` is a simple threshold sensitivity analysis; an individualized target algorithm remains a later sensitivity option.

## 2026-11-08 — Disparity variables

- Insurance: insured versus uninsured using `HIQ011`.
- Family income-to-poverty ratio: `<1.30`, `1.30–<3.50`, and `>=3.50` using `INDFMPIR`.
- Education: less than high school, high school/GED, some college/AA, and college graduate or above using `DMDEDUC2`.
- Race/ethnicity: all six `RIDRETH3` categories retained in descriptive work. Other/multiracial is not a primary adjusted contrast unless later diagnostics support stable estimation; it will not be combined with another group merely to increase sample size.

## 2026-11-08 — Survey design

Use the MEC examination weight because HbA1c is required. For the three equally sized two-year cycles, define the pooled six-year weight as `WTMEC2YR / 3`. Use `SDMVSTRA` and `SDMVPSU` for Taylor-series variance estimation. Perform subpopulation/domain analysis rather than treating the diabetes cohort as a simple random sample.

## Unresolved before formal modeling

- Decide whether PIR missingness, approximately 10.5% in each model denominator, requires multiple imputation or a complete-case primary analysis with sensitivity checks.
- Check model-matrix rank, collinearity, survey degrees of freedom, and separation before placing all four disparity constructs in the same adjusted model.
- Decide whether race/ethnicity contrasts will use separate focal-exposure models or one mutually adjusted model.

