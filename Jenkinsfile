pipeline {
    agent none

    options {
        skipDefaultCheckout()
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        AWS_DEFAULT_REGION = "ap-southeast-1"
        AWS_ACCOUNT_ID="619071352095"
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com"
        SERVICE_NAME="fsds-api" // TODO: Change this to your actual service name, e.g. "myapp-api"
        IMAGE_REPO = "${ECR_REGISTRY}/${SERVICE_NAME}"
      
        DEFAULT_WORKSPACE="/var/jenkins_home/workspace/empowerx-poc-test"
        PNPM_STORE_DIR = "/var/cache/pnpm-store"

        PROJECT_NAME="empowerx-poc-test" // TODO: Change this to your actual project name, e.g. "myapp"
        ASG_NAME="${SERVICE_NAME}-${DEPLOY_ENV}-asg"
    }

    stages {
      stage('Checkout Project Repository') {
        agent any
          steps {
              script {
                  try {
                      echo "Setting up default variables and workspace..."
                      
                      env.CUSTOM_WORKSPACE = "${env.DEFAULT_WORKSPACE}/${env.BRANCH_NAME}"
                      env.DEPLOY_ENV = "${env.BRANCH_NAME}"
                      
                      echo "Branch: ${env.BRANCH_NAME}"
                      echo "Deploy Environment: ${env.DEPLOY_ENV}"
                      echo "Custom Workspace: ${env.CUSTOM_WORKSPACE}"
                      
                      ws("${env.CUSTOM_WORKSPACE}") {
                          echo "Checking out source code..."
                          checkout scm

                          env.REPO_URL = scm.getUserRemoteConfigs()[0].getUrl()
                          echo "Repository URL: ${env.REPO_URL}"
                          
                          def commitHash = sh(
                              script: "git rev-parse HEAD",
                              returnStdout: true
                          ).trim()

                          env.SHORT_COMMIT = commitHash.take(7) 

                          if (!commitHash) {
                              error "Failed to get commit hash"
                          }
                          
                          if (!scm.getUserRemoteConfigs() || scm.getUserRemoteConfigs().isEmpty()) {
                              error "No remote repository configured"
                          }

                          if (env.BRANCH_NAME == "dev") {
                              env.ENV_TAG = "dev-latest"
                              env.VERSION_TAG = "dev-${env.SHORT_COMMIT}"
                          } else if (env.BRANCH_NAME == "main") {
                              env.ENV_TAG = "prod-latest"
                              env.VERSION_TAG = "prod-${env.SHORT_COMMIT}"
                          } else {
                              env.ENV_TAG = "staging-latest"
                              env.VERSION_TAG = "staging-${env.SHORT_COMMIT}"
                          }
                          
                          echo "Environment floating tag: ${env.ENV_TAG}"
                          echo "Environment version tag: ${env.VERSION_TAG}"

                          env.COMMIT = commitHash
                          echo "Current commit: ${env.COMMIT}"

                          def commitMessages = ""
                          
                          if (env.CHANGE_ID) {
                              echo "Detected PR build, collecting commit messages from PR..."
                              try {
                                  commitMessages = "• ${env.CHANGE_TITLE}"
                                  if (env.CHANGE_DESCRIPTION?.trim()) {
                                      commitMessages += "\n" + env.CHANGE_DESCRIPTION
                                  }
                                  
                                  if (!commitMessages) {
                                      commitMessages = sh(
                                          script: "git log -1 --pretty=format:' %s' ${env.COMMIT}",
                                          returnStdout: true
                                      ).trim()
                                  }
                              } catch (Exception e) {
                                  echo "Warning: Could not get PR commit messages: ${e.getMessage()}"
                                  commitMessages = "Unable to retrieve commit messages"
                              }
                          } else {
                              echo "Detected branch build, collecting recent commit messages..."
                              try {
                                  commitMessages = sh(
                                      script: "git log -1 --oneline --pretty=format:' %s' ${env.COMMIT}",
                                      returnStdout: true
                                  ).trim()
                              } catch (Exception e) {
                                  echo "Warning: Could not get commit messages: ${e.getMessage()}"
                                  commitMessages = "Unable to retrieve commit messages"
                              }
                          }
                          
                          def cleanRepoUrl = env.REPO_URL.replaceFirst(/\.git$/, '')
                          env.COMMIT_MESSAGES = commitMessages ?: "No commit messages available"
                          env.COMMIT_URL = env.CHANGE_URL ?: "${cleanRepoUrl}/commit/${env.COMMIT}"
                          
                          env.INITIATED_BY = "system"
                          try {
                              if (env.COMMIT) {
                                  def author = sh(
                                      script: "git --no-pager show -s --format='%an' ${env.COMMIT}",
                                      returnStdout: true
                                  ).trim()
                                  
                                  if (author) {
                                      env.INITIATED_BY = author
                                  }
                              }
                              
                              if (env.BUILD_USER) {
                                  env.INITIATED_BY = env.BUILD_USER
                              }
                              
                              if (env.CHANGE_AUTHOR) {
                                  env.INITIATED_BY = env.CHANGE_AUTHOR
                              }
                              
                          } catch (Exception e) {
                              echo "Warning: Could not determine build initiator: ${e.getMessage()}"
                              env.INITIATED_BY = "unknown"
                          }
                          
                          echo "Build initiated by: ${env.INITIATED_BY}"
                          echo "Commit URL: ${env.COMMIT_URL}"
                          echo "Commit messages preview: ${env.COMMIT_MESSAGES.take(200)}..."
                          echo "Successfully checked out code at workspace: ${env.CUSTOM_WORKSPACE}"
                      }
                      
                  } catch (Exception e) {
                      error "Failed during checkout: ${e.getMessage()}"
                  }
              }
          }
      }

      stage('Create CACHE folders') {
          agent any
          steps {
              script {
                  ws("${env.CUSTOM_WORKSPACE}") {
                      sh '''
                          mkdir -p $PNPM_STORE_DIR
                      '''
                  }
              }
          }
      }

      stage('Prepare environment variables') {
          agent any
          steps {
              echo "Load environment variables from config file to global environment"
              script {
                  ws("${env.CUSTOM_WORKSPACE}") {
                      configFileProvider([configFile(fileId: "config.${env.DEPLOY_ENV}", variable: 'ENV_FILE_PATH')]) {
                          def envVars = readFile("${ENV_FILE_PATH}")
                              .split('\n')
                              .findAll { it.trim() && !it.startsWith('#') }
                              .collectEntries { line ->
                                  def (key, value) = line.split('=', 2)
                                  [(key.trim()): value.trim()]
                              }

                          // FIX: Changed from .each closure to a for-loop to prevent NotSerializableException in Jenkins
                          for (def entry : envVars) {
                              env."${entry.key}" = entry.value
                          }
                      }
                  }
              }
          }
      }

      stage('Build & Push Multi-Arch Image') {
          agent any
          steps {
              script {
                  ws("${env.CUSTOM_WORKSPACE}") {
                      withCredentials([aws(accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'aws-laurence', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                          sh """
                              set -euxo pipefail

                              # 1. Register QEMU (On the host)
                              docker run --rm --privileged multiarch/qemu-user-static --reset -p yes

                              # 2. Run the build
                              docker run --rm --privileged \
                                -v /var/run/docker.sock:/var/run/docker.sock \
                                --volumes-from cicd-jenkins-region \
                                -e AWS_ACCESS_KEY_ID \
                                -e AWS_SECRET_ACCESS_KEY \
                                -e AWS_DEFAULT_REGION="${env.AWS_DEFAULT_REGION}" \
                                -e ECR_REGISTRY="${env.ECR_REGISTRY}" \
                                -e IMAGE_REPO="${env.IMAGE_REPO}" \
                                -e ENV_TAG="${env.ENV_TAG}" \
                                -e WSPACE="${env.CUSTOM_WORKSPACE}" \
                                docker:24.0.7 \
                                sh -c '
                                  set -ex
                                  
                                  apk add --no-cache aws-cli

                                  export BUILDX_VERSION="v0.12.1"
                                  mkdir -p ~/.docker/cli-plugins
                                  wget -qO ~/.docker/cli-plugins/docker-buildx "https://github.com/docker/buildx/releases/download/\${BUILDX_VERSION}/buildx-\${BUILDX_VERSION}.linux-amd64"
                                  chmod a+x ~/.docker/cli-plugins/docker-buildx

                                  aws ecr get-login-password --region \$AWS_DEFAULT_REGION | docker login --username AWS --password-stdin \$ECR_REGISTRY
                                  
                                  cd "\$WSPACE"
                                  
                                  docker buildx create --use --name multi-arch-builder --driver docker-container || docker buildx use multi-arch-builder
                                  docker buildx inspect --bootstrap
                                  
                                  docker buildx build \
                                    --platform linux/amd64,linux/arm64 \
                                    -f Dockerfile \
                                    -t "\$IMAGE_REPO:\$ENV_TAG" \
                                    -t "\$IMAGE_REPO:\$VERSION_TAG" \
                                    --push .
                                '
                          """
                      }
                  }
              }
          }
      }

      stage('Production Deploy Approval') {
          when { branch 'main' }
          steps {
              timeout(time: 2, unit: 'DAYS') {
                  input message: "Image pushed to ECR. Do you want to deploy version ${env.VERSION_TAG} to Production?", 
                        ok: "Deploy to Production"
              }
          }
      }

      stage('Upload Configuration to S3'){
        agent any
        steps {
          script {
            ws("${env.CUSTOM_WORKSPACE}") {
              withCredentials([
                  file(credentialsId: "env.${env.DEPLOY_ENV}", variable: 'ENV_FILE'),
                  aws(accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'aws-laurence', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')
              ]) {
                sh """
                    cp "\$ENV_FILE" .env
                    sed -i 's/\\r\$//' .env

                    cat > docker-compose.yml <<EOF
services:
  app:
    image: ${env.IMAGE_REPO}:${env.VERSION_TAG}
    container_name: ${env.SERVICE_NAME}
    ports:
      - "3000:3000"
    env_file:
      - .env
EOF

                    S3_BASE_PATH="s3://s3-compose/${env.SERVICE_NAME}/${env.ENV_TAG}"
                    aws s3 cp docker-compose.yml "\$S3_BASE_PATH/docker-compose.yml"
                    aws s3 cp .env "\$S3_BASE_PATH/.env" --region ${env.AWS_DEFAULT_REGION}
                """
              }
            }
          }
        } 
      }

      stage('Trigger ASG Instance Refresh') {
        agent any
        steps {
          script {
            withCredentials([aws(accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'aws-laurence', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
              sh """
                  set -e
                  echo "🚀 Triggering Instance Refresh for ASG: ${env.ASG_NAME}"
                  
                  # This command tells AWS to start terminating old instances and booting new ones
                  aws autoscaling start-instance-refresh \
                      --auto-scaling-group-name "${env.ASG_NAME}" \
                      --region "${env.AWS_DEFAULT_REGION}"
                  
                  echo "✅ Instance Refresh triggered successfully! AWS is now rolling out the new instances."
              """
            }
          }
        }
      }
    }
}