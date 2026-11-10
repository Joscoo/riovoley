"""Read private CLI preview from stdin and emit only public Auth URL checks and booleans."""
import json
import sys
import tomllib

raw = sys.stdin.read()
try:
    data = json.loads(raw)
except (json.JSONDecodeError, ValueError):
    try:
        data = tomllib.loads(raw)
    except (tomllib.TOMLDecodeError, ValueError):
        data = {}

structured = isinstance(data, dict) and isinstance(data.get('preview'), dict)
configs = [] if structured else [data]
if structured:
    preview = data['preview']
    if (preview.get('target', {}).get('project_ref') == 'mayvvlkvheagkojunzzb'
            and preview.get('dry_run') is True and preview.get('wrote') is False
            and isinstance(preview.get('changes'), list)
            and 'auth' in preview.get('scope', {}).get('present', [])
            and 'auth' not in preview.get('scope', {}).get('missing', [])):
        remote_auth = {}
        invalid = False
        for change in preview['changes']:
            if not isinstance(change, dict):
                invalid = True
                continue
            location = change.get('path', [])
            if location in (['auth', 'site_url'], ['auth', 'additional_redirect_urls']):
                if location[1] in remote_auth:
                    invalid = True
                remote_auth[location[1]] = change.get('remote')
            elif location == ['auth']:
                invalid = True
        if not invalid and len(remote_auth) == 2:
            configs.insert(0, {'remotes': {'riovoley_audit_readonly': {'auth': remote_auth}}})
elif isinstance(data, dict) and isinstance(data.get('preview'), str):
    try:
        configs.append(tomllib.loads(data['preview']))
    except (tomllib.TOMLDecodeError, ValueError):
        pass

remote_configs = [config['remotes']['riovoley_audit_readonly'] for config in configs
                  if isinstance(config, dict) and isinstance(config.get('remotes'), dict)
                  and isinstance(config['remotes'].get('riovoley_audit_readonly'), dict)]
matches = [config['auth'] for config in remote_configs
           if isinstance(config.get('auth'), dict)
           and isinstance(config['auth'].get('site_url'), str)
           and config['auth']['site_url'].rstrip('/') == 'https://riovoley.com'
           and isinstance(config['auth'].get('additional_redirect_urls'), list)
           and all(isinstance(url, str) for url in config['auth']['additional_redirect_urls'])]
auth = matches[0] if matches else None
print(json.dumps({'authConfigReadbackAvailable': auth is not None,
                  'siteUrlMatchesOfficial': True if auth else None,
                  'webResetAllowed': 'https://riovoley.com/reset-password' in auth.get('additional_redirect_urls', []) if auth else None,
                  'nativeRedirectAllowed': 'riovoley://reset-password' in auth.get('additional_redirect_urls', []) if auth else None,
                  'reportedRedirectCount': len(auth.get('additional_redirect_urls', [])) if auth else None,
                  'loginOrSmtpFlowExecuted': False}))
