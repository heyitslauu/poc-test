pipeline {
    agent {
        docker {
            image 'amazon/aws-cli'
        }
    }

    options {
        skipDefaultCheckout()
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        // AWS configuration
        AWS_DEFAULT_REGION = "ap-southeast-1"
        AWS_ACCOUNT_ID="619071352095"

        EXCLUDE_FILE = "./deployment/exclude.txt"
        BACKUP_SCRIPT= "./deployment/backup-db.sh"
        MIGRATION_SCRIPT="./deployment/migration.sh"
        ARTIFACT_NAME = "build-artifacts"
        DEFAULT_WORKSPACE="/var/jenkins_home/workspace/empowerx-poc-test"
        // pnpm caching - content-addressable store for fast installs
        PNPM_STORE_DIR = "/var/cache/pnpm-store"

        PROJECT_NAME="empowerx-poc-test"
        SERVICE_NAME="fsds-api"

        ECR_URL = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${SERVICE_NAME}"
    }

    stages {
      stage('Checkout Project Repository') {
          steps {
              script {
                  try {
                      echo "Setting up default variables and workspace..."
                      
                      // Set up workspace and deployment variables
                      env.CUSTOM_WORKSPACE = "$DEFAULT_WORKSPACE/${env.BRANCH_NAME}"
                      env.DEPLOY_ENV = "${env.BRANCH_NAME}"
                      
                      echo "Branch: ${env.BRANCH_NAME}"
                      echo "Deploy Environment: ${env.DEPLOY_ENV}"
                      echo "Custom Workspace: ${env.CUSTOM_WORKSPACE}"
                      
                      ws("${env.CUSTOM_WORKSPACE}") {
                          echo "Checking out source code..."
                          checkout scm
                          
                          // Get repository information
                          if (!scm.getUserRemoteConfigs() || scm.getUserRemoteConfigs().isEmpty()) {
                              error "No remote repository configured"
                          }

                          if (env.BRANCH_NAME == "dev") {
                              env.ENV_TAG = "dev-latest"
                          } else if (env.BRANCH_NAME == "main") {
                              env.ENV_TAG = "prod-latest"
                          } else {
                              env.ENV_TAG = "staging-latest"
                          }
                          
                          env.REPO_URL = scm.getUserRemoteConfigs()[0].getUrl()
                          echo "Repository URL: ${env.REPO_URL}"
                          
                          // Get current commit hash
                          def commitHash = sh(
                              script: "git rev-parse HEAD",
                              returnStdout: true
                          ).trim()

                          
                          if (!commitHash) {
                              error "Failed to get commit hash"
                          }
                          
                          env.COMMIT = commitHash
                          echo "Current commit: ${env.COMMIT}"
                          echo "Environment tag for ECR: ${env.ENV_TAG}"
                          
                          // Get commit messages based on build type
                          def commitMessages = ""
                          
                          if (env.CHANGE_ID) {
                              // Pull Request build - get commits between base and head
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
                              // Regular branch build - get recent commits
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
                          
                          // Clean up repository URL and set commit URL
                          def cleanRepoUrl = env.REPO_URL.replaceFirst(/\.git$/, '')
                          env.COMMIT_MESSAGES = commitMessages ?: "No commit messages available"
                          env.COMMIT_URL = env.CHANGE_URL ?: "${cleanRepoUrl}/commit/${env.COMMIT}"
                          
                          // Get the person who initiated this build
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
                              
                              // Override with BUILD_USER if available (manual trigger)
                              if (env.BUILD_USER) {
                                  env.INITIATED_BY = env.BUILD_USER
                              }
                              
                              // For PR builds, try to get the PR author
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
          steps {
              echo "Load environment variables from config file to global environment"
              script {
                  ws("${env.CUSTOM_WORKSPACE}") {
                      configFileProvider([configFile(fileId: "config.${env.DEPLOY_ENV}", variable: 'ENV_FILE_PATH')]) {
                          // Load the file and export variables into environment
                          def envVars = readFile("${ENV_FILE_PATH}")
                              .split('\n')
                              .findAll { it.trim() && !it.startsWith('#') }
                              .collectEntries { line ->
                                  def (key, value) = line.split('=', 2)
                                  [(key.trim()): value.trim()]
                              }

                          // Set each env var dynamically
                          envVars.each { key, value ->
                              env."${key}" = value
                          }
                      }
                  }
              }
          }
      }

      stage('Build & Push Docker Image to ECR') {
          steps {
              script {
                  sh '''
                      apt-get update || true
                      apt-get install -y awscli || true
                  '''
                  sh '''
                      # Verify it's installed
                      aws --version
                  '''
                  ws("${env.CUSTOM_WORKSPACE}") {
                      withCredentials([aws(accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'aws-laurence', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                      sh '''
                          # Login to ECR
                          aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin ${ECR_URL}

                          # Setup buildx (important)
                          docker buildx create --use || true

                          # Build + Push (multi-arch)
                          IMAGE=${ECR_URL}:${ENV_TAG}

                          docker buildx build \
                            --platform linux/amd64,linux/arm64 \
                            -t $IMAGE \
                            --push \
                            --cache-from=type=registry,ref=$IMAGE \
                            --cache-to=type=registry,ref=$IMAGE,mode=max \
                            .
                      '''
                      }
                  }
              }
          }
      }
    }
}