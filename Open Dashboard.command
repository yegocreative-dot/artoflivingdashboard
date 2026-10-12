#!/bin/zsh -l
cd "${0:A:h}" || exit 1
if ! command -v node >/dev/null 2>&1; then
  print 'Node.js is required for this LOCAL preview. Production uses ordinary PHP.'
  read 'reply?Press Enter to close.'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  if [[ ! -d /Volumes/sin/CodexWork ]]; then
    print 'The external CodexWork volume is not mounted. No dependencies were installed.'
    read 'reply?Press Enter to close.'
    exit 1
  fi
  npm ci --cache /Volumes/sin/CodexWork/npm-cache --no-audit --no-fund || exit 1
fi
print 'Open the local URL printed below. Keep this window open while editing.'
print 'Stop the preview with Ctrl+C. This does not deploy the website.'
npm run preview
