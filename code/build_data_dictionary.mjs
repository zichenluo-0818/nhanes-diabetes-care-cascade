import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputPath = new URL("../docs/project2_data_dictionary.xlsx", import.meta.url).pathname;
const font = "Arial";
const dark = "#1F4E78";
const mid = "#D9EAF7";
const light = "#F3F7FA";
const amber = "#FFF2CC";
const text = "#1F2937";

const wb = Workbook.create();
const overview = wb.worksheets.add("Overview");
const dictionary = wb.worksheets.add("Data Dictionary");
const stages = wb.worksheets.add("Stage Definitions");
const audit = wb.worksheets.add("Cycle Audit");
const feasibility = wb.worksheets.add("Feasibility");
const sources = wb.worksheets.add("Sources");

function baseSheet(sheet) {
  sheet.showGridLines = false;
}

function title(sheet, titleText, subtitle) {
  sheet.getRange("A2").values = [[titleText]];
  sheet.getRange("A2").format.font = { name: font, size: 15, bold: true, color: dark };
  sheet.getRange("A3").values = [[subtitle]];
  sheet.getRange("A3").format.font = { name: font, size: 10, italic: true, color: "#4B5563" };
  sheet.getRange("A4:H4").format.borders = { bottom: { style: "thin", color: dark } };
}

function styleTable(sheet, rangeAddress, headerAddress) {
  const range = sheet.getRange(rangeAddress);
  range.format.font = { name: font, size: 10, color: text };
  range.format.verticalAlignment = "top";
  const header = sheet.getRange(headerAddress);
  header.format = {
    fill: dark,
    font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
    verticalAlignment: "center",
    horizontalAlignment: "center",
    wrapText: true,
    borders: { preset: "inside", style: "thin", color: "#FFFFFF" },
  };
  range.format.borders = {
    insideHorizontal: { style: "thin", color: "#D9E1E8" },
    bottom: { style: "thin", color: "#AAB7C4" },
  };
}

title(overview, "Project 2 Stage 2 Dataset Specification", "Frozen on 2026-11-08 before formal adjusted modeling");
overview.getRange("A6:B15").values = [
  ["Decision", "Frozen specification"],
  ["Primary cycles", "NHANES 2013-2014, 2015-2016, and 2017-2018"],
  ["Target population", "Nonpregnant MEC participants aged 20+ with positive MEC weight, observed HbA1c, and valid DIQ010"],
  ["Operational diabetes", "Diagnosed diabetes or probable undiagnosed diabetes with HbA1c >=6.5%"],
  ["Model 1", "Diagnosis among all adults with operational diabetes"],
  ["Model 2", "Pharmacological treatment among diagnosed adults"],
  ["Model 3", "HbA1c <7.0% among diagnosed and pharmacologically treated adults"],
  ["Primary weight", "WTMEC2YR / 3, with SDMVSTRA and SDMVPSU"],
  ["Primary disparities", "Insurance, PIR, education, and race/ethnicity"],
  ["Main unresolved issue", "PIR missing-data strategy and final mutually adjusted model structure"],
];
styleTable(overview, "A6:B15", "A6:B6");
overview.getRange("A17:C22").values = [
  ["Feasibility result", "2017-2018", "2013-2018"],
  ["Operational diabetes, N", 994, 2758],
  ["Diagnosed and treatment classifiable, N", 804, 2267],
  ["Diagnosed and pharmacologically treated, N", 685, 1882],
  ["Control events: HbA1c <7%, N", 308, 809],
  ["Decision", "Secondary/restricted", "Primary"],
];
styleTable(overview, "A17:C22", "A17:C17");
overview.getRange("A24").values = [["Interpretation note"]];
overview.getRange("A24").format.font = { name: font, size: 10, bold: true, color: dark };
overview.getRange("A25:A26").values = [["Pooling improves stage-specific subgroup counts. Other/multiracial remains sparse for adjusted race/ethnicity contrasts and will not be combined with another group solely to increase sample size."], ["These are dataset-establishment summaries, not final inferential results."]];
overview.getRange("A25:C26").merge(true);
overview.getRange("A25:C26").format.wrapText = true;

