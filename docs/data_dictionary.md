# NHANES Diabetes Care Cascade Data Dictionary

## Study scope

- **Cycles:** NHANES 2013–2014, 2015–2016, and 2017–2018
- **Target population:** Nonpregnant MEC participants aged 20 years or older with a positive MEC examination weight, observed HbA1c, and a classifiable diabetes-diagnosis response
- **Operational diabetes:** Self-reported diagnosed diabetes or probable undiagnosed diabetes defined by HbA1c >=6.5%
- **Primary analysis:** Three conditional, survey-weighted modified Poisson regression models with robust standard errors
- **Effect measure:** Adjusted prevalence ratio (aPR) with 95% confidence interval

Unweighted counts are used to describe the observed sample and assess feasibility. Population percentages and regression estimates will use the NHANES complex survey design.

## Conditional model definitions

| Model | Conditional analysis population | Gap outcome coded 1 | Reference coded 0 |
|---|---|---|---|
| Diagnosis gap | Adults with operational diabetes | Probable undiagnosed diabetes | Diagnosed diabetes |
| Treatment gap | Diagnosed adults with known treatment status | Not pharmacologically treated | Pharmacologically treated |
| Glycemic-control gap | Pharmacologically treated adults | HbA1c >=7.0% | HbA1c <7.0% |

The glycemic-control-gap model is the primary model. The diagnosis- and treatment-gap models are secondary cascade models. These outcomes describe cross-sectional status and must not be interpreted as longitudinal improvement or causal treatment effects.

## Identifiers and cohort variables

| Analysis variable | Source module | NHANES variable | Definition and coding | Missing-data rule | Model use |
|---|---|---|---|---|---|
| `seqn` | DEMO | `SEQN` | Public respondent identifier used as the one-to-one merge key | None expected | Data linkage only |
| `cycle` | DEMO/file cycle | `SDDSRVYR` or file suffix | `2013-2014`, `2015-2016`, or `2017-2018` | None | All models; categorical cycle adjustment |
| `age_years` | DEMO | `RIDAGEYR` | Age in completed years; require age >=20 | Missing excluded | Eligibility and adjustment |
| `pregnant` | DEMO | `RIDEXPRG` | Code 1 = pregnant; code 2 = not pregnant; code 3 = cannot ascertain. Exclude pregnant participants | Code 3 is unknown; structural missing outside the applicable age/sex group is treated as not pregnant by design | Cohort definition |
| `base_eligible` | Derived | Multiple | Age >=20, not pregnant, positive MEC weight, observed HbA1c, and `DIQ010` in 1, 2, or 3 | Unclassifiable inputs excluded | Base cohort |
| `operational_diabetes` | Derived | `DIQ010`, `LBXGH` | 1 when diagnosed diabetes = 1 or probable undiagnosed diabetes = 1 | Unclassifiable inputs excluded | Diagnosis-gap denominator |

## Demographic and disparity variables

| Analysis variable | Source module | NHANES variable | Definition and analysis levels | Missing-data rule | Model use |
|---|---|---|---|---|---|
| `sex` | DEMO | `RIAGENDR` | 1 = male; 2 = female | Other values set to missing | Adjustment in all models |
| `race_ethnicity` | DEMO | `RIDRETH3` | Mexican American; other Hispanic; non-Hispanic White; non-Hispanic Black; non-Hispanic Asian; other/multiracial | Missing retained as missing | Primary disparity variable in all models |
| `education` | DEMO | `DMDEDUC2` | Less than high school (codes 1–2); high school/GED (3); some college/AA (4); college graduate or above (5) | Codes 7 and 9 and missing set to missing | Primary disparity variable in all models |
| `family_pir` | DEMO | `INDFMPIR` | Family income-to-poverty ratio. Planned categories: <1.30; 1.30–<3.50; >=3.50 | Missing retained; complete-case versus imputation strategy to be finalized | Primary disparity variable in all models |
| `insured` | HIQ | `HIQ011` | 1 = insured; 2 = uninsured | Codes 7 and 9 and missing set to missing | Primary disparity variable in all models |

## Diabetes cascade and outcome variables

