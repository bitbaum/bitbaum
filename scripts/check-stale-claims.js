#!/usr/bin/env node

/**
 * Check for stale/forbidden claims in documentation files
 * 
 * Fails if any of these forbidden claims are found:
 * - "product studio" as the organizational definition
 * - "incorporation pending" or "bitbaum AG"
 * - GitHub Pages (bitbaum.github.io) mentioned as a host
 * - Founder's legal name (redacted for security)
 * 
 * Run: node scripts/check-stale-claims.js
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Forbidden patterns with descriptions
const FORBIDDEN_PATTERNS = [
  {
    pattern: /\bAI[- ]first product studio\b/gi,
    description: '"AI-first product studio" as organizational definition',
    explanation: 'Use "organization ventures sit under" or similar; each venture is its own project'
  },
  {
    pattern: /\bproduct studio\b(?! that)/gi,
    description: '"product studio" as definition (unless part of longer phrase)',
    explanation: 'Describe the actual structure, not a borrowed category'
  },
  {
    pattern: /\bincorporation pending\b/gi,
    description: '"incorporation pending"',
    explanation: 'Legal status is "unregistered" (see state/org.json)'
  },
  {
    pattern: /\bbitbaum AG\b/gi,
    description: '"bitbaum AG"',
    explanation: 'No AG exists; legal status is "unregistered" (see state/org.json)'
  },
  {
    pattern: /bitbaum\.github\.io/gi,
    description: 'GitHub Pages URL (bitbaum.github.io)',
    explanation: 'GitHub Pages is not a host; hosting is Hetzner (see state/org.json)'
  },
  {
    pattern: /https?:\/\/bitbaum\.github\.io/gi,
    description: 'GitHub Pages link',
    explanation: 'Do not link to GitHub Pages; it is not a host'
  }
];

// Files to check
const FILES_TO_CHECK = [
  'README.md',
  'CLAUDE.md',
  'projects/*.md'
];

async function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations = [];

  FORBIDDEN_PATTERNS.forEach(({ pattern, description, explanation }) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      violations.push({
        file: filePath,
        line: lineNumber,
        description,
        explanation,
        match: match[0]
      });
    }
  });

  return violations;
}

async function main() {
  console.log('Checking for stale claims in documentation...\n');

  let allViolations = [];

  for (const pattern of FILES_TO_CHECK) {
    const files = await glob(pattern, { cwd: process.cwd() });
    
    for (const file of files) {
      const violations = await checkFile(file);
      allViolations = allViolations.concat(violations);
    }
  }

  if (allViolations.length === 0) {
    console.log('✅ No stale claims found.\n');
    process.exit(0);
  }

  console.error('❌ Found stale claims:\n');
  
  allViolations.forEach((violation, index) => {
    console.error(`${index + 1}. ${violation.file}:${violation.line}`);
    console.error(`   Forbidden: ${violation.description}`);
    console.error(`   Found: "${violation.match}"`);
    console.error(`   Fix: ${violation.explanation}\n`);
  });

  console.error(`Total violations: ${allViolations.length}\n`);
  process.exit(1);
}

main().catch(error => {
  console.error('Error running check:', error);
  process.exit(1);
});
