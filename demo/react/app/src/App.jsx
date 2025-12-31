import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NCarousel } from 'n-carousel-react';
import 'n-carousel/n-carousel.js';
import 'n-carousel-react/styles';
import 'n-carousel/demo/demo.scss';
import 'n-carousel/demo/prism.scss';

function rewriteDemoAssetPath(value) {
  if (!value) return value;
  // Root demo uses `demo/...` relative to `/index.html`.
  // React demo lives at `/demo/react/`, so rewrite to `../...` (i.e. `/demo/...`).
  return value.replace(/^\.?\/?demo\//, '../');
}

function rewriteSrcset(value) {
  if (!value) return value;
  return value
    .split(',')
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return trimmed;
      const [url, ...rest] = trimmed.split(/\s+/);
      return [rewriteDemoAssetPath(url), ...rest].join(' ');
    })
    .join(', ');
}

function rewriteInlineStyle(value) {
  if (!value) return value;
  // Custom properties like `--placeholder: url(demo/...)` are parsed only when used in CSS.
  // The URL base becomes the *stylesheet* URL (our built CSS lives at `/demo/react/assets/...`),
  // not the document URL. So we rewrite to reach `/demo/<file>` from `/demo/react/assets/`.
  // `/demo/react/assets/` -> `/demo/` is `../../`.
  return value.replace(/url\((['"]?)\.?\/?demo\/([^'")]+)/g, 'url($1../../$2');
}

let prismLoaded = false;
function loadPrismOnce() {
  if (typeof window === 'undefined') return;
  if (prismLoaded) return;
  if (document.querySelector('script[data-ncarousel-prism]')) {
    prismLoaded = true;
    return;
  }
  const script = document.createElement('script');
  script.dataset.ncarouselPrism = 'true';
  // `/demo/react/` -> `/demo/prism.js`
  script.src = '../prism.js';
  script.defer = true;
  document.head.appendChild(script);
  prismLoaded = true;
}

let demoOptionsWired = false;
function wireDemoOptionsOnce() {
  if (typeof window === 'undefined') return;
  if (demoOptionsWired) return;
  demoOptionsWired = true;

  document.addEventListener('change', (e) => {
    const input = e.target;
    if (!input || input.tagName !== 'INPUT') return;
    if (!input.closest('.n-carousel__options')) return;
    const cls = input.dataset?.class;
    if (!cls) return;

    const options = input.closest('.n-carousel__options');

    // Find the carousel associated with this options block.
    let carousel = null;
    let prev = options?.previousElementSibling;
    while (prev && !carousel) {
      if (prev.classList && prev.classList.contains('n-carousel')) carousel = prev;
      prev = prev.previousElementSibling;
    }
    if (!carousel) {
      const host = options?.parentElement;
      carousel =
        host?.querySelector?.(':scope > .n-carousel') ||
        host?.querySelector?.('.n-carousel') ||
        null;
    }
    if (!carousel) return;

    // Update the class attribute snippet shown in the docs (best-effort).
    let snippetNode = null;
    try {
      const codeNodes =
        carousel.parentNode?.parentNode?.querySelectorAll?.('code .attr-value') || [];
      for (const el of codeNodes) {
        const hasNCarousel = el.childNodes?.[2]?.textContent?.match?.(/n-carousel/);
        const isClassAttr = el.previousElementSibling?.textContent?.match?.(/class/);
        if (hasNCarousel && isClassAttr) {
          snippetNode = el.childNodes[2];
          break;
        }
      }
    } catch {
      // ignore
    }

    if (input.checked) {
      carousel.classList.add(cls);
      if (snippetNode) snippetNode.textContent += ` ${cls}`;
    } else {
      carousel.classList.remove(cls);
      if (snippetNode) snippetNode.textContent = snippetNode.textContent.replace(` ${cls}`, '').trim();
    }

    const content = carousel.querySelector(':scope > .n-carousel__content');
    if (!content) return;

    // Auto-slide toggle (mirrors index.html demo script).
    if (cls === 'n-carousel--auto-slide') {
      if (input.checked) {
        const default_interval = 4000;
        const default_duration = 500;
        const auto_delay =
          (parseFloat(carousel.dataset.interval) * 1000 || default_interval) +
          (parseFloat(carousel.dataset.duration) * 1000 || default_duration);

        const isElementInViewport = (el) => {
          const rect = el.getBoundingClientRect();
          return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.offsetHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.offsetWidth)
          );
        };

        const carouselTimeout = () => {
          if (isElementInViewport(content)) {
            const nextBtn = carousel.querySelector('.n-carousel__next button');
            if (nextBtn) nextBtn.click();
          }
          content.nCarouselTimeout = setTimeout(carouselTimeout, auto_delay);
        };

        if (content.nCarouselTimeout) clearTimeout(content.nCarouselTimeout);
        content.nCarouselTimeout = setTimeout(
          carouselTimeout,
          parseFloat(carousel.dataset.interval) * 1000 || default_interval
        );

        if (!content._autoSlidePointerEnter) {
          content._autoSlidePointerEnter = (evt) => {
            if (evt.target?.nCarouselTimeout) clearTimeout(evt.target.nCarouselTimeout);
          };
          content.addEventListener('pointerenter', content._autoSlidePointerEnter);
        }
      } else {
        if (content.nCarouselTimeout) {
          clearTimeout(content.nCarouselTimeout);
          content.nCarouselTimeout = null;
        }
        if (content._autoSlidePointerEnter) {
          content.removeEventListener('pointerenter', content._autoSlidePointerEnter);
          content._autoSlidePointerEnter = null;
        }
        if (content._autoSlidePointerLeave) {
          content.removeEventListener('pointerleave', content._autoSlidePointerLeave);
          content._autoSlidePointerLeave = null;
        }
      }
    }

    if (typeof content.nCarouselUpdate === 'function') {
      content.nCarouselUpdate(content);
    } else if (typeof window.nCarouselInit === 'function') {
      window.nCarouselInit(document);
    }
  });
}

function MiniReactDemo() {
  const [count, setCount] = useState(4);

  const slides = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: `react-slide-${i + 1}`,
      label: `React slide ${i + 1}`,
    }));
  }, [count]);

  return (
    <div style={{ margin: '1.25rem 0 2rem', textAlign: 'start' }}>
      <h2 style={{ margin: '0 0 0.5rem' }}>React mini demo (dynamic slides)</h2>
      <p style={{ maxWidth: '70ch', marginTop: 0 }}>
        This is the original React demo: it re-renders slide markup and calls <code>nCarouselInit</code>{' '}
        on updates via the thin <code>NCarousel</code> wrapper.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '12px 0 16px' }}>
        <button type="button" onClick={() => setCount((c) => Math.max(3, c - 1))}>
          Remove slide
        </button>
        <button type="button" onClick={() => setCount((c) => c + 1)}>
          Add slide
        </button>
        <span style={{ opacity: 0.85 }}>Slides: {count}</span>
      </div>

      <NCarousel
        className="n-carousel n-carousel--peek"
        deps={[count]}
        style={{
          // Ensure the mini demo stays readable in fullscreen regardless of the page background.
          backgroundColor: '#0b1220',
          color: '#e9f2ff',
          '--nui-carousel-bg': '#0b1220',
          '--nui-carousel-color': '#e9f2ff',
          '--nui-control-bg': 'rgba(255,255,255,0.12)',
          '--nui-control-color': '#e9f2ff',
          '--nui-control-active-bg': '#2dd4bf',
          '--nui-control-active-color': '#062a2a',
          '--nui-control-highlight': '#38bdf8',
          '--nui-border-radius': '0.5em',
        }}
      >
        <ul className="n-carousel__content" style={{ '--peek': '40px' }}>
          {slides.map((s) => (
            <li
              key={s.id}
              id={s.id}
              style={{
                padding: 24,
                backgroundColor: '#0b1220',
                color: '#e9f2ff',
              }}
            >
              <h3 style={{ margin: 0 }}>{s.label}</h3>
              <p style={{ marginBottom: 0 }}>
                Add/remove slides above. Index buttons and fullscreen should stay correct.
              </p>
            </li>
          ))}
        </ul>

        <div className="n-carousel__previous">
          <button type="button">
            <span>Previous</span>
          </button>
        </div>
        <div className="n-carousel__next">
          <button type="button">
            <span>Next</span>
          </button>
        </div>
        <div className="n-carousel__index">
          {slides.map((s, i) => (
            <button key={s.id} type="button" aria-label={`Go to ${s.label}`}>
              <span>{i + 1}</span>
            </button>
          ))}
        </div>
        <div className="n-carousel__full-screen">
          <button type="button">
            <span>Toggle full screen</span>
          </button>
        </div>
      </NCarousel>
    </div>
  );
}

