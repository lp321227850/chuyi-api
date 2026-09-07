/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
export type QuickstartClient = 'claude-code' | 'codex' | 'gemini' | 'api'
export type QuickstartLanguage =
  | 'python'
  | 'typescript'
  | 'curl'
  | 'go'
  | 'java'
  | 'rust'

export const QUICKSTART_CLIENTS: QuickstartClient[] = [
  'claude-code',
  'codex',
  'gemini',
  'api',
]

export const QUICKSTART_LANGUAGES: QuickstartLanguage[] = [
  'python',
  'typescript',
  'curl',
  'go',
  'java',
  'rust',
]

export const LANGUAGE_FILENAMES: Record<QuickstartLanguage, string> = {
  python: 'main.py',
  typescript: 'main.ts',
  curl: 'request.sh',
  go: 'main.go',
  java: 'Main.java',
  rust: 'main.rs',
}

export interface SnippetContext {
  baseUrl: string
  model: string
  apiKey: string
}

export function defaultSnippetContext(origin?: string): SnippetContext {
  const resolvedOrigin =
    origin || (typeof window === 'undefined' ? '' : window.location.origin)
  return {
    baseUrl: `${resolvedOrigin}/v1`,
    model: 'gpt-4o-mini',
    apiKey: 'sk-...',
  }
}

export function buildQuickstartSnippet(
  client: QuickstartClient,
  language: QuickstartLanguage,
  context: SnippetContext
): string {
  if (client === 'claude-code') {
    return [
      `export ANTHROPIC_BASE_URL="${context.baseUrl}"`,
      `export ANTHROPIC_AUTH_TOKEN="${context.apiKey}"`,
      '',
      '# Then launch Claude Code as usual.',
    ].join('\n')
  }

  if (client === 'codex') {
    return [
      `export OPENAI_BASE_URL="${context.baseUrl}"`,
      `export OPENAI_API_KEY="${context.apiKey}"`,
      '',
      '# Point Codex at this Base URL, then start a session.',
    ].join('\n')
  }

  if (client === 'gemini') {
    return [
      `export GEMINI_API_KEY="${context.apiKey}"`,
      `export GOOGLE_GEMINI_BASE_URL="${context.baseUrl}"`,
      '',
      '# Use Gemini CLI or any OpenAI-compatible Gemini client.',
    ].join('\n')
  }

  return buildApiSnippet(language, context)
}

function buildApiSnippet(
  language: QuickstartLanguage,
  context: SnippetContext
): string {
  if (language === 'python') {
    return [
      'from openai import OpenAI',
      '',
      `api_key = "${context.apiKey}"`,
      `base_url = "${context.baseUrl}"`,
      '',
      'client = OpenAI(api_key=api_key, base_url=base_url)',
      '',
      'response = client.chat.completions.create(',
      `    model="${context.model}",`,
      '    messages=[{"role": "user", "content": "你好，初一"}],',
      ')',
      'print(response.choices[0].message.content)',
    ].join('\n')
  }

  if (language === 'typescript') {
    return [
      'import OpenAI from "openai"',
      '',
      `const apiKey = "${context.apiKey}"`,
      `const baseURL = "${context.baseUrl}"`,
      '',
      'const client = new OpenAI({ apiKey, baseURL })',
      '',
      'const response = await client.chat.completions.create({',
      `  model: "${context.model}",`,
      '  messages: [{ role: "user", content: "你好，初一" }],',
      '})',
      'console.log(response.choices[0]?.message.content)',
    ].join('\n')
  }

  if (language === 'curl') {
    return [
      `curl ${context.baseUrl}/chat/completions \\`,
      '  -H "Content-Type: application/json" \\',
      `  -H "Authorization: Bearer ${context.apiKey}" \\`,
      `  -d '{"model":"${context.model}","messages":[{"role":"user","content":"你好，初一"}]}'`,
    ].join('\n')
  }

  if (language === 'go') {
    return [
      'package main',
      '',
      'import (',
      '  "context"',
      '  "fmt"',
      '  openai "github.com/openai/openai-go"',
      '  "github.com/openai/openai-go/option"',
      ')',
      '',
      'func main() {',
      `  client := openai.NewClient(option.WithAPIKey("${context.apiKey}"), option.WithBaseURL("${context.baseUrl}"))`,
      '  resp, err := client.Chat.Completions.New(context.Background(), openai.ChatCompletionNewParams{',
      `    Model: "${context.model}",`,
      '  })',
      '  if err != nil { panic(err) }',
      '  fmt.Println(resp.Choices[0].Message.Content)',
      '}',
    ].join('\n')
  }

  if (language === 'java') {
    return [
      'var client = OpenAIOkHttpClient.builder()',
      `    .apiKey("${context.apiKey}")`,
      `    .baseUrl("${context.baseUrl}")`,
      '    .build();',
    ].join('\n')
  }

  return [
    'use async_openai::{Client, config::OpenAIConfig};',
    '',
    `let config = OpenAIConfig::new().with_api_key("${context.apiKey}").with_api_base("${context.baseUrl}");`,
    'let _client = Client::with_config(config);',
  ].join('\n')
}

export function isQuickstartClient(value: string): value is QuickstartClient {
  return QUICKSTART_CLIENTS.includes(value as QuickstartClient)
}

export function isQuickstartLanguage(
  value: string
): value is QuickstartLanguage {
  return QUICKSTART_LANGUAGES.includes(value as QuickstartLanguage)
}
