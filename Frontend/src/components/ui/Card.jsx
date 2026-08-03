export function Card({ children }) {
  return <div className="card">{children}</div>;
}

export function CardHeader({ title, actions = [] }) {
  return (
    <div className="card-header">
      <h2>
        <span className="card-header-accent" />
        {title}
      </h2>
      {actions.length > 0 ? <div className="card-actions">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ children }) {
  return <div className="card-body">{children}</div>;
}
