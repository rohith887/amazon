// Central registry of the operational reports exposed by the portal.
export const REPORT_TYPES = [
  { value: "agent_performance", label: "Agent Performance Report" },
  { value: "agent_quality", label: "Agent Quality Report" },
  { value: "quality_data_dump", label: "Quality Data Dump" },
  { value: "quality_short_call", label: "Quality Short Call Data Dump" },
  { value: "interaction", label: "Interaction Report" },
  { value: "leads_completion", label: "Leads Completion Report" },
  { value: "leads_data_dump", label: "Leads Data Dump" },
  { value: "disposition", label: "Disposition Report" },
];

export const REPORT_TYPE_VALUES = REPORT_TYPES.map((r) => r.value);

export function isReportType(value) {
  return REPORT_TYPE_VALUES.includes(value);
}

// Inclusive date-range filter for ISO date strings (YYYY-MM-DD).
export function dayRange(startDate, endDate) {
  const out = {};
  if (startDate) out.$gte = new Date(`${startDate}T00:00:00`);
  if (endDate) out.$lte = new Date(`${endDate}T23:59:59.999`);
  return out;
}

export function todayRange() {
  const now = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  return dayRange(iso(now), iso(now));
}
