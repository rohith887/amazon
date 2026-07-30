import { el } from "../dom.js";

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Minimal dependency-free multi-series line chart (SVG), following the data-viz
// method: thin 2px lines, rounded data-ends, legend + hover tooltip, recessive
// grid/axes, and text kept in ink tokens rather than series colors.
export function lineChart({ data, series, width = 900, height = 380, padding = { top: 16, right: 20, bottom: 44, left: 44 } }) {
  const wrapper = el("div", { style: { position: "relative", width: "100%" } });

  if (!data.length) {
    return el("div", { style: { height: `${height}px`, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--chart-muted)", fontSize: "13px" } }, [
      "No data available for the selected filters.",
    ]);
  }

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxY = Math.max(1, ...data.flatMap((d) => series.map((s) => d[s.key] ?? 0)));
  const yTicks = 5;

  const xStep = data.length > 1 ? innerWidth / (data.length - 1) : 0;
  const xFor = (i) => padding.left + i * xStep;
  const yFor = (v) => padding.top + innerHeight - (v / maxY) * innerHeight;

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height,
    style: { display: "block", background: "var(--chart-surface)", borderRadius: "8px" },
  });

  // Gridlines + y-axis labels
  for (let i = 0; i <= yTicks; i++) {
    const value = Math.round((maxY / yTicks) * i);
    const y = yFor(value);
    svg.append(
      el("line", { x1: padding.left, x2: width - padding.right, y1: y, y2: y, stroke: "var(--chart-grid)", "stroke-width": "1" }),
      el("text", { x: padding.left - 8, y: y + 4, "text-anchor": "end", "font-size": "11", fill: "var(--chart-muted)" }, [String(value)]),
    );
  }

  // X-axis labels (skip some if crowded)
  const labelEvery = Math.ceil(data.length / 10) || 1;
  data.forEach((d, i) => {
    if (i % labelEvery !== 0 && i !== data.length - 1) return;
    svg.append(
      el(
        "text",
        {
          x: xFor(i),
          y: height - padding.bottom + 20,
          "text-anchor": "middle",
          "font-size": "11",
          fill: "var(--chart-muted)",
        },
        [d.name.length > 12 ? `${d.name.slice(0, 11)}…` : d.name],
      ),
    );
  });

  // Series lines + dots
  const seriesGroups = [];
  for (const s of series) {
    const color = cssVar(s.colorVar);
    const points = data.map((d, i) => [xFor(i), yFor(d[s.key] ?? 0)]);
    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");

    const path = el("path", {
      d: pathD,
      fill: "none",
      stroke: color,
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });
    const dots = points.map(([x, y]) => el("circle", { cx: x, cy: y, r: "3", fill: color }));
    svg.append(path, ...dots);
    seriesGroups.push({ ...s, color, points });
  }

  // Hover crosshair + tooltip
  const crosshair = el("line", { y1: padding.top, y2: height - padding.bottom, stroke: "var(--chart-axis)", "stroke-width": "1", style: { display: "none" } });
  svg.append(crosshair);

  const tooltip = el("div", {
    style: {
      position: "absolute",
      pointerEvents: "none",
      background: "#fff",
      border: "1px solid var(--chart-grid)",
      borderRadius: "8px",
      padding: "8px 10px",
      fontSize: "12px",
      boxShadow: "var(--shadow-popover)",
      display: "none",
      zIndex: "10",
      minWidth: "140px",
    },
  });

  const hitLayer = el("rect", {
    x: padding.left,
    y: padding.top,
    width: innerWidth,
    height: innerHeight,
    fill: "transparent",
    onMousemove: (e) => {
      const rect = svg.getBoundingClientRect();
      const scaleX = width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      let index = Math.round((mouseX - padding.left) / (xStep || 1));
      index = Math.max(0, Math.min(data.length - 1, index));

      crosshair.setAttribute("x1", xFor(index));
      crosshair.setAttribute("x2", xFor(index));
      crosshair.style.display = "block";

      const d = data[index];
      tooltip.innerHTML = "";
      tooltip.append(el("div", { style: { fontWeight: "600", marginBottom: "4px", color: "var(--ink-900)" } }, [d.name]));
      for (const s of seriesGroups) {
        tooltip.append(
          el("div", { style: { display: "flex", alignItems: "center", gap: "6px", color: "var(--ink-700)" } }, [
            el("span", { style: { width: "8px", height: "8px", borderRadius: "50%", background: s.color, display: "inline-block" } }),
            `${s.label}: ${d[s.key] ?? 0}`,
          ]),
        );
      }
      tooltip.style.display = "block";
      tooltip.style.left = `${Math.min(rect.width - 160, Math.max(0, (xFor(index) / width) * rect.width + 12))}px`;
      tooltip.style.top = "8px";
    },
    onMouseleave: () => {
      crosshair.style.display = "none";
      tooltip.style.display = "none";
    },
  });
  svg.append(hitLayer);

  const legend = el(
    "div",
    { style: { display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center", marginTop: "8px", fontSize: "13px" } },
    series.map((s) =>
      el("span", { style: { display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--chart-text-secondary)" } }, [
        el("span", { style: { width: "10px", height: "10px", borderRadius: "50%", background: cssVar(s.colorVar), display: "inline-block" } }),
        s.label,
      ]),
    ),
  );

  wrapper.append(svg, tooltip, legend);
  return wrapper;
}