const dictRows = [
  ["seqn", "ID", "DEMO", "SEQN", "Respondent sequence number", "All participants", "Public respondent identifier used for one-to-one merges", "Retain as merge key; do not use as predictor", "None expected", "All", "All cycles", "Official DEMO codebook"],
  ["age_years", "Adjustment/eligibility", "DEMO", "RIDAGEYR", "Age in years at screening", "All participants", "Age in completed years", "Require >=20; model as continuous unless functional-form diagnostics indicate otherwise", "Missing excluded", "All", "Consistent", "Official DEMO codebook"],
  ["sex", "Adjustment", "DEMO", "RIAGENDR", "Gender", "All participants", "1 male; 2 female", "Male/Female; reference selected before modeling", "Other/special values missing", "All", "Consistent", "Official DEMO codebook"],
  ["race_ethnicity", "Primary disparity", "DEMO", "RIDRETH3", "Race/Hispanic origin with NH Asian", "All participants", "1 Mexican American; 2 Other Hispanic; 3 NH White; 4 NH Black; 6 NH Asian; 7 Other/multiracial", "Retain six descriptive levels; other/multiracial not a primary adjusted contrast unless stable", "Missing retained as missing", "All", "Available consistently since 2011-2012", "Official DEMO codebook"],
  ["education", "Primary disparity", "DEMO", "DMDEDUC2", "Education level - Adults 20+", "Age 20+", "1 less than 9th; 2 grades 9-11; 3 HS/GED; 4 some college/AA; 5 college+", "Combine 1-2 as less than high school; retain 3, 4, 5", "7/9/missing -> missing", "All", "Consistent", "Official DEMO codebook"],
  ["family_pir", "Primary disparity", "DEMO", "INDFMPIR", "Ratio of family income to poverty", "All participants", "Continuous 0-5; 5 means >=5", "Primary groups: <1.30; 1.30-<3.50; >=3.50", "Missing remains missing; assess imputation", "All", "Consistent; top-coded at 5", "Official DEMO codebook"],
  ["pregnant", "Exclusion", "DEMO", "RIDEXPRG", "Pregnancy status at exam", "Females 20-44", "1 pregnant; 2 not pregnant; 3 cannot ascertain", "Exclude code 1; missing outside target age/sex is not pregnant by design", "Code 3 treated as unknown and excluded in sensitivity check", "Cohort", "Consistent", "Official DEMO codebook"],
  ["insured", "Primary disparity", "HIQ", "HIQ011", "Covered by health insurance", "All participants", "1 yes; 2 no", "Insured versus uninsured", "7/9/missing -> missing", "All", "Consistent", "Official HIQ codebook"],
  ["hba1c", "Eligibility/outcome", "GHB", "LBXGH", "Glycohemoglobin (%)", "Examined participants age 12+", "HbA1c percentage", "Require observed value; use >=6.5 for probable undiagnosed diabetes; <7.0 for primary control", "Missing excluded from primary cohort", "Models 1 and 3", "Primary HPLC approach comparable; minor 2017-2018 secondary instrument change", "Official GHB codebook"],
  ["diagnosed_diabetes", "Stage outcome", "DIQ", "DIQ010", "Doctor told participant has diabetes", "Age 1+", "1 yes; 2 no; 3 borderline", "1 if code 1; 0 if code 2 or 3 within operational diabetes", "7/9/missing -> missing", "Model 1", "Consistent", "Official DIQ codebook"],
  ["probable_undiagnosed_diabetes", "Eligibility", "DIQ + GHB", "DIQ010 + LBXGH", "No confirmed self-reported diagnosis with HbA1c in diabetes range", "Base-eligible adults", "DIQ010 in (2,3) and LBXGH >=6.5", "Derived binary flag", "Unclassifiable if either input missing", "Model 1", "Consistent", "Prespecified operational definition"],
  ["operational_diabetes", "Eligibility", "Derived", "DIQ010 + LBXGH", "Diagnosed or probable undiagnosed diabetes", "Base-eligible adults", "Diagnosed_diabetes = 1 OR probable_undiagnosed_diabetes = 1", "Defines Model 1 denominator", "Unclassifiable inputs excluded", "Model 1", "Consistent", "Prespecified operational definition"],
  ["insulin_now", "Treatment component", "DIQ", "DIQ050", "Taking insulin now", "Age 1+", "1 yes; 2 no", "Treatment component only", "7/9/missing -> missing", "Model 2", "Consistent", "Official DIQ codebook"],
  ["diabetes_pills_now", "Treatment component", "DIQ", "DIQ070", "Taking diabetic pills to lower blood sugar", "DIQ065 eligible", "1 yes; 2 no", "Treatment component only", "7/9/missing -> missing; structural missing preserved", "Model 2", "Consistent", "Official DIQ codebook"],
  ["pharm_treated", "Stage outcome", "Derived", "DIQ050 + DIQ070", "Current insulin and/or oral diabetes-pill use", "Diagnosed adults", "1 if either item =1; 0 only if both classifiable and neither =1", "Derived binary flag", "Otherwise missing", "Models 2 and 3", "Consistent", "Prespecified definition"],
  ["glycemic_control_primary", "Stage outcome", "Derived", "LBXGH", "Primary glycemic control", "Diagnosed and pharmacologically treated adults", "LBXGH <7.0", "Derived binary flag", "HbA1c missing excluded upstream", "Model 3", "Consistent", "Prespecified threshold"],
  ["glycemic_control_sensitivity_8", "Sensitivity outcome", "Derived", "LBXGH", "Alternative simple glycemic-control threshold", "Diagnosed and pharmacologically treated adults", "LBXGH <8.0", "Derived binary flag", "HbA1c missing excluded upstream", "Sensitivity", "Consistent", "Prespecified sensitivity threshold"],
  ["cycle", "Adjustment", "Derived", "SDDSRVYR/file cycle", "NHANES two-year cycle", "All participants", "2013-2014; 2015-2016; 2017-2018", "Categorical adjustment variable", "None", "All", "Consistent", "Official DEMO codebook"],
  ["mec_weight_6yr", "Survey design", "DEMO", "WTMEC2YR", "Pooled six-year MEC examination weight", "MEC participants", "WTMEC2YR / 3", "Use for all primary weighted estimates", "Require >0", "All", "Equal scaling across three cycles", "NHANES weighting guidance"],
  ["stratum", "Survey design", "DEMO", "SDMVSTRA", "Masked variance pseudo-stratum", "All participants", "Released stratum code", "Use in survey design object", "Missing excluded", "All", "Consistent", "Official DEMO codebook"],
  ["psu", "Survey design", "DEMO", "SDMVPSU", "Masked variance pseudo-PSU", "All participants", "Released PSU code", "Use in survey design object", "Missing excluded", "All", "Consistent", "Official DEMO codebook"],
];
dictionary.getRange("A2").values = [["Project 2 Data Dictionary"]];
dictionary.getRange("A2").format.font = { name: font, size: 15, bold: true, color: dark };
dictionary.getRange("A4:L4").values = [["Analysis name", "Role", "Source file", "Source variable", "Official label/construct", "Universe", "Raw codes/input", "Derivation/analysis levels", "Missing rule", "Model use", "Cross-cycle notes", "Source"]];
dictionary.getRange("A5").write(dictRows);
styleTable(dictionary, `A4:L${4 + dictRows.length}`, "A4:L4");
dictionary.getRange(`E5:L${4 + dictRows.length}`).format.wrapText = true;
dictionary.freezePanes.freezeRows(4);
dictionary.freezePanes.freezeColumns(2);

