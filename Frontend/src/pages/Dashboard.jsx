import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { Card, CardHeader } from "../components/ui/Card.jsx";
import { SelectField, TextField } from "../components/ui/Field.jsx";
import { StatTile } from "../components/ui/StatTile.jsx";
import { DataTable } from "../components/ui/DataTable.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { icons } from "../components/ui/Icons.jsx";
import { todayIso, firstOfMonthIso, daysAgoIso } from "../utils/date.js";
import { formatNumber } from "../utils/format.js";

const SERIES = [
  { key: "outReach", label: "Out-Reaches", colorVar: "--series-outreach" },
  { key: "connected", label: "Connected Count", colorVar: "--series-connected" },
  { key: "completed", label: "Completed Count", colorVar: "--series-completed" },
  { key: "closed", label: "Closed Count", colorVar: "--series-closed" },
];

const RATE_TILES = [
  { label: "Connect Rate", from: "connected", of: "outReach", colorVar: "--brand-500" },
  { label: "Completed Share", from: "completed", of: "outReach", colorVar: "--success-500" },
  { label: "Close Rate", from: "closed", of: "outReach", colorVar: "--warning-500" },
];

const LEADERBOARD_SIZE = 8;

const PRESETS = [
  { label: "Today", start: todayIso, end: todayIso },
  { label: "Last 7 Days", start: () => daysAgoIso(6), end: todayIso },
  { label: "This Month", start: firstOfMonthIso, end: todayIso },
];

function pct(num, denom) {
  if (!denom) return "0%";
  return `${Math.round((num / denom) * 100)}%`;
}

export default function Dashboard() {
  const [startDate, setStartDate] = useState(firstOfMonthIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [reportType, setReportType] = useState("agent");
  const [activity, setActivity] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [data, setData] = useState({ totals: {}, series: [], reportTypes: [], activities: [] });

  useEffect(() => {
    let cancelled = false;
    api
      .get("/dashboard", { startDate, endDate, reportType, activity })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, reportType, activity]);

  const rangeLabel = startDate === endDate ? startDate : `${startDate} – ${endDate}`;
  const reportLabel = data.reportTypes.find((rt) => rt.value === reportType)?.label ?? "";
  const activityLabel = data.activities.find((a) => a.value === activity)?.label ?? "";

  const sortedSeries = [...data.series].sort((a, b) => b.outReach - a.outReach);
  const top = sortedSeries.slice(0, LEADERBOARD_SIZE);
  const max = Math.max(1, ...top.map((r) => r.outReach));

  const tableColumns = [
    { key: "name", header: "Name" },
    { key: "outReach", header: "Out-Reaches", align: "right" },
    { key: "connected", header: "Connected", align: "right" },
    { key: "completed", header: "Completed", align: "right" },
    { key: "closed", header: "Closed", align: "right" },
  ];

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <p>Monitor outreach and activity performance at a glance.</p>
      </div>

      <Card>
        <div className="card-header">
          <div>
            <h2>Filters</h2>
            <p className="filters-summary">{`${rangeLabel} · ${reportLabel} · ${activityLabel}`}</p>
          </div>
          <button
            className={`filters-toggle-btn${filtersOpen ? " open" : ""}`}
            title="Toggle filters"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {icons.chevronDown()}
          </button>
        </div>
        <div className={`filters-body${filtersOpen ? "" : " collapsed"}`}>
          <div className="filters-body-inner">
            <div className="filter-presets">
              {PRESETS.map((preset) => {
                const active = startDate === preset.start() && endDate === preset.end();
                return (
                  <button
                    key={preset.label}
                    type="button"
                    className={`filter-preset-btn${active ? " active" : ""}`}
                    onClick={() => {
                      setStartDate(preset.start());
                      setEndDate(preset.end());
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="form-grid">
              <TextField label="Select Start Date" type="date" value={startDate} onChange={setStartDate} />
              <TextField label="Select End Date" type="date" value={endDate} onChange={setEndDate} />
              <SelectField label="Report Type" value={reportType} options={data.reportTypes} onChange={setReportType} />
              <SelectField label="Activity" value={activity} options={data.activities} onChange={setActivity} />
            </div>
          </div>
        </div>
      </Card>

      <div className="stat-grid">
        {SERIES.map((s) => (
          <StatTile key={s.key} label={s.label} value={data.totals[s.key] ?? 0} colorVar={s.colorVar} />
        ))}
      </div>

      <h3 className="section-label">Conversion Rates</h3>
      <div className="stat-grid stat-grid-secondary">
        {RATE_TILES.map((r) => (
          <StatTile key={r.label} label={r.label} value={pct(data.totals[r.from] ?? 0, data.totals[r.of] ?? 0)} colorVar={r.colorVar} />
        ))}
      </div>

      <Card>
        <div className="card-header">
          <div>
            <h2>Top Performers</h2>
            {data.series.length > 0 ? <p className="card-subtitle">{`Ranked by Out-Reaches · ${reportLabel}`}</p> : null}
          </div>
        </div>
        <div className="leaderboard">
          {data.series.length === 0 ? (
            <EmptyState title="No activity yet" hint="Try adjusting the date range or filters." />
          ) : (
            <>
              {top.map((row, i) => {
                const rank = i + 1;
                return (
                  <div key={row.name} className="leaderboard-row">
                    <span className={`leaderboard-rank${rank <= 3 ? ` rank-${rank}` : ""}`}>{String(rank)}</span>
                    <div className="leaderboard-main">
                      <div className="leaderboard-top">
                        <span className="leaderboard-name">{row.name}</span>
                        <span className="leaderboard-value">{formatNumber(row.outReach)}</span>
                      </div>
                      <div className="leaderboard-bar-track">
                        <div
                          className="leaderboard-bar-fill"
                          style={{ width: `${Math.max(4, (row.outReach / max) * 100)}%` }}
                        />
                      </div>
                      <div className="leaderboard-meta">
                        {`Connected ${formatNumber(row.connected)} · Completed ${formatNumber(row.completed)} · Closed ${formatNumber(row.closed)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
              {sortedSeries.length > top.length ? (
                <p className="leaderboard-more">{`+${sortedSeries.length - top.length} more — see full table below`}</p>
              ) : null}
            </>
          )}
        </div>
      </Card>

      <Card>
        <div className="card-header">
          <h2>All Records</h2>
        </div>
        <DataTable
          columns={tableColumns}
          rows={data.series}
          exportFileName="dashboard-details"
          emptyTitle="No records found"
          emptyHint="Try adjusting the date range or filters."
        />
      </Card>
    </>
  );
}
