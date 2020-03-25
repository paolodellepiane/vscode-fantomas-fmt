'use strict';
import * as execa from 'execa';

const DEFAULT_SUBPROCESS_OPTIONS = {
  shell: true,
  timeout: 10000
};

export function runShell(args: string) {
  return execa.command(args, DEFAULT_SUBPROCESS_OPTIONS);
}

export function log(input) {
  console.log('[fantomas-fmt] ' + input);
}

export function logerr(input) {
  console.error('[fantomas-fmt] ' + input);
}

