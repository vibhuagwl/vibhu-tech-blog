#!/usr/bin/env bash
# Build images and push to ECR repos managed by Terraform.
# Prefer: terraform apply -target=aws_ecr_repository.* first, then this script.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="${ROOT}/aws/terraform"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
TAG="${IMAGE_TAG:-latest}"

if [[ -d "${TF_DIR}/.terraform" ]] || [[ -f "${TF_DIR}/terraform.tfstate" ]]; then
  # Use Terraform outputs when available
  if command -v terraform >/dev/null 2>&1; then
    API_URI="$(terraform -chdir="$TF_DIR" output -raw ecr_api_gateway 2>/dev/null || true)"
    USER_URI="$(terraform -chdir="$TF_DIR" output -raw ecr_user_service 2>/dev/null || true)"
    ORDER_URI="$(terraform -chdir="$TF_DIR" output -raw ecr_order_service 2>/dev/null || true)"
    REGION="$(terraform -chdir="$TF_DIR" output -raw aws_region 2>/dev/null || echo "$REGION")"
  fi
fi

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
PREFIX="${ECR_PREFIX:-gateway-lab}"

API_URI="${API_URI:-${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${PREFIX}/api-gateway}"
USER_URI="${USER_URI:-${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${PREFIX}/user-service}"
ORDER_URI="${ORDER_URI:-${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${PREFIX}/order-service}"

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
  local repo_url="$3"
  local repo_path="${repo_url#*.amazonaws.com/}"
  ensure_repo "$repo_path"
  docker build -f "$ROOT/Dockerfile" \
    --build-arg "MODULE=${module}" \
    --build-arg "JAR_FILE=${jar}" \
    -t "${repo_url}:${TAG}" "$ROOT"
  docker push "${repo_url}:${TAG}"
  echo "Pushed ${repo_url}:${TAG}"
}

login
build_push api-gateway api-gateway-0.1.0-SNAPSHOT.jar "$API_URI"
build_push user-service user-service-0.1.0-SNAPSHOT.jar "$USER_URI"
build_push order-service order-service-0.1.0-SNAPSHOT.jar "$ORDER_URI"

echo
echo "Next:"
echo "  cd aws/terraform && terraform apply"
echo "  GATEWAY_URL=\$(terraform output -raw alb_url) ../../scripts/smoke-aws.sh"
