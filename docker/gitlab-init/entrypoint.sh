#!/bin/bash
set -ex

GITLAB_URL="${GITLAB_URL:-http://gitlab}"

echo "[init] Waiting for GitLab to be ready..."
until [ "$(curl -s -o /dev/null -w '%{http_code}' "${GITLAB_URL}/api/v4/version")" != "000" ]; do
  sleep 10
done
echo "[init] GitLab is ready."

echo "[init] Creating root personal access token..."
PAT=$(docker exec watchenv-gitlab gitlab-rails runner "
  user = User.find_by_username('root')
  user.personal_access_tokens.active.where(name: 'watchenv-init').each(&:revoke!)
  token = user.personal_access_tokens.create!(
    scopes: [:api, :read_user, :write_repository],
    name: 'watchenv-init',
    expires_at: 365.days.from_now
  )
  \$stdout.puts 'WATCHENV_PAT=' + token.token
  \$stdout.flush
" | grep '^WATCHENV_PAT=' | cut -d= -f2)

if [ -z "${PAT}" ]; then
  echo "[init] ERROR: Failed to retrieve PAT"
  exit 1
fi
echo "[init] PAT ready."

echo "[init] Creating demo project..."
STATUS=$(curl -s -o /dev/null -w '%{http_code}' \
  --header "PRIVATE-TOKEN: ${PAT}" \
  "${GITLAB_URL}/api/v4/projects/root%2Fdemo")

if [ "${STATUS}" = "200" ]; then
  PROJECT_ID=$(curl -s --header "PRIVATE-TOKEN: ${PAT}" \
    "${GITLAB_URL}/api/v4/projects/root%2Fdemo" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
  echo "[init] Project already exists with ID: ${PROJECT_ID}"
else
  PROJECT=$(curl -sf \
    --header "PRIVATE-TOKEN: ${PAT}" \
    --data "name=demo&visibility=internal&initialize_with_readme=true" \
    "${GITLAB_URL}/api/v4/projects")
  PROJECT_ID=$(echo "${PROJECT}" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
  echo "[init] Project created with ID: ${PROJECT_ID}"
fi

echo "[init] Adding .gitlab-ci.yml..."
FILE_EXISTS=$(curl -s -o /dev/null -w '%{http_code}' \
  --header "PRIVATE-TOKEN: ${PAT}" \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/repository/files/.gitlab-ci.yml?ref=main")

CI_CONTENT='stages:
  - deploy

.deploy: &deploy
  stage: deploy
  script:
    - echo "Deploying $CI_COMMIT_REF_NAME to $CI_ENVIRONMENT_NAME"
    - sleep 5
  when: manual

deploy:staging-1:
  <<: *deploy
  environment:
    name: staging-1
    url: http://staging-1.example.com

deploy:staging-2:
  <<: *deploy
  environment:
    name: staging-2
    url: http://staging-2.example.com

deploy:staging-3:
  <<: *deploy
  environment:
    name: staging-3
    url: http://staging-3.example.com'

if [ "${FILE_EXISTS}" = "200" ]; then
  METHOD="PUT"
else
  METHOD="POST"
fi

curl -sf \
  --header "PRIVATE-TOKEN: ${PAT}" \
  --header "Content-Type: application/json" \
  --request "${METHOD}" \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/repository/files/.gitlab-ci.yml" \
  --data "{
    \"branch\": \"main\",
    \"content\": $(echo "${CI_CONTENT}" | jq -Rs .),
    \"commit_message\": \"Add deployment pipeline\"
  }" > /dev/null
echo "[init] CI/CD pipeline ready."

echo "[init] Enabling shared runners on project..."
curl -sf \
  --header "PRIVATE-TOKEN: ${PAT}" \
  --request PUT \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}" \
  --data "shared_runners_enabled=true" > /dev/null

echo "[init] Creating runner..."
RUNNER_EXISTS=$(cat /etc/gitlab-runner/config.toml 2>/dev/null | grep -c "watchenv-runner" || true)

if [ "${RUNNER_EXISTS}" -eq "0" ]; then
  RUNNER=$(curl -sf \
    --header "PRIVATE-TOKEN: ${PAT}" \
    --request POST \
    "${GITLAB_URL}/api/v4/user/runners" \
    --data "runner_type=instance_type&description=watchenv-runner&run_untagged=true")
  RUNNER_TOKEN=$(echo "${RUNNER}" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

  cat > /etc/gitlab-runner/config.toml << EOF
concurrent = 4

[[runners]]
  name = "watchenv-runner"
  url = "${GITLAB_URL}"
  token = "${RUNNER_TOKEN}"
  executor = "shell"
EOF
  echo "[init] Runner configured."
else
  echo "[init] Runner already configured."
fi

echo ""
echo "[init] Setup complete."
echo "  GitLab : http://localhost:8181"
echo "  Login  : root / ${GITLAB_ROOT_PASSWORD}"
echo "  Project: http://localhost:8181/root/demo"
