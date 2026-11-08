# Stage-Specific Gaps in the U.S. Diabetes Care Cascade

This repository contains a reproducible NHANES analysis of socioeconomic and healthcare-access disparities at three stages of diabetes care: diagnosis, pharmacological treatment, and glycemic control.

## Stage 2 status

The dataset-establishment phase uses the 2013–2014, 2015–2016, and 2017–2018 NHANES cycles. It freezes the analytic cohort and cascade definitions, audits cross-cycle compatibility, and evaluates whether the planned stage-specific models are feasible. Formal adjusted modeling is reserved for the next project phase.

## Repository structure

- `code/`: reproducible cohort-construction and feasibility scripts
- `data_manifest.csv`: official CDC source URLs and file checksums
- `docs/`: data dictionary and frozen design decisions
- `outputs/tables/`: Stage 2 feasibility summaries
- `outputs/figures/`: exploratory figures created later in Stage 2
- `data/raw/` and `data/derived/`: local-only data excluded from Git

## Reproduce the Stage 2 cohort

1. Download the XPT files listed in `data_manifest.csv` into the indicated local paths.
2. Install Python with `pandas` and `numpy`.
3. Run `python code/01_build_feasibility.py`.

The script builds a local participant-level feasibility file and publishes nonidentifying aggregate tables in `outputs/tables/`.

## Primary Stage 2 definitions

- Population: nonpregnant NHANES MEC participants aged 20 years or older with positive MEC examination weights, observed HbA1c, and a classifiable diabetes response.
- Operational diabetes: self-reported diagnosed diabetes or probable undiagnosed diabetes based on HbA1c ≥6.5%.
- Pharmacological treatment: current insulin and/or oral diabetes-pill use among diagnosed adults.
- Primary glycemic control: HbA1c <7.0% among diagnosed and pharmacologically treated adults.
- Survey weight: `WTMEC2YR / 3` for the pooled 2013–2018 analysis, with `SDMVSTRA` and `SDMVPSU` used for variance estimation.

## Data source

NHANES public-use data are provided by the U.S. Centers for Disease Control and Prevention, National Center for Health Statistics. The source files remain governed by CDC/NCHS public-use documentation and are not redistributed through this repository.