| Analysis variable | Source module | NHANES variable | Definition and coding | Missing-data rule | Model use |
|---|---|---|---|---|---|
| `hba1c` | GHB | `LBXGH` | Glycohemoglobin percentage | Missing excluded from the primary cohort | Eligibility; diagnosis and control definitions |
| `diagnosed_diabetes` | DIQ | `DIQ010` | 1 when code 1; 0 when code 2 or 3 within the operational-diabetes population | Codes 7 and 9 and missing set to missing | Component of diagnosis-gap outcome |
| `probable_undiagnosed_diabetes` | DIQ + GHB | `DIQ010`, `LBXGH` | 1 when `DIQ010` is 2 or 3 and HbA1c >=6.5% | Unclassifiable if either input is missing | Component of operational diabetes; diagnosis gap |
| `diagnosis_gap` | Derived | `diagnosed_diabetes` | 1 = probable undiagnosed; 0 = diagnosed | Missing when diagnosis cannot be classified | Diagnosis-gap outcome |
| `insulin_now` | DIQ | `DIQ050` | 1 = taking insulin now; 2 = not taking insulin now | Codes 7 and 9 and missing set to missing | Treatment component |
| `diabetes_pills_now` | DIQ | `DIQ070` | 1 = taking diabetes pills now; 2 = not taking diabetes pills now | Codes 7 and 9 set to missing; structural missing preserved | Treatment component |
| `pharm_treated` | Derived | `DIQ050`, `DIQ070` | 1 if either medication item =1; 0 only when treatment status is classifiable and neither item =1 | Otherwise missing | Treatment-gap reference; glycemic-control denominator |
| `treatment_gap` | Derived | `pharm_treated` | 1 = not pharmacologically treated; 0 = pharmacologically treated | Missing when treatment status cannot be classified | Treatment-gap outcome |
| `glycemic_control_primary` | Derived | `LBXGH` | 1 when HbA1c <7.0%; 0 when HbA1c >=7.0% among pharmacologically treated adults | HbA1c missing excluded upstream | Control indicator |
| `glycemic_control_gap` | Derived | `LBXGH` | 1 when HbA1c >=7.0%; 0 when HbA1c <7.0% among pharmacologically treated adults | HbA1c missing excluded upstream | Primary glycemic-control-gap outcome |
| `glycemic_control_sensitivity_8` | Derived | `LBXGH` | 1 when HbA1c <8.0%; 0 when HbA1c >=8.0% | HbA1c missing excluded upstream | Sensitivity analysis |

## Survey-design variables

| Analysis variable | Source module | NHANES variable | Definition and use | Missing-data rule |
|---|---|---|---|---|
| `mec_weight_2yr` | DEMO | `WTMEC2YR` | Released two-year MEC examination weight | Require a positive value |
| `mec_weight_6yr` | Derived from DEMO | `WTMEC2YR / 3` | Pooled six-year MEC weight for three adjacent two-year cycles; used for weighted estimates and regression | Require a positive value |
| `stratum` | DEMO | `SDMVSTRA` | Masked variance pseudo-stratum used in the survey-design object | Missing excluded |
| `psu` | DEMO | `SDMVPSU` | Masked variance pseudo-primary sampling unit used in the survey-design object | Missing excluded |

The formal analysis will specify `mec_weight_6yr` as the weight, `stratum` as the stratification variable, and `psu` as the clustering variable. Conditional cascade populations will be analyzed as survey domains/subpopulations rather than as independent simple-random samples.

## Current feasibility counts

| Cascade population | Unweighted n |
|---|---:|
| Operational diabetes | 2,758 |
| Diagnosed diabetes | 2,269 |
| Diagnosed with classifiable treatment status | 2,267 |
| Pharmacologically treated | 1,882 |
| Pharmacologically treated with HbA1c <7.0% | 809 |
| Pharmacologically treated with HbA1c >=7.0% | 1,073 |

These are dataset-establishment counts, not nationally representative prevalence estimates.

## Interpretation boundaries

- A single HbA1c measurement is an operational research definition and not clinical confirmation of diabetes.
- No reported diabetes medication does not necessarily mean no diabetes care; lifestyle management and unmeasured treatment history may be present.
- HbA1c <7.0% is the prespecified primary research threshold, but individual clinical targets can differ.
- NHANES is a repeated cross-sectional survey. The analysis estimates associations and prevalence differences, not longitudinal change or causal treatment effects.
- IQR-based extreme-value flags are review indicators and are not automatic exclusion rules.

## Official sources

- [NHANES 2013–2014 DEMO](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2013/DataFiles/DEMO_H.htm)
- [NHANES 2013–2014 DIQ](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2013/DataFiles/DIQ_H.htm)
- [NHANES 2013–2014 GHB](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2013/DataFiles/GHB_H.htm)
- [NHANES 2013–2014 HIQ](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2013/DataFiles/HIQ_H.htm)
- [NHANES 2015–2016 DEMO](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2015/DataFiles/DEMO_I.htm)
- [NHANES 2015–2016 DIQ](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2015/DataFiles/DIQ_I.htm)
- [NHANES 2015–2016 GHB](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2015/DataFiles/GHB_I.htm)
- [NHANES 2015–2016 HIQ](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2015/DataFiles/HIQ_I.htm)
- [NHANES 2017–2018 DEMO](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/DEMO_J.htm)
- [NHANES 2017–2018 DIQ](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/DIQ_J.htm)
- [NHANES 2017–2018 GHB](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/GHB_J.htm)
- [NHANES 2017–2018 HIQ](https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/HIQ_J.htm)
- [NHANES weighting tutorial](https://wwwn.cdc.gov/nchs/nhanes/tutorials/weighting.aspx)

