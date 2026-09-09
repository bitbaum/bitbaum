#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const companiesData = JSON.parse(readFileSync(join(__dirname, 'companies.json'), 'utf-8'));
const ventures = companiesData.companies;

const venturesHTML = ventures.map(venture => {
  const urlAttr = venture.url ? ` data-url="${venture.url}"` : '';
  const hasUrl = venture.url ? ' has-url' : '';
  const urlDisplay = venture.url ? venture.url.replace(/^https?:\/\//, '') : '';
  
  return `      <li class="venture${hasUrl}"${urlAttr}>
        <h2 class="venture-name">${venture.name}</h2>
        <div class="venture-details">
          <p class="venture-tagline">${venture.tagline}</p>
          ${venture.url ? `<p class="venture-url">${urlDisplay}</p>` : ''}
        </div>
      </li>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>bitbaum</title>
  <meta name="description" content="bitbaum. The work, each its own.">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      height: 100%;
      overflow-x: hidden;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: #0a0a0a;
      color: #e8e8e8;
      line-height: 1;
    }

    .container {
      min-height: 100vh;
      padding: 3rem 3rem 5rem;
      display: flex;
      flex-direction: column;
    }

    header {
      margin-bottom: clamp(4rem, 8vh, 6rem);
    }

    .wordmark {
      font-size: 1.125rem;
      font-weight: 400;
      letter-spacing: 0.05em;
      margin-bottom: 3rem;
      opacity: 0.6;
    }

    .statement {
      font-size: clamp(2.5rem, 7vw, 6rem);
      font-weight: 300;
      letter-spacing: -0.04em;
      line-height: 1;
      max-width: 30ch;
    }

    main {
      flex: 1;
    }

    .ventures {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .venture {
      border-top: 1px solid #1a1a1a;
      padding: clamp(1.5rem, 3vh, 2.5rem) 0;
      cursor: default;
      transition: border-color 0.5s ease;
    }

    .venture.has-url {
      cursor: pointer;
    }

    .venture:hover {
      border-top-color: #2a2a2a;
    }

    .venture-name {
      font-size: clamp(2rem, 5vw, 4.5rem);
      font-weight: 300;
      letter-spacing: -0.03em;
      line-height: 1.1;
      transition: color 0.3s ease;
    }

    .venture.has-url:hover .venture-name {
      color: #a8a8a8;
    }

    .venture-details {
      margin-top: 0.75rem;
      opacity: 0;
      transform: translateY(-8px);
      transition: opacity 0.4s ease, transform 0.4s ease;
    }

    .venture:hover .venture-details,
    .venture:focus-within .venture-details {
      opacity: 1;
      transform: translateY(0);
    }

    .venture-tagline {
      font-size: clamp(1rem, 2vw, 1.375rem);
      font-weight: 300;
      color: #6b6b6b;
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }

    .venture-url {
      font-size: 1rem;
      font-weight: 300;
      color: #6b6b6b;
      font-variant-numeric: tabular-nums;
    }

    footer {
      margin-top: 5rem;
      padding-top: 2rem;
      border-top: 1px solid #1a1a1a;
      font-size: 0.9375rem;
      font-weight: 300;
      color: #6b6b6b;
    }

    footer p {
      margin-bottom: 0.5rem;
    }

    .registration-note {
      font-size: 0.875rem;
      opacity: 0.7;
    }

    .registration-note a {
      color: #6b6b6b;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.3s ease;
    }

    .registration-note a:hover {
      border-bottom-color: #6b6b6b;
    }

    @media (max-width: 768px) {
      .container {
        padding: 2rem 1.5rem 3rem;
      }

      .wordmark {
        margin-bottom: 2rem;
      }

      .statement {
        max-width: none;
      }

      .venture-details {
        opacity: 1;
        transform: translateY(0);
        margin-top: 1rem;
      }
    }

    @media (hover: none) {
      .venture-details {
        opacity: 1;
        transform: translateY(0);
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="wordmark">bitbaum</div>
      <h1 class="statement">The work, each its own.</h1>
    </header>

    <main>
      <ul class="ventures">
${venturesHTML}
      </ul>
    </main>

    <footer>
      <p>Cato, Zürich</p>
      <p class="registration-note">Registration lives in <a href="https://solon.orangecat.ch">Solon</a>. None of this is registered yet.</p>
    </footer>
  </div>

  <script>
    document.querySelectorAll('.venture.has-url').forEach(venture => {
      const url = venture.dataset.url;
      if (url) {
        venture.addEventListener('click', () => {
          window.location.href = url;
        });
      }
    });
  </script>
</body>
</html>
`;

writeFileSync(join(__dirname, 'index.html'), html, 'utf-8');
console.log('Generated index.html with', ventures.length, 'ventures');
