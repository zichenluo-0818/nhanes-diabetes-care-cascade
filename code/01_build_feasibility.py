"""Build the Stage 2 NHANES diabetes cohort and feasibility summaries.

This script intentionally stops before adjusted modeling. It harmonizes the
2013-2014, 2015-2016, and 2017-2018 public-use files, applies the frozen Stage 2
cohort definitions, and produces unweighted/weighted feasibility summaries.
"""

from pathlib import Path

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_ROOT = PROJECT_ROOT / "data" / "raw"
DERIVED_ROOT = PROJECT_ROOT / "data" / "derived"
TABLE_ROOT = PROJECT_ROOT / "outputs" / "tables"

CYCLES = [
    {"cycle": "2013-2014", "suffix": "H", "start_year": 2013},
    {"cycle": "2015-2016", "suffix": "I", "start_year": 2015},
    {"cycle": "2017-2018", "suffix": "J", "start_year": 2017},
]


def read_component(cycle: str, suffix: str, component: str) -> pd.DataFrame:
    path = RAW_ROOT / cycle / f"{component}_{suffix}.XPT"
    return pd.read_sas(path, format="xport", encoding="utf-8")


def valid_binary(series: pd.Series) -> pd.Series:
    return series.where(series.isin([1.0, 2.0]))


def build_cycle(cycle: str, suffix: str, start_year: int) -> pd.DataFrame:
    demo_vars = [
        "SEQN", "RIDAGEYR", "RIAGENDR", "RIDRETH3", "DMDEDUC2",
        "INDFMPIR", "RIDEXPRG", "SDMVPSU", "SDMVSTRA", "WTMEC2YR",
    ]
    diq_vars = ["SEQN", "DIQ010", "DIQ050", "DIQ070"]

    demo = read_component(cycle, suffix, "DEMO")[demo_vars]
    diq = read_component(cycle, suffix, "DIQ")[diq_vars]
    ghb = read_component(cycle, suffix, "GHB")[["SEQN", "LBXGH"]]
    hiq = read_component(cycle, suffix, "HIQ")[["SEQN", "HIQ011"]]

    for frame, name in [(demo, "DEMO"), (diq, "DIQ"), (ghb, "GHB"), (hiq, "HIQ")]:
        if not frame["SEQN"].is_unique:
            raise ValueError(f"{cycle} {name}: SEQN is not unique")

    df = demo.merge(diq, on="SEQN", how="left", validate="one_to_one")
    df = df.merge(ghb, on="SEQN", how="left", validate="one_to_one")
    df = df.merge(hiq, on="SEQN", how="left", validate="one_to_one")
    df["cycle"] = cycle
    df["cycle_start"] = start_year
    return df


