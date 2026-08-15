#!/usr/bin/env bash
# Build images and push to ECR (real AWS). Requires: aws cli, docker, logged-in account.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
PREFIX="${ECR_PREFIX:-gateway-lab}"
TAG="${IMAGE_TAG:-latest}"

login() {
  aws ecr get-login-password --region "$REGION" \
    | docker login --username AWS --password-stdin "${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"
}

ensure_repo() {
  local name="$1"
  aws ecr describe-repositories --repository-names "$name" --region "$REGION" >/dev/null 2>&1 \
    || aws ecr create-repository --repository-name "$name" --region "$REGION" >/dev/null
}

build_push() {
  local module="$1"
  local jar="$2"
  local repo="${PREFIX}/${module}"
  local uri="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${repo}:${TAG}"
  ensure_repo "$repo"
  docker build -f "$ROOT/Dockerfile" \
    --build-arg "MODULE=${module}" \
    --build-arg "JAR_FILE=${jar}" \
    -t "$uri" "$ROOT"
  docker push "$uri"
  echo "Pushed $uri"
}

login
build_push api-gateway api-gateway-0.1.0-SNAPSHOT.jar
build_push user-service user-service-0.1.0-SNAPSHOT.jar
build_push order-service order-service-0.1.0-SNAPSHOT.jar

echo
echo "Deploy stack example:"
echo "  aws cloudformation deploy --stack-name gateway-live-lab \\"
echo "    --template-file aws/cloudformation.yml --capabilities CAPABILITY_NAMED_IAM \\"
echo "    --parameter-overrides VpcId=vpc-xxx PublicSubnetIds=subnet-a,subnet-b \\"
echo "      ApiGatewayImage=${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${PREFIX}/api-gateway:${TAG} \\"
echo "      UserServiceImage=${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${PREFIX}/user-service:${TAG} \\"
echo "      OrderServiceImage=${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${PREFIX}/order-service:${TAG}"