const stageRows = [
  ["Base cohort", "All adults meeting Stage 2 eligibility", "Age >=20; not pregnant; WTMEC2YR >0; LBXGH observed; DIQ010 in (1,2,3)", "Not a modeled outcome", "MEC-examined U.S. civilian noninstitutionalized adults"],
  ["Operational diabetes", "Base cohort with diagnosed or probable undiagnosed diabetes", "DIQ010=1 OR [DIQ010 in (2,3) AND LBXGH>=6.5]", "Model 1 denominator", "Single HbA1c is an operational research definition, not clinical confirmation"],
  ["Diagnosis", "Adults with operational diabetes", "DIQ010=1", "Model 1 outcome", "P(diagnosed | operational diabetes)"],
  ["Pharmacological treatment", "Diagnosed adults with classifiable medication response", "DIQ050=1 OR DIQ070=1", "Model 2 outcome", "P(pharmacologically treated | diagnosed); no-medication report does not mean no care"],
  ["Glycemic control", "Diagnosed and pharmacologically treated adults", "LBXGH<7.0", "Model 3 outcome", "P(controlled | diagnosed and pharmacologically treated)"],
];
title(stages, "Frozen Cascade Definitions", "Numerators, denominators, and interpretation boundaries");
stages.getRange("A6:E6").values = [["Stage", "Denominator", "Numerator/definition", "Analysis role", "Interpretation"]];
stages.getRange("A7").write(stageRows);
styleTable(stages, `A6:E${6 + stageRows.length}`, "A6:E6");
stages.getRange(`B7:E${6 + stageRows.length}`).format.wrapText = true;

