'use client';

// Shared markers so every wizard step signals required vs optional fields the
// same way: a red asterisk for mandatory, a muted "(optional)" tag otherwise.

export function RequiredMark() {
  return (
    <span className="text-error-icon" aria-hidden="true">
      {' '}
      *
    </span>
  );
}

export function OptionalTag() {
  return <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>;
}
