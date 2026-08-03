export function LegendBar({ items }) {
  return (
    <div className="legend-bar">
      {items.map((item) => (
        <span key={item.abbr}>
          <strong>{item.abbr}: </strong>
          {item.full}
        </span>
      ))}
    </div>
  );
}