const auditRows = [
  ["DEMO", "H / I / J", "RIDAGEYR, RIAGENDR, RIDRETH3, DMDEDUC2, INDFMPIR, RIDEXPRG, WTMEC2YR, SDMVSTRA, SDMVPSU", "Available in all cycles with consistent core coding", "Pass"],
  ["DIQ", "H / I / J", "DIQ010, DIQ050, DIQ070", "Variable names and relevant coding consistent", "Pass"],
  ["GHB", "H / I / J", "LBXGH", "Primary HPLC approach and laboratory site comparable; minor 2017-2018 secondary-method instrument change reported as not significant", "Pass with note"],
  ["HIQ", "H / I / J", "HIQ011", "Yes/no insurance-coverage item consistent", "Pass"],
  ["Weighting", "2013-2018", "WTMEC2YR", "Three adjacent two-year cycles; divide each two-year MEC weight by 3", "Pass"],
];
title(audit, "Cross-Cycle Variable Audit", "NHANES 2013-2018 compatibility review");
audit.getRange("A6:E6").values = [["Component", "Cycle suffixes", "Core variables", "Finding", "Status"]];
audit.getRange("A7").write(auditRows);
styleTable(audit, `A6:E${6 + auditRows.length}`, "A6:E6");
audit.getRange(`C7:D${6 + auditRows.length}`).format.wrapText = true;
audit.getRange("E7:E11").format.fill = light;

const feasibilityRows = [
  ["2017-2018", "Operational diabetes", 994, 994, 0, 100.0],
  ["2017-2018", "Diagnosed among operational diabetes", 994, 804, 190, 83.0789],
  ["2017-2018", "Pharmacologically treated among diagnosed", 804, 685, 119, 83.1669],
  ["2017-2018", "HbA1c <7% among diagnosed and treated", 685, 308, 377, 44.6678],
  ["2013-2018", "Operational diabetes", 2758, 2758, 0, 100.0],
  ["2013-2018", "Diagnosed among operational diabetes", 2758, 2269, 489, 83.8502],
  ["2013-2018", "Pharmacologically treated among diagnosed", 2267, 1882, 385, 83.0373],
  ["2013-2018", "HbA1c <7% among diagnosed and treated", 1882, 809, 1073, 44.9166],
];
title(feasibility, "Cycle Feasibility Summary", "Unweighted counts and preliminary weighted percentages; not final inference");
feasibility.getRange("A6:F6").values = [["Scope", "Stage", "Denominator N", "Success N", "Failure N", "Weighted %"]];
feasibility.getRange("A7").write(feasibilityRows);
styleTable(feasibility, `A6:F${6 + feasibilityRows.length}`, "A6:F6");
feasibility.getRange("C7:E14").format.numberFormat = "#,##0";
feasibility.getRange("F7:F14").format.numberFormat = "0.0";
feasibility.getRange("A16:B18").values = [
  ["Decision", "Use 2013-2018 as the primary dataset; retain 2017-2018 as a restricted sensitivity analysis if precision permits."],
  ["Reason", "The pooled dataset substantially reduces sparse stage/group cells. Several single-cycle race/ethnicity and treatment-stage cells have fewer than 30 events or non-events."],
  ["Remaining caution", "Other/multiracial remains sparse for some pooled adjusted contrasts; PIR is missing for about 10.5% of each model denominator."],
];
feasibility.getRange("A16:A18").format = { fill: amber, font: { name: font, size: 10, bold: true, color: text } };
feasibility.getRange("B16:F18").merge(true);
feasibility.getRange("B16:F18").format.wrapText = true;

