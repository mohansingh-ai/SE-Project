import React from 'react';

/**
 * Renders a coloured progress bar for a match score (0–100).
 * Colour thresholds:
 *   ≥ 80 → green (great match)
 *   ≥ 60 → yellow/amber (decent match)
 *   < 60 → red (poor match)
 */
export default function MatchScoreBar({ score, showLabel = true }) {
  const pct = Math.min(100, Math.max(0, score || 0));

  let color, label;
  if (pct >= 80) { color = 'var(--success)'; label = 'Excellent'; }
  else if (pct >= 60) { color = 'var(--warning)'; label = 'Good'; }
  else if (pct >= 40) { color = '#f97316'; label = 'Fair'; }
  else { color = 'var(--danger)'; label = 'Low'; }

  return (
    <div className="score-bar-wrap">
      {showLabel && (
        <div className="score-bar-header">
          <span className="score-bar-label">Match Score — {label}</span>
          <span className="score-bar-value" style={{ color }}>{pct}%</span>
        </div>
      )}
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