function prepareDemoFromIndex(htmlText, indexUrl) {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
  const demoBody = doc.body;
  if (!demoBody) throw new Error('Could not parse <body> from index.html');

  // Defensive: avoid executing any embedded scripts.
  demoBody.querySelectorAll('script').forEach((s) => s.remove());

  // Insert a mount point into the Home section so we can render the React mini demo there.
  const homeSection =
    demoBody.querySelector(':scope > .n-carousel__content > section') ||
    demoBody.querySelector('.n-carousel__content > section');
  if (homeSection && !homeSection.querySelector('#react-mini-demo')) {
    const mount = doc.createElement('div');
    mount.id = 'react-mini-demo';
    mount.dataset.reactMiniDemo = 'true';
    // Place it after the intro paragraph if possible, otherwise prepend.
    const introP = homeSection.querySelector('p');
    if (introP && introP.parentNode === homeSection) {
      introP.insertAdjacentElement('afterend', mount);
    } else {
      homeSection.insertAdjacentElement('afterbegin', mount);
    }
  }

  // Fix asset paths (`demo/...` -> `../...`) so images/videos resolve.
  demoBody.querySelectorAll('[src],[href],[srcset],[poster],[style]').forEach((el) => {
    if (el.hasAttribute('src')) el.setAttribute('src', rewriteDemoAssetPath(el.getAttribute('src')));
    if (el.hasAttribute('href')) el.setAttribute('href', rewriteDemoAssetPath(el.getAttribute('href')));
    if (el.hasAttribute('poster')) el.setAttribute('poster', rewriteDemoAssetPath(el.getAttribute('poster')));
    if (el.hasAttribute('srcset')) el.setAttribute('srcset', rewriteSrcset(el.getAttribute('srcset')));
    if (el.hasAttribute('style')) el.setAttribute('style', rewriteInlineStyle(el.getAttribute('style')));
  });

  // Copy body class + children HTML; we will apply the class to the current document.body.
  return { cls: demoBody.className || '', html: demoBody.innerHTML || '', indexUrl };
}

