"""Update only the image; verify readiness and unchanged access configuration."""
import json
import os
import re
import subprocess
import time
from pathlib import Path


def az(*args):
    result = subprocess.run(['az', *args, '--output', 'json', '--only-show-errors'],
                            text=True, capture_output=True, check=True)
    return json.loads(result.stdout) if result.stdout.strip() else None


def protected_state(app, auth):
    config = app['properties']['configuration']
    container = app['properties']['template']['containers'][0]
    return {'identity': app.get('identity'), 'auth': auth,
            'ingress': config.get('ingress'), 'registries': config.get('registries'),
            'secrets': config.get('secrets'), 'environment': container.get('env'),
            'scale': app['properties']['template'].get('scale'),
            'probes': container.get('probes')}


def ready(revision):
    props = revision['properties']
    return (props.get('provisioningState') == 'Provisioned'
            and props.get('healthState') == 'Healthy'
            and props.get('runningState') in ('Running', 'RunningAtMaxScale'))


def deploy():
    group, app_name = os.environ['RESOURCE_GROUP'], os.environ['APP_NAME']
    image = os.environ['DEPLOY_IMAGE']
    if not re.fullmatch(r'crnexoaipdc01\.azurecr\.io/nexo-portafolio-ia@sha256:[0-9a-f]{64}', image):
        raise ValueError('Deploy only an immutable portal image from the approved ACR')
    if group != 'rg-nexo-ai-core' or app_name != 'nexo-portafolio-ia':
        raise ValueError('Unexpected deployment target')
    suffix = 'gh' + os.environ['GITHUB_RUN_ID'] + '-' + os.environ['GITHUB_RUN_ATTEMPT']
    before = az('containerapp', 'show', '-g', group, '-n', app_name)
    auth = az('containerapp', 'auth', 'show', '-g', group, '-n', app_name)
    if not auth['platform']['enabled'] or auth['globalValidation']['unauthenticatedClientAction'] != 'RedirectToLoginPage':
        raise ValueError('Expected Entra protection is not enabled')
    if before['properties']['configuration']['activeRevisionsMode'] != 'Single':
        raise ValueError('This rollout requires existing single-revision mode')
    original = protected_state(before, auth)
    previous = before['properties']['template']['containers'][0]['image']
    # Never serialize the complete app/auth configuration into logs or artifacts.
    az('containerapp', 'update', '-g', group, '-n', app_name,
       '--image', image, '--revision-suffix', suffix)
    revision_name = app_name + '--' + suffix
    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        revision = az('containerapp', 'revision', 'show', '-g', group, '-n', app_name,
                      '--revision', revision_name)
        props = revision['properties']
        print(f"{revision_name}: {props.get('provisioningState')} / {props.get('healthState')} / {props.get('runningState')}", flush=True)
        if ready(revision):
            break
        if props.get('provisioningState') == 'Failed':
            raise RuntimeError('Revision failed; do not retire the previous healthy revision')
        time.sleep(10)
    else:
        raise RuntimeError('Revision was not healthy within ten minutes; inspect before retrying')
    after = az('containerapp', 'show', '-g', group, '-n', app_name)
    after_auth = az('containerapp', 'auth', 'show', '-g', group, '-n', app_name)
    if original != protected_state(after, after_auth):
        raise RuntimeError('Protected configuration changed during deployment; investigate immediately')
    if after['properties'].get('latestReadyRevisionName') != revision_name:
        raise RuntimeError('New revision is not the latest ready revision')
    if after['properties']['template']['containers'][0]['image'] != image:
        raise RuntimeError('Deployed image differs from the tested image')
    metadata = {'commit': os.environ['GITHUB_SHA'], 'image': image, 'previous_image': previous,
                'revision': revision_name, 'deployed_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                'workflow': os.environ['GITHUB_SERVER_URL'] + '/' + os.environ['GITHUB_REPOSITORY'] + '/actions/runs/' + os.environ['GITHUB_RUN_ID']}
    Path('deployment.json').write_text(json.dumps(metadata, indent=2) + '\n')
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write('## Nexo AI published\n\n' + '\n'.join(f'- **{k}:** `{v}`' for k,v in metadata.items()) + '\n')


if __name__ == '__main__':
    deploy()
