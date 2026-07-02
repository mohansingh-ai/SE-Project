import React, { useState } from 'react';

/** Controlled tag-input for entering a list of skills */
export default function TagInput({ tags = [], onChange, placeholder = 'Type a skill and press Enter…' }) {
  const [input, setInput] = useState('');

  function addTag(value) {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  }

  function removeTag(tag) {
    onChange(tags.filter(t => t !== tag));
  }

  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="tag-input-wrap" onClick={() => document.getElementById('tag-input-field').focus()}>
      {tags.map(tag => (
        <span key={tag} className="tag-chip">
          {tag}
          <button type="button" onClick={() => removeTag(tag)}>×</button>
        </span>
      ))}
      <input
        id="tag-input-field"
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => addTag(input)}
        placeholder={tags.length === 0 ? placeholder : ''}
      />
    </div>
  );
}
