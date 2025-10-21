import React, { useCallback, useMemo, useRef, useState, useId } from 'react';
import { generateButton } from './Api';
import './index.css';
import './App.css';

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
  const [styleVariant, setStyleVariant] = useState(''); // free-text descriptor
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const stageRef = useRef(null);

  // Accessible ids
  const colorId = useId();
  const sizeId = useId();
  const textId = useId();
  const styleId = useId();

  const styleLocked = Boolean(String(styleVariant).trim());

  // Build payload for the API (client stays dumb; server validates)
  const payload = useMemo(() => {
    const p = {
      text: clampLabel(text),
      styleVariant: styleVariant || null, // when present, server ignores color/size
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

    // Hard guarantee for empty labels
    const isEmpty = !exactText || !String(exactText).trim();
    if (isEmpty) {
      safe.style.setProperty('padding', '10px 16px', 'important');
      safe.style.setProperty('border', '1px solid rgba(255,255,255,0.4)', 'important');
      safe.style.setProperty('border-radius', '8px', 'important');
      safe.style.setProperty('min-width', '64px', 'important');
      safe.style.setProperty('min-height', '36px', 'important');

      const bg = getComputedStyle(safe).backgroundColor;
      const border = getComputedStyle(safe).borderTopWidth;
      const hasBg = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
      const hasBorder = border && parseFloat(border) > 0;
      if (!hasBg && !hasBorder) {
        safe.style.setProperty('background-color', 'rgba(255,255,255,0.06)', 'important');
      }
    }

    // Last resort if something still collapses
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
      if (loading) return;
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
              <span className="label">Style (free-text)</span>
              <span className="help">e.g. modern, minimal, cute, glassmorphism</span>
            </div>
            <input
              id={styleId}
              className="input"
              placeholder="Describe a style (optional)"
              value={styleVariant}
              onChange={(e) => setStyleVariant(e.target.value)}
              onBlur={onBlurTrim(setStyleVariant)}
              disabled={loading}
              autoComplete="off"
              inputMode="text"
            />
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
