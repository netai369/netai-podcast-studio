#!/usr/bin/env tsx
/**
 * Real endpoint integration test.
 *
 * Hits the *actual* configured OpenAI-compatible LLM and Supertonic TTS endpoints
 * loaded from .env.local (exactly like the real app).
 *
 * Run with:
 *   npm run test:real
 *
 * This bypasses all Jest mocks and unit-test shims.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

interface Env {
  VITE_LLM_PROVIDER?: string;
  VITE_LLM_URL?: string;
  VITE_LLM_KEY?: string;
  VITE_LLM_MODEL?: string;
  VITE_TTS_PROVIDER?: string;
  VITE_TTS_URL?: string;
  VITE_TTS_KEY?: string;
}

function loadEnvFile(): Env {
  const envPath = join(rootDir, '.env.local');
  const env: Env = {};

  try {
    const content = readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (key.startsWith('VITE_')) {
        (env as any)[key] = value;
      }
    });
  } catch (e) {
    console.warn('Could not read .env.local, using process.env only');
  }

  // Fallback to process.env
  return {
    VITE_LLM_PROVIDER: env.VITE_LLM_PROVIDER || process.env.VITE_LLM_PROVIDER,
    VITE_LLM_URL: env.VITE_LLM_URL || process.env.VITE_LLM_URL,
    VITE_LLM_KEY: env.VITE_LLM_KEY || process.env.VITE_LLM_KEY,
    VITE_LLM_MODEL: env.VITE_LLM_MODEL || process.env.VITE_LLM_MODEL,
    VITE_TTS_PROVIDER: env.VITE_TTS_PROVIDER || process.env.VITE_TTS_PROVIDER,
    VITE_TTS_URL: env.VITE_TTS_URL || process.env.VITE_TTS_URL,
    VITE_TTS_KEY: env.VITE_TTS_KEY || process.env.VITE_TTS_KEY,
  };
}

const env = loadEnvFile();

function normalizeChatUrl(base: string): string {
  const cleaned = base.replace(/\/$/, '');
  if (cleaned.match(/\/chat\/completions\/?$/)) {
    return cleaned;
  }
  return `${cleaned}/v1/chat/completions`;
}

function getTtsVoicesUrl(ttsUrl: string): string {
  const base = ttsUrl.replace(/\/v1\/audio\/speech$/, '').replace(/\/$/, '');
  return `${base}/audio/voices`;
}

async function testLLM() {
  const provider = env.VITE_LLM_PROVIDER || 'openai';
  const url = env.VITE_LLM_URL;
  const key = env.VITE_LLM_KEY;
  const model = env.VITE_LLM_MODEL || 'gpt-4o-mini';

  console.log('\n=== LLM Endpoint Test ===');
  console.log(`Provider: ${provider}`);
  console.log(`URL:      ${url || '(not set)'}`);
  console.log(`Model:    ${model}`);

  if (!url) {
    console.log('✗ SKIPPED: VITE_LLM_URL not set in .env.local');
    return false;
  }

  const chatUrl = normalizeChatUrl(url);
  console.log(`Chat URL: ${chatUrl}`);

  try {
    const res = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with exactly one short sentence: the integration test is working.' }],
        max_tokens: 30,
        temperature: 0,
      }),
    });

    console.log(`Status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.log('✗ LLM call failed');
      console.log('Response:', text.slice(0, 500));
      return false;
    }

    const data: any = await res.json();
    const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '(no content)';
    console.log('✓ LLM responded successfully');
    console.log('Reply:', content.trim().slice(0, 200));
    return true;
  } catch (err: any) {
    console.log('✗ LLM request error:', err.message);
    return false;
  }
}

async function testSupertonicTTS() {
  const provider = env.VITE_TTS_PROVIDER || '';
  const ttsUrl = env.VITE_TTS_URL;

  console.log('\n=== TTS Endpoint Test (Supertonic / OpenAI-compatible) ===');
  console.log(`Provider: ${provider}`);
  console.log(`TTS URL:  ${ttsUrl || '(not set)'}`);

  if (!ttsUrl) {
    console.log('✗ SKIPPED: VITE_TTS_URL not set');
    return false;
  }

  const isSupertonic = provider.includes('supertonic') || provider.includes('custom') || provider.includes('openaudio');

  // 1. Try voices endpoint (most providers that are "Supertonic-like" expose this)
  const voicesUrl = getTtsVoicesUrl(ttsUrl);
  console.log(`Voices URL: ${voicesUrl}`);

  try {
    const voicesRes = await fetch(voicesUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`Voices status: ${voicesRes.status}`);

    if (voicesRes.ok) {
      const voicesData: any = await voicesRes.json().catch(() => ({}));
      const voices = voicesData.voices || voicesData || [];
      console.log(`✓ Voices endpoint responded (${Array.isArray(voices) ? voices.length : 'unknown'} voices)`);
      if (Array.isArray(voices) && voices.length > 0) {
        console.log('Sample voices:', voices.slice(0, 3).map((v: any) => v.name || v.id || v));
      }
    } else {
      console.log('⚠ Voices endpoint returned non-200 (may not be supported by this TTS server)');
    }
  } catch (e: any) {
    console.log('⚠ Could not reach voices endpoint:', e.message);
  }

  // 2. Minimal TTS synthesis request
  // Many "Supertonic" deployments are actually OpenAI-compatible TTS servers.
  // We therefore prefer the standard OpenAI /v1/audio/speech payload.
  // Fall back to the legacy custom format only if the user has an older custom instance.

  const testText = 'Hello from the real endpoint test.';
  let ttsBody: any;
  let ttsHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

  if (isSupertonic) {
    // Prefer OpenAI-compatible format for modern Supertonic instances
    ttsBody = {
      model: env.VITE_TTS_MODEL || 'tts-1',
      input: testText,
      voice: 'default',
      response_format: 'mp3',
    };
    console.log('Using OpenAI-compatible TTS format (preferred for Supertonic)');
  } else {
    ttsBody = {
      model: 'tts-1',
      input: testText,
      voice: 'alloy',
      response_format: 'mp3',
    };
    console.log('Using OpenAI-compatible TTS format');
  }

  try {
    const ttsRes = await fetch(ttsUrl, {
      method: 'POST',
      headers: ttsHeaders,
      body: JSON.stringify(ttsBody),
    });

    console.log(`TTS synthesis status: ${ttsRes.status} ${ttsRes.statusText}`);

    if (ttsRes.ok) {
      const contentType = ttsRes.headers.get('content-type') || '';
      const buf = Buffer.from(await ttsRes.arrayBuffer());
      console.log(`✓ TTS synthesis succeeded (${buf.length} bytes, ${contentType})`);
      return true;
    } else {
      const errText = await ttsRes.text().catch(() => '');
      console.log('✗ TTS synthesis failed');
      console.log('Error body:', errText.slice(0, 400));
      return false;
    }
  } catch (err: any) {
    console.log('✗ TTS request error:', err.message);
    return false;
  }
}

async function main() {
  console.log('=== Real Endpoint Smoke Test ===');
  console.log('Loading config from .env.local + process.env\n');

  const llmOk = await testLLM();
  const ttsOk = await testSupertonicTTS();

  console.log('\n=== Summary ===');
  console.log(`LLM (OpenAI-compatible): ${llmOk ? 'PASS' : 'FAIL / SKIPPED'}`);
  console.log(`TTS (Supertonic/OpenAI-comp): ${ttsOk ? 'PASS' : 'FAIL / SKIPPED'}`);

  if (llmOk && ttsOk) {
    console.log('\n✓ All real endpoint tests passed!');
    process.exit(0);
  } else {
    console.log('\nSome tests did not pass (see details above).');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Fatal error in test script:', e);
  process.exit(1);
});
