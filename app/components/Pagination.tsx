"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  compact?: boolean;
  className?: string;
}

function buildPageRange(currentPage: number, totalPages: number) {
  const range: Array<number | '...'> = [];
  const delta = 2;
  const left = Math.max(1, currentPage - delta);
  const right = Math.min(totalPages, currentPage + delta);

  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      range.push(i);
    } else if (range[range.length - 1] !== '...') {
      range.push('...');
    }
  }

  return range;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  compact = false,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pageRange = buildPageRange(currentPage, totalPages);

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p className="text-sm text-slate-600">Page {currentPage} of {totalPages}</p>
      <div className="inline-flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        {!compact && pageRange.map((page, index) => (
          <button
            key={`${page}-${index}`}
            type="button"
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...' || page === currentPage}
            className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
              page === currentPage
                ? 'border-emerald-900 bg-emerald-900 text-white'
                : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
            } ${page === '...' ? 'cursor-default border-transparent bg-transparent text-slate-400 hover:bg-transparent' : ''}`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