def derive_variables(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()

    # Primary analytic population: adults 20+, not pregnant at the MEC exam,
    # positive MEC weight, observed HbA1c, and a classifiable DIQ010 response.
    out["adult_20plus"] = out["RIDAGEYR"].ge(20)
    out["not_pregnant"] = out["RIDEXPRG"].ne(1) | out["RIDEXPRG"].isna()
    out["mec_participant"] = out["WTMEC2YR"].gt(0)
    out["hba1c_observed"] = out["LBXGH"].notna()
    out["diabetes_response_valid"] = out["DIQ010"].isin([1.0, 2.0, 3.0])
    out["base_eligible"] = (
        out["adult_20plus"]
        & out["not_pregnant"]
        & out["mec_participant"]
        & out["hba1c_observed"]
        & out["diabetes_response_valid"]
    )

    out["diagnosed_diabetes"] = np.where(
        out["base_eligible"], out["DIQ010"].eq(1.0).astype(float), np.nan
    )
    out["probable_undiagnosed_diabetes"] = np.where(
        out["base_eligible"],
        (out["DIQ010"].isin([2.0, 3.0])) & out["LBXGH"].ge(6.5),
        np.nan,
    )
    out["operational_diabetes"] = np.where(
        out["base_eligible"],
        (out["diagnosed_diabetes"].eq(1))
        | (out["probable_undiagnosed_diabetes"].eq(1)),
        np.nan,
    )

    insulin = valid_binary(out["DIQ050"])
    pills = valid_binary(out["DIQ070"])
    treated = pd.Series(np.nan, index=out.index, dtype=float)
    diagnosed = out["diagnosed_diabetes"].eq(1)
    treated.loc[diagnosed & (insulin.eq(1) | pills.eq(1))] = 1.0
    treated.loc[diagnosed & insulin.notna() & pills.notna() & insulin.ne(1) & pills.ne(1)] = 0.0
    out["pharm_treated"] = treated

    out["glycemic_control_primary"] = np.where(
        diagnosed & out["pharm_treated"].eq(1), out["LBXGH"].lt(7.0), np.nan
    )
    out["glycemic_control_sensitivity_8"] = np.where(
        diagnosed & out["pharm_treated"].eq(1), out["LBXGH"].lt(8.0), np.nan
    )

    out["model1_denominator"] = out["operational_diabetes"].eq(1)
    out["model2_denominator"] = out["diagnosed_diabetes"].eq(1) & out["pharm_treated"].notna()
    out["model3_denominator"] = out["diagnosed_diabetes"].eq(1) & out["pharm_treated"].eq(1)

    out["insured"] = np.select(
        [out["HIQ011"].eq(1), out["HIQ011"].eq(2)], ["Insured", "Uninsured"], default=None
    )
    out["pir_group"] = pd.cut(
        out["INDFMPIR"],
        bins=[-np.inf, 1.3, 3.5, np.inf],
        right=False,
        labels=["<1.30", "1.30-<3.50", ">=3.50"],
    ).astype(object)
    out["education"] = out["DMDEDUC2"].map(
        {
            1.0: "Less than high school",
            2.0: "Less than high school",
            3.0: "High school/GED",
            4.0: "Some college/AA",
            5.0: "College graduate or above",
        }
    )
    out["race_ethnicity"] = out["RIDRETH3"].map(
        {
            1.0: "Mexican American",
            2.0: "Other Hispanic",
            3.0: "Non-Hispanic White",
            4.0: "Non-Hispanic Black",
            6.0: "Non-Hispanic Asian",
            7.0: "Other/multiracial",
        }
    )
    out["sex"] = out["RIAGENDR"].map({1.0: "Male", 2.0: "Female"})
    out["mec_weight_6yr"] = out["WTMEC2YR"] / 3.0
    return out


def weighted_percent(values: pd.Series, weights: pd.Series) -> float:
    valid = values.notna() & weights.notna() & weights.gt(0)
    if not valid.any():
        return np.nan
    return 100.0 * np.average(values.loc[valid].astype(float), weights=weights.loc[valid])


def stage_summary(df: pd.DataFrame, scope: str, weight_col: str) -> pd.DataFrame:
    rows = []
    operational = df.loc[df["model1_denominator"]]
    diagnosed = df.loc[df["model2_denominator"]]
    treated = df.loc[df["model3_denominator"]]

    definitions = [
        ("Operational diabetes", operational, None),
        ("Diagnosed among operational diabetes", operational, "diagnosed_diabetes"),
        ("Pharmacologically treated among diagnosed", diagnosed, "pharm_treated"),
        ("HbA1c <7% among diagnosed and treated", treated, "glycemic_control_primary"),
    ]
    for stage, denominator, outcome in definitions:
        if outcome is None:
            n_success = len(denominator)
            pct = 100.0
        else:
            n_success = int(denominator[outcome].eq(1).sum())
            pct = weighted_percent(denominator[outcome], denominator[weight_col])
        rows.append(
            {
                "scope": scope,
                "stage": stage,
                "denominator_n": len(denominator),
                "success_n": n_success,
                "failure_n": len(denominator) - n_success,
                "weighted_percent": pct,
            }
        )
    return pd.DataFrame(rows)


def subgroup_feasibility(df: pd.DataFrame, scope: str) -> pd.DataFrame:
    rows = []
    stage_specs = [
        ("Diagnosis", "model1_denominator", "diagnosed_diabetes"),
        ("Pharmacological treatment", "model2_denominator", "pharm_treated"),
        ("Glycemic control", "model3_denominator", "glycemic_control_primary"),
    ]
    for stage, denominator_flag, outcome in stage_specs:
        stage_df = df.loc[df[denominator_flag]]
        for variable in ["insured", "pir_group", "education", "race_ethnicity"]:
            for level, group in stage_df.groupby(variable, dropna=False, observed=False):
                rows.append(
                    {
                        "scope": scope,
                        "stage": stage,
                        "variable": variable,
                        "level": "Missing" if pd.isna(level) else str(level),
                        "denominator_n": len(group),
                        "events_n": int(group[outcome].eq(1).sum()),
                        "nonevents_n": int(group[outcome].eq(0).sum()),
                    }
                )
    return pd.DataFrame(rows)


def main() -> None:
    DERIVED_ROOT.mkdir(parents=True, exist_ok=True)
    TABLE_ROOT.mkdir(parents=True, exist_ok=True)

    combined = pd.concat(
        [build_cycle(**cycle) for cycle in CYCLES], ignore_index=True, sort=False
    )
    analytic = derive_variables(combined)

    # Derived participant-level file is local and ignored by Git.
    analytic.to_csv(DERIVED_ROOT / "analytic_feasibility_2013_2018.csv", index=False)

    summaries = []
    subgroup_tables = []
    for scope, subset, weight in [
        ("2017-2018", analytic.loc[analytic["cycle"].eq("2017-2018")], "WTMEC2YR"),
        ("2013-2018", analytic, "mec_weight_6yr"),
    ]:
        summaries.append(stage_summary(subset, scope, weight))
        subgroup_tables.append(subgroup_feasibility(subset, scope))

    pd.concat(summaries, ignore_index=True).to_csv(
        TABLE_ROOT / "cycle_feasibility_summary.csv", index=False
    )
    pd.concat(subgroup_tables, ignore_index=True).to_csv(
        TABLE_ROOT / "subgroup_feasibility_counts.csv", index=False
    )

    missingness = (
        analytic.loc[analytic["model1_denominator"], [
            "cycle", "insured", "pir_group", "education", "race_ethnicity",
            "RIDAGEYR", "RIAGENDR", "LBXGH", "pharm_treated",
        ]]
        .isna()
        .groupby(analytic.loc[analytic["model1_denominator"], "cycle"])
        .sum()
    )
    missingness.to_csv(TABLE_ROOT / "core_variable_missingness.csv")

    print(pd.concat(summaries, ignore_index=True).to_string(index=False))


if __name__ == "__main__":
    main()
