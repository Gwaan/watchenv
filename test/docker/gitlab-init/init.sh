#!/bin/bash
set -e

GITLAB_URL="${GITLAB_URL:-http://gitlab}"
APP_URL="${APP_URL:-http://localhost:4200}"
GITLAB_CONTAINER="watchenv-gitlab"

echo "==> Waiting for GitLab to be healthy..."
until docker inspect --format='{{.State.Health.Status}}' "${GITLAB_CONTAINER}" 2>/dev/null | grep -q "healthy"; do
  sleep 15
  echo "    Status: $(docker inspect --format='{{.State.Health.Status}}' "${GITLAB_CONTAINER}" 2>/dev/null || echo 'unknown')"
done
echo "==> GitLab is healthy"

echo "==> Creating admin API token via Rails..."
API_TOKEN=$(docker exec "${GITLAB_CONTAINER}" \
  gitlab-rails runner \
  "t = User.find_by(username: 'root').personal_access_tokens.create!(name: 'watchenv-init', scopes: ['api'], expires_at: 30.days.from_now); puts t.token")

if [ -z "${API_TOKEN}" ]; then
  echo "ERROR: Failed to create API token"
  exit 1
fi

echo "==> Creating OAuth application..."
OAUTH=$(curl -sf \
  -H "PRIVATE-TOKEN: ${API_TOKEN}" \
  -X POST "${GITLAB_URL}/api/v4/applications" \
  -F "name=WatchEnv" \
  -F "redirect_uri=${APP_URL}/api/auth/gitlab/callback" \
  -F "scopes=read_user read_api")

echo "==> Creating test project..."
PROJECT=$(curl -s \
  -H "PRIVATE-TOKEN: ${API_TOKEN}" \
  -X POST "${GITLAB_URL}/api/v4/projects" \
  -F "name=test-app" \
  -F "visibility=internal" \
  -F "initialize_with_readme=true")

PROJECT_ID=$(echo "${PROJECT}" | jq -r '.id // empty')
if [ -z "${PROJECT_ID}" ]; then
  echo "    Project exists, fetching..."
  PROJECT=$(curl -sf \
    -H "PRIVATE-TOKEN: ${API_TOKEN}" \
    "${GITLAB_URL}/api/v4/projects/root%2Ftest-app")
  PROJECT_ID=$(echo "${PROJECT}" | jq -r '.id')
fi

echo "    Project ID: ${PROJECT_ID}"

echo "==> Pushing .gitlab-ci.yml..."
CI_CONTENT=$(cat <<'EOF'
stages:
  - deploy

.deploy:
  image: alpine:latest
  script:
    - echo "Deploying $CI_COMMIT_SHORT_SHA to $CI_ENVIRONMENT_NAME..."
    - sleep 10
    - echo "Done"

deploy-dev:
  extends: .deploy
  stage: deploy
  environment:
    name: dev
    url: http://dev.example.com

deploy-staging:
  extends: .deploy
  stage: deploy
  environment:
    name: staging
    url: http://staging.example.com
  needs: [deploy-dev]

deploy-production:
  extends: .deploy
  stage: deploy
  environment:
    name: production
    url: http://production.example.com
  needs: [deploy-staging]
  when: manual
EOF
)

CI_FILE_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "PRIVATE-TOKEN: ${API_TOKEN}" \
  "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/repository/files/.gitlab-ci.yml?ref=main")

if [ "${CI_FILE_EXISTS}" = "200" ]; then
  curl -sf \
    -H "PRIVATE-TOKEN: ${API_TOKEN}" \
    -X PUT "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/repository/files/.gitlab-ci.yml" \
    -H "Content-Type: application/json" \
    -d "{\"branch\":\"main\",\"content\":$(echo "$CI_CONTENT" | jq -Rs .),\"commit_message\":\"chore: update CI pipeline\"}" > /dev/null
else
  curl -sf \
    -H "PRIVATE-TOKEN: ${API_TOKEN}" \
    -X POST "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/repository/files/.gitlab-ci.yml" \
    -H "Content-Type: application/json" \
    -d "{\"branch\":\"main\",\"content\":$(echo "$CI_CONTENT" | jq -Rs .),\"commit_message\":\"chore: add CI pipeline\"}" > /dev/null
fi

echo "==> Creating deployment webhook..."
curl -sf \
  -H "PRIVATE-TOKEN: ${API_TOKEN}" \
  -X POST "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/hooks" \
  -F "url=${BACKEND_WEBHOOK_URL}" \
  -F "deployment_events=true" \
  -F "token=test-webhook-secret" > /dev/null

echo "==> Registering GitLab Runner..."
RUNNER=$(curl -sf \
  -H "PRIVATE-TOKEN: ${API_TOKEN}" \
  -X POST "${GITLAB_URL}/api/v4/user/runners" \
  -F "runner_type=instance_type" \
  -F "description=watchenv-docker-runner" \
  -F "executor=docker" \
  -F "docker_image=docker:24")

RUNNER_TOKEN=$(echo "${RUNNER}" | jq -r '.token')

gitlab-runner register \
  --non-interactive \
  --url "${GITLAB_URL}" \
  --token "${RUNNER_TOKEN}" \
  --executor "docker" \
  --docker-image "alpine:latest" \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock" \
  --docker-network-mode "test_default" \
  --clone-url "${GITLAB_URL}" \
  --description "watchenv-test-runner"

echo ""
echo "==> Init complete. Add these to your .env:"
echo "    GITLAB_CLIENT_ID=$(echo "${OAUTH}" | jq -r '.application_id')"
echo "    GITLAB_CLIENT_SECRET=$(echo "${OAUTH}" | jq -r '.secret')"
