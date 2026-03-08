pipeline {
    agent any

    options {
        skipDefaultCheckout()
        disableConcurrentBuilds()
        timestamps()
    }


    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
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
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-jenkins'
                ]]) {
                    sh '''
                    aws ecr describe-repositories \
                      --repository-names $SERVICE_NAME \
                      --region $AWS_REGION \
                    || aws ecr create-repository \
                      --repository-name $SERVICE_NAME \
                      --region $AWS_REGION
                    '''
                }
            }
        }

        stage('Login to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-jenkins'
                ]]) {
                    sh '''
                    aws ecr get-login-password --region $AWS_REGION | docker login \
                      --username AWS \
                      --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
                    '''
                }
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                sh '''
                IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SERVICE_NAME:$ENV_TAG

                docker buildx create --use || true

                docker buildx build \
                  --platform linux/amd64,linux/arm64 \
                  -t $IMAGE \
                  --push \
                  .
                '''
            }
        }

        stage('Generate docker-compose.yml') {
            steps {
                sh '''
                cat > docker-compose.yml <<EOL
                services:
                  app:
                    image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SERVICE_NAME:$ENV_TAG
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
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-jenkins'
                ]]) {

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
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-jenkins'
                ]]) {

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