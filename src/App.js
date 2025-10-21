import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import { generateButton } from './Api';
import './index.css';
import './App.css';

const STYLE_OPTIONS = ['', 'modern', 'minimal', 'cute'];

// Clamp & normalize user-entered text for the request payload only
function clampLabel(t) {
  return String(t || '')
    .normalize('NFKC')
    .replace(/[\n\r\t]/g, ' ');
}

export default function App() {
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [text, setText] = useState('Click me');
  const [styleVariant, setStyleVariant] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const stageRef = useRef(null);

  // Accessible ids
  const colorId = useId();
  const sizeId = useId();
  const textId = useId();
  const styleId = useId();

  const styleLocked = Boolean(styleVariant);

  // Build payload for the API (client stays dumb; server validates)
  const payload = useMemo(() => {
    const p = {
      text: clampLabel(text),
      styleVariant: styleVariant || null,
    };
    if (!styleLocked) {
      p.color = color || null;
      p.size = size || null;
    } else {
      p.color = null;
      p.size = null;
    }
    return p;
  }, [color, size, text, styleVariant, styleLocked]);

  // Safely render the returned HTML by reconstructing a fresh <button>
  const renderPreview = useCallback((html, exactText) => {
    if (!stageRef.current) return;
    stageRef.current.innerHTML = '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const btn = doc.body.querySelector('button');
    if (!btn) throw new Error('Response lacked a <button>');

    const safe = document.createElement('button');
    safe.type = 'button';
    safe.textContent = exactText;

    const style = btn.getAttribute('style');
    if (style) safe.setAttribute('style', style);

    for (const { name, value } of Array.from(btn.attributes)) {
      if (name.toLowerCase().startsWith('data-')) safe.setAttribute(name, value);
    }

    stageRef.current.appendChild(safe);
    const isEmpty = !exactText || !String(exactText).trim();

    if (isEmpty) {
      // Use important to beat any global !important resets
      safe.style.setProperty('border', '1px solid rgba(255,255,255,1)', 'important'); // visible on dark bg
      safe.style.setProperty('border-radius', '8px', 'important');
      safe.style.setProperty('min-width', '5px', 'important');
      safe.style.setProperty('min-height', '10px', 'important');

      // If background is transparent AND your preview is dark, give it a faint bg
      const bg = getComputedStyle(safe).backgroundColor;
      const border = getComputedStyle(safe).borderTopWidth;
      const hasBg = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
      const hasBorder = border && parseFloat(border) > 0;
      if (!hasBg && !hasBorder) {
        safe.style.setProperty('background-color', 'rgba(255,255,255,0.06)', 'important');
      }
    }
    // Last-resort: if it still collapses, enforce visibility without adding text
    const rect = safe.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) {
      const current = safe.getAttribute('style') || '';
      const extras = ['padding: 10px 16px', 'border: 1px solid #ccc'];
      const merged = [current, extras.join('; ')].filter(Boolean).join('; ');
      safe.setAttribute('style', merged);
    }
  }, []);


  const onGenerate = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading) return; // guard
      setError(null);
      setLoading(true);

      try {
        const resp = await generateButton(payload);
        if (!resp?.ok) throw new Error(resp?.error || 'Unknown error');
        renderPreview(resp.html, payload.text);
      } catch (err) {
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    },
    [loading, payload, renderPreview]
  );

  const onBlurTrim = (setter) => (e) => setter(String(e.target.value || '').trim());

  // Prevent invalid style strings from the user by forcing to known options
  useEffect(() => {
    if (styleVariant && !STYLE_OPTIONS.includes(styleVariant)) setStyleVariant('');
  }, [styleVariant]);

  return (
    <div className="wrap">
      <header className="header">
        <h1>Buttons Generator</h1>
        <p className="sub">AI assisted, spec-driven HTML button</p>
      </header>

      <main className="grid">
        <form className="card" onSubmit={onGenerate} noValidate>
          <div className="row">
            <label className="field" htmlFor={colorId}>
              <div className="field-head">
                <span className="label">Color</span>
                {styleLocked ? <span className="help">Disabled when Style is used</span> : null}
              </div>
              <input
                id={colorId}
                className="input"
                placeholder="e.g. #E51BFC or very dark"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                onBlur={onBlurTrim(setColor)}
                disabled={styleLocked || loading}
                autoComplete="off"
                inputMode="text"
              />
            </label>

            <label className="field" htmlFor={sizeId}>
              <div className="field-head">
                <span className="label">Size</span>
                {styleLocked ? <span className="help">Disabled when Style is used</span> : null}
              </div>
              <input
                id={sizeId}
                className="input"
                placeholder="e.g. small, super huge, 18px"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                onBlur={onBlurTrim(setSize)}
                disabled={styleLocked || loading}
                autoComplete="off"
                inputMode="text"
              />
            </label>
          </div>

          <label className="field" htmlFor={textId}>
            <div className="field-head">
              <span className="label">Text</span>
              <span className="help">rendered exactly as typed</span>
            </div>
            <input
              id={textId}
              className="input"
              placeholder="Exact button label"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={onBlurTrim(setText)}
              disabled={loading}
              autoComplete="off"
              inputMode="text"
            />
          </label>

          <label className="field" htmlFor={styleId}>
            <div className="field-head">
              <span className="label">Style (bonus)</span>
              <span className="help">modern | minimal | cute</span>
            </div>
            {/* Use a select to avoid invalid strings */}
            <select
              id={styleId}
              className="input"
              value={styleVariant}
              onChange={(e) => setStyleVariant(e.target.value)}
              disabled={loading}
            >
              {STYLE_OPTIONS.map((opt) => (
                <option key={opt || 'none'} value={opt}>
                  {opt ? opt : '— none —'}
                </option>
              ))}
            </select>
          </label>

          <div className="actions">
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Generating…' : 'Generate'}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={loading}
              onClick={() => {
                setColor('');
                setSize('');
                setStyleVariant('');
                setError(null);
                if (stageRef.current) stageRef.current.innerHTML = '';
              }}
              style={{ marginLeft: 8 }}
            >
              Reset
            </button>
          </div>

          {/* Status area for screen readers */}
          <div aria-live="polite" aria-atomic="true">
            {error && <div className="error">{error}</div>}
          </div>
        </form>

        <section className="card preview">
          <h2>Preview</h2>
          <div className="preview-stage" ref={stageRef} />
        </section>
      </main>

      <footer className="footer">
        <span>API: {process.env.REACT_APP_API_BASE || 'http://localhost:8787'}</span>
      </footer>
    </div>
  );
}