function injectBodyDemo({ cls, html }) {
  // Remove previously injected nodes
  const old = document.querySelectorAll('[data-react-injected="true"]');
  old.forEach((n) => n.remove());

  document.body.className = cls;

  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  const reactRoot = document.getElementById('react-root');
  [...tmp.childNodes].forEach((node) => {
    // Skip empty text nodes
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
    // Use a separate attribute for cleanup that doesn't clash with content
    if (node.nodeType === Node.ELEMENT_NODE) node.setAttribute('data-react-injected', 'true');
    document.body.insertBefore(node, reactRoot || null);
  });
}

export default function App() {
  const [error, setError] = useState('');
  const [miniMount, setMiniMount] = useState(null);
  const didInitRef = useRef(false);

  const indexUrl = useMemo(() => {
    // `/demo/react/index.html` -> `/index.html`
    const root = new URL('../../', window.location.href);
    return new URL('index.html', root).toString();
  }, []);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    let cancelled = false;

    (async () => {
      const res = await fetch(indexUrl, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Failed to fetch ${indexUrl} (${res.status})`);
      const htmlText = await res.text();
      if (cancelled) return;

      const demo = prepareDemoFromIndex(htmlText, indexUrl);
      injectBodyDemo(demo);

      const init = window.nCarouselInit;
      if (typeof init === 'function') init(document);
      wireDemoOptionsOnce();
      loadPrismOnce();

      // The mount exists inside the injected DOM; pick it up after paint.
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        setMiniMount(document.getElementById('react-mini-demo'));
      });
    })().catch((e) => {
      if (cancelled) return;
      setError(String(e?.message || e));
    });

    return () => {
      cancelled = true;
    };
  }, [indexUrl]);

  return (
    <>
      {error ? (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ marginTop: 0 }}>n-carousel React demo</h1>
          <p style={{ color: 'crimson' }}>{error}</p>
        </div>
      ) : !miniMount ? (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ marginTop: 0 }}>n-carousel React demo</h1>
          <p>
            Loading demo from <code>{indexUrl}</code>…
          </p>
        </div>
      ) : null}

      {miniMount ? createPortal(<MiniReactDemo />, miniMount) : null}
    </>
  );
}


