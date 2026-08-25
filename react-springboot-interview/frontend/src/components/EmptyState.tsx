export function EmptyState({
  title = 'Nothing here',
  description,
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="state-box state-empty">
      <h3>{title}</h3>
      {description && <p className="muted">{description}</p>}
    </div>
  )
}
