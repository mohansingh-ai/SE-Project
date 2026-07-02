import React from 'react';

/** A pill-shaped skill badge. Variant: 'matched' | 'missing' | 'default' */
export default function SkillBadge({ skill, variant = 'default' }) {
  const cls =
    variant === 'matched' ? 'badge badge-success'
    : variant === 'missing' ? 'badge badge-danger'
    : 'badge badge-accent';

  const icon =
    variant === 'matched' ? '✓ '
    : variant === 'missing' ? '✕ '
    : '';

  return <span className={cls}>{icon}{skill}</span>;
}
