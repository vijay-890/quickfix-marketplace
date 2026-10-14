import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webpush from 'web-push';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '../..');
const envPath = path.join(projectRoot, '.env');
const content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const values = Object.fromEntries(content.split(/\r?\n/).filter(line => line && !line.trimStart().startsWith('#')).map(line => {
  const separator = line.indexOf('=');
  return separator < 0 ? [line, ''] : [line.slice(0, separator), line.slice(separator + 1)];
}));

if (values.WEB_PUSH_PUBLIC_KEY && values.WEB_PUSH_PRIVATE_KEY) {
  console.log('Web push keys are already configured in the root .env file.');
} else {
  const keys = webpush.generateVAPIDKeys();
  values.WEB_PUSH_PUBLIC_KEY = keys.publicKey;
  values.WEB_PUSH_PRIVATE_KEY = keys.privateKey;
  values.WEB_PUSH_SUBJECT ||= 'mailto:support@example.com';
  const managedKeys = new Set(['WEB_PUSH_PUBLIC_KEY', 'WEB_PUSH_PRIVATE_KEY', 'WEB_PUSH_SUBJECT']);
  const lines = content.split(/\r?\n/).filter(line => !managedKeys.has(line.slice(0, line.indexOf('='))));
  while (lines.length && !lines.at(-1)) lines.pop();
  lines.push(`WEB_PUSH_PUBLIC_KEY=${values.WEB_PUSH_PUBLIC_KEY}`, `WEB_PUSH_PRIVATE_KEY=${values.WEB_PUSH_PRIVATE_KEY}`, `WEB_PUSH_SUBJECT=${values.WEB_PUSH_SUBJECT}`);
  writeFileSync(envPath, `${lines.join('\n')}\n`, 'utf8');
  console.log('Generated and saved web push keys in the ignored root .env file. Keys were not printed.');
}
