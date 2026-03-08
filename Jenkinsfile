pipeline {
    agent any

    options {
        skipDefaultCheckout()
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        AWS_REGION = "ap-southeast-1"
        SERVICE_NAME = "my-service"
        AWS_ACCOUNT_ID = "123456789012"
        ASG_NAME = "my-asg"
    }

    stages {

        stage('Install Dependencies') {
            steps {
                sh '''
                echo "Installing dependencies..."

                # Install AWS CLI v2 if not installed
                if ! command -v aws &> /dev/null; then
                  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
                  unzip awscliv2.zip
                  sudo ./aws/install
                  rm -rf awscliv2.zip aws/
                fi

                # Install Docker if not installed
                if ! command -v docker &> /dev/null; then
                  sudo apt-get update
                  sudo apt-get install -y docker.io docker-compose-plugin
                fi

                # Ensure Docker daemon is running
                sudo systemctl start docker
                sudo systemctl enable docker

                # Setup Docker Buildx
                docker buildx create --use || true

                # Verify versions
                aws --version
                docker --version
                docker buildx version
                '''
            }
        }

        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Set Environment Variables') {
            steps {
                script {
                    if (env.BRANCH_NAME == "main") {
                        env.ENVIRONMENT = "prod"
                        env.ENV_TAG = "prod-latest"
                    } else if (env.BRANCH_NAME == "dev") {
                        env.ENVIRONMENT = "dev"
                        env.ENV_TAG = "dev-latest"
                    } else {
                        env.ENVIRONMENT = "staging"
                        env.ENV_TAG = "staging-latest"
                    }
                }
            }
        }

        stage('Ensure ECR Repo Exists') {
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    aws ecr describe-repositories --repository-names $SERVICE_NAME \
                    || aws ecr create-repository --repository-name $SERVICE_NAME --region $AWS_REGION
                    '''
                }
            }
        }

        stage('Login to ECR') {
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    aws ecr get-login-password --region $AWS_REGION | docker login \
                      --username AWS \
                      --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
                    '''
                }
            }
        }

        stage('Build and Push Docker Image') {
            parallel {
                stage('Build amd64') {
                    steps {
                        sh '''
                        IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SERVICE_NAME:$ENV_TAG-amd64
                        docker buildx build \
                          --platform linux/amd64 \
                          -t $IMAGE \
                          --push \
                          --cache-from=type=registry,ref=$IMAGE \
                          --cache-to=type=registry,mode=max,ref=$IMAGE \
                          .
                        '''
                    }
                }
                stage('Build arm64') {
                    steps {
                        sh '''
                        IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SERVICE_NAME:$ENV_TAG-arm64
                        docker buildx build \
                          --platform linux/arm64 \
                          -t $IMAGE \
                          --push \
                          --cache-from=type=registry,ref=$IMAGE \
                          --cache-to=type=registry,mode=max,ref=$IMAGE \
                          .
                        '''
                    }
                }
            }
        }

        stage('Generate docker-compose.yml') {
            steps {
                sh '''
                cat > docker-compose.yml <<EOL
                services:
                  app:
                    image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SERVICE_NAME:$ENV_TAG-amd64
                    container_name: $SERVICE_NAME-api
                    ports:
                      - "80:3000"
                EOL
                '''
            }
        }

        stage('Generate .env') {
            steps {
                withCredentials([string(credentialsId: 'app-env', variable: 'CLEAN_ENV')]) {
                    sh 'echo "$CLEAN_ENV" > .env'
                }
            }
        }

        stage('Upload to S3') {
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    S3_PATH="s3://s3-compose/${SERVICE_NAME}/${ENV_TAG}/docker-compose.yml"
                    S3_ENV_PATH="s3://s3-compose/${SERVICE_NAME}/${ENV_TAG}/.env"

                    echo "Uploading docker-compose.yml to $S3_PATH"
                    echo "Uploading .env to $S3_ENV_PATH"

                    aws s3 cp .env $S3_ENV_PATH --region $AWS_REGION
                    aws s3 cp docker-compose.yml $S3_PATH --region $AWS_REGION
                    '''
                }
            }
        }

        stage('Trigger ASG Refresh') {
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    aws autoscaling start-instance-refresh \
                      --auto-scaling-group-name $ASG_NAME \
                      --region $AWS_REGION
                    '''
                }
            }
        }
    }
}