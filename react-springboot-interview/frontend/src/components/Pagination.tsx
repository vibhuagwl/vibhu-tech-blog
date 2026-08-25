export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const safeTotal = Math.max(1, totalPages)

  return (
    <div className="pagination">
      <button
        type="button"
        className="btn btn-secondary"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span className="muted">
        Page {page + 1} of {safeTotal}
      </span>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={page + 1 >= safeTotal}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  )
}
