@Library('custom-lib@main') _

pipeline {
    agent any

    options {
        skipDefaultCheckout()
        // Stop pipeline immediately on first failure
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        EXCLUDE_FILE = "./deployment/exclude.txt"
        BACKUP_SCRIPT= "./deployment/backup-db.sh"
        MIGRATION_SCRIPT="./deployment/migration.sh"
        ARTIFACT_NAME = "build-artifacts"
        DEFAULT_WORKSPACE="/var/jenkins_home/workspace/empowerx-fsds-api"
        // pnpm caching - content-addressable store for fast installs
        PNPM_STORE_DIR = "/var/cache/pnpm-store"

        PROJECT_NAME="empowerx-fsds-api"
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
                        env.sshCredentialId = "ssh-ec2-${env.BRANCH_NAME}"
                        
                        echo "Branch: ${env.BRANCH_NAME}"
                        echo "Deploy Environment: ${env.DEPLOY_ENV}"
                        echo "SSH Credential ID: ${env.sshCredentialId}"
                        echo "Custom Workspace: ${env.CUSTOM_WORKSPACE}"
                        
                        ws("${env.CUSTOM_WORKSPACE}") {
                            echo "Checking out source code..."
                            checkout scm
                            
                            // Get repository information
                            if (!scm.getUserRemoteConfigs() || scm.getUserRemoteConfigs().isEmpty()) {
                                error "No remote repository configured"
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

        stage('Security Scan - GitLeaks') {
            steps {
                script {
                    ws("${env.CUSTOM_WORKSPACE}") {
                        checkout scm
                        echo "Running GitLeaks security scan on workspace files..."
                        
                        def scanResult = sh(
                            script: '''
                                docker run --rm \
                                    -v "./:/repo" \
                                    zricethezav/gitleaks:latest \
                                    detect \
                                    --source=/repo \
                                    --no-git \
                                    --redact \
                                    --log-level=trace \
                                    --exit-code 1
                            ''',
                            returnStatus: true
                        )
                        
                        if (scanResult != 0) {
                            error "GitLeaks detected secrets in the codebase! Please review and remove sensitive data."
                        }
                        
                        echo "✓ Security scan passed - no secrets detected"
                    }
                }
            }
            
            post {
                failure {
                    echo "⚠️ Security scan failed! Secrets detected in code."
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

        stage('Prepare Destination Folder & Set Permissions') {
            steps {
                script {
                    ws("${env.CUSTOM_WORKSPACE}") {
                        sshagent (credentials: [env.sshCredentialId]) {
                            sh """
                                ssh -o StrictHostKeyChecking=no -p \$DEPLOY_PORT \$DEPLOY_USER@\$DEPLOY_HOST \\
                                "sudo mkdir -p \$DEPLOY_PATH && \\
                                sudo chmod 775 \$DEPLOY_PATH && \\
                                sudo chown -R \$DEPLOY_USER:\$DEPLOY_USER \$DEPLOY_PATH && \\
                                sudo chmod -R u+w \$DEPLOY_PATH"
                            """
                        }
                    }
                }
            }
        }

        stage('Deploy via Rsync') {
            steps {
                script {
                    ws("${env.CUSTOM_WORKSPACE}") {

                        // Prepare .env file and inject to environment...
                        withCredentials([file(credentialsId: "env.${env.DEPLOY_ENV}", variable: 'ENV_FILE')]) {
                            sh '''
                                cp $ENV_FILE .env
                                sed -i 's/\r$//' .env
                            '''
                            def envFileContent = readFile(ENV_FILE)
                            envFileContent.split('\n').each { line ->
                                if (line.trim() && !line.startsWith('#')) {
                                    def (k, v) = line.split('=', 2)
                                    env."${k.trim()}" = v.trim()
                                }
                            }
                        }

                        sshagent([env.sshCredentialId]) {
                            sh '''
                                echo "Uploading files to server using rsync..."
                                rsync -avz ./ \
                                    --exclude-from=$EXCLUDE_FILE \
                                    -e "ssh -p $DEPLOY_PORT" \
                                    $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH
                            '''
                        }
                    }
                }
            }

            post {
                success {
                    script {
                        ws("${env.CUSTOM_WORKSPACE}") {
                            echo "Running database backup script..."
                            sshagent([env.sshCredentialId]) {
                                sh """
                                    ssh -o StrictHostKeyChecking=no \$DEPLOY_USER@\$DEPLOY_HOST '
                                        set -e
                                        set +x
                                        echo "Running backup script on remote server..."
                                        cd $DEPLOY_PATH &&
                                        chmod 644 $DEPLOY_PATH/.env &&
                                        chmod +x $BACKUP_SCRIPT &&
                                        $BACKUP_SCRIPT &&
                                        echo "Backup completed successfully!"
                                        set -x
                                    '
                                """
                            }
                        }
                    }
                }

                failure {
                    echo "Database backup failed."
                }
            }
        }

        stage('Build Docker Image and Containers') {
            steps {
                script {
                    ws("${env.CUSTOM_WORKSPACE}") {
                        sshagent([env.sshCredentialId]) {
                            // Set returnStatus to capture exit code
                            def buildResult = sh(script: '''
                                echo "Creating destination directory and setting permissions..."
                                set -e
                                set -x

                                echo "Running remote deploy commands..."
                                ssh -o StrictHostKeyChecking=no -p $DEPLOY_PORT $DEPLOY_USER@$DEPLOY_HOST "
                                    set -e
                                    set -x
                                    
                                    cd $DEPLOY_PATH &&

                                    # Recreate Docker Network
                                    if ! docker network inspect \\"$DOCKER_NETWORK_NAME\\" >/dev/null 2>&1; then
                                        docker network create \\"$DOCKER_NETWORK_NAME\\"
                                    fi &&

                                    # Recreate Volumes
                                    if ! docker volume inspect \\"$DOCKER_VOLUME_DB_NAME\\" >/dev/null 2>&1; then
                                        docker volume create \\"$DOCKER_VOLUME_DB_NAME\\"
                                    fi &&

                                    # Recreate FSDS Logs Volume
                                    if ! docker volume inspect \\"$DOCKER_VOLUME_FSDS_LOGS_NAME\\" >/dev/null 2>&1; then
                                        docker volume create \\"$DOCKER_VOLUME_FSDS_LOGS_NAME\\"
                                    fi &&
                                  
                                    # Recreate Redis Volume
                                    if ! docker volume inspect \\"$DOCKER_VOLUME_REDIS_NAME\\" >/dev/null 2>&1; then
                                        docker volume create \\"$DOCKER_VOLUME_REDIS_NAME\\"
                                    fi &&

                                    # Rebuild services
                                    echo \"Running cmd: docker compose -f compose.yaml up -d --build\"
                                    echo \"Building Docker images and starting containers...\"
                                    docker compose -f compose.yaml up -d --build
                                    
                                    BUILD_EXIT_CODE=\$?
                                    if [ \$BUILD_EXIT_CODE -ne 0 ]; then
                                        echo \"ERROR: Docker build failed with exit code \$BUILD_EXIT_CODE\"
                                        exit \$BUILD_EXIT_CODE
                                    fi &&
                                    
                                    echo \"Docker containers rebuilt successfully!\" &&

                                    echo \"Cleaning up unused Docker images...\"
                                    docker image prune -f &&

                                    set +x
                                "
                            ''', returnStatus: true)
                            
                            // Check if build failed and stop pipeline
                            if (buildResult != 0) {
                                error "Docker build failed with exit code ${buildResult}. Stopping pipeline."
                            }
                            
                            echo "Build completed successfully!"
                        }
                    }
                }
            }
            
            post {
                failure {
                    script {
                        echo "❌ Docker build stage failed!"
                        echo "Build artifacts and logs available for debugging."
                    }
                }
            }
        }

        stage('Run Migrations') {
            steps {
                script {
                    ws("${env.CUSTOM_WORKSPACE}") {
                        sshagent([env.sshCredentialId]) {
                            sh '''
                                ssh -o StrictHostKeyChecking=no -p $DEPLOY_PORT $DEPLOY_USER@$DEPLOY_HOST "
                                    cd $DEPLOY_PATH &&
                                    echo 'Setting permissions for temp storage...' &&
                                    
                                    docker compose exec -T $DOCKER_SERVICE_NAME sh $MIGRATION_SCRIPT &&
                                    
                                    echo 'Migration script executed successfully!'
                                "
                            '''
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                try {
                    echo "Sending build notification to Discord..."
                    postNotification()
                } catch (Exception e) {
                    echo "Warning: Failed to send notification: ${e.getMessage()}"
                }

                try {
                    echo "Cleaning up workspace..."
                    cleanupWorkspaceWithNginxRestart(DOCKER_SERVICE_NGINX, env.sshCredentialId)
                } catch (Exception e) {
                    echo "Warning: Failed to cleanup workspace: ${e.getMessage()}"
                }
            }
        }
    }
}