const sourceRows = [
  ["2013-2014 DEMO", "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2013/DataFiles/DEMO_H.htm"],
  ["2013-2014 DIQ", "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2013/DataFiles/DIQ_H.htm"],
  ["2013-2014 GHB", "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2013/DataFiles/GHB_H.htm"],
  ["2013-2014 HIQ", "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2013/DataFiles/HIQ_H.htm"],
  ["2015-2016 DEMO", "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2015/DataFiles/DEMO_I.htm"],
  ["2015-2016 DIQ", "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2015/DataFiles/DIQ_I.htm"],
  ["2015-2016 GHB", "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2015/DataFiles/GHB_I.htm"],
  ["2015-2016 HIQ", "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2015/DataFiles/HIQ_I.htm"],
  ["2017-2018 DEMO", "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/DEMO_J.htm"],
  ["2017-2018 DIQ", "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/DIQ_J.htm"],
  ["2017-2018 GHB", "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/GHB_J.htm"],
  ["2017-2018 HIQ", "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/HIQ_J.htm"],
  ["NHANES weighting tutorial", "https://wwwn.cdc.gov/nchs/nhanes/tutorials/weighting.aspx"],
];
title(sources, "Official Sources", "CDC/NCHS NHANES documentation used for the Stage 2 specification");
sources.getRange("A6:B6").values = [["Source", "URL"]];
sources.getRange("A7").write(sourceRows);
styleTable(sources, `A6:B${6 + sourceRows.length}`, "A6:B6");

// Sizing and navigation.
overview.getRange("A1:C30").format.font = { name: font, size: 10, color: text };
overview.getRange("A:A").format.columnWidth = 34;
overview.getRange("B:B").format.columnWidth = 92;
overview.getRange("C:C").format.columnWidth = 18;
dictionary.getRange("A:A").format.columnWidth = 28;
dictionary.getRange("B:D").format.columnWidth = 20;
dictionary.getRange("E:L").format.columnWidth = 34;
dictionary.getRange("A4:L25").format.autofitRows();
stages.getRange("A:A").format.columnWidth = 28;
stages.getRange("B:E").format.columnWidth = 42;
audit.getRange("A:B").format.columnWidth = 22;
audit.getRange("C:D").format.columnWidth = 54;
audit.getRange("E:E").format.columnWidth = 18;
feasibility.getRange("A:A").format.columnWidth = 18;
feasibility.getRange("B:B").format.columnWidth = 52;
feasibility.getRange("C:F").format.columnWidth = 16;
sources.getRange("A:A").format.columnWidth = 28;
sources.getRange("B:B").format.columnWidth = 96;

for (const sheet of [overview, dictionary, stages, audit, feasibility, sources]) {
  baseSheet(sheet);
  sheet.freezePanes.freezeRows(sheet === dictionary ? 4 : 6);
}

overview.tabColor = dark;
dictionary.tabColor = "#5B9BD5";
stages.tabColor = "#5B9BD5";
audit.tabColor = "#A5A5A5";
feasibility.tabColor = "#70AD47";
sources.tabColor = "#A5A5A5";

wb.recalculate();

for (const [sheetName, range] of [
  ["Overview", "A1:C26"],
  ["Data Dictionary", "A1:L25"],
  ["Stage Definitions", "A1:E12"],
  ["Cycle Audit", "A1:E12"],
  ["Feasibility", "A1:F18"],
  ["Sources", "A1:B20"],
]) {
  const preview = await wb.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(`/tmp/${sheetName.replaceAll(" ", "_")}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(wb);
await output.save(outputPath);

const check = await wb.inspect({
  kind: "table",
  range: "Overview!A6:C22",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 6,
});
console.log(check.ndjson);

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);
console.log(outputPath);
