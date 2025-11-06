#!/bin/bash

set -e
set -x

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
export BUILD_PATH="${SCRIPT_DIR}/../build"
BUILD_ZIP="${BUILD_PATH}/build.zip"

ENVIRONMENT="${1}"
case "${ENVIRONMENT}" in
  "production")
    export REACT_APP_API_ENDPOINT='wss://ikt.codelabs.site/cable'
    SSH_ENDPOINT='ikt.codelabs.site'
    DEPLOY_TO='/opt/ai/scoring-ikt.codelabs.site/'
    ;;
  "staging")
    export REACT_APP_API_ENDPOINT='wss://stage-ikt.codelabs.site/cable'
    SSH_ENDPOINT='stage-ikt.codelabs.site'
    DEPLOY_TO='/opt/ai/stage-scoring-ikt.codelabs.site/'
    ;;
  *)
    echo "Unknown environment: ${ENVIRONMENT}"
    exit 1
    ;;
esac

rm -rf "${BUILD_PATH}"
npm install

npm run build
(
  cd "${BUILD_PATH}"
  zip -r "${BUILD_ZIP}" *
)

scp build/build.zip "${SSH_ENDPOINT}":"${DEPLOY_TO}"
ssh "${SSH_ENDPOINT}" "cd '${DEPLOY_TO}' && rm -rf public && mkdir public && unzip build.zip -d public && rm build.zip"
