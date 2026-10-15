pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    stages {

        stage('Clone Repository') {
            steps {
                checkout scm
            }
        }

        stage('Stop Old Containers') {
            steps {
                sh '''
                    # Stop current project containers
                    docker compose down || true

                    # Stop demo-micro project containers (free up ports)
                    docker compose -p demo-micro down || true

                    # Kill any remaining containers using our ports
                    docker ps -q --filter "publish=3000" | xargs -r docker stop || true
                    docker ps -q --filter "publish=3008" | xargs -r docker stop || true
                    docker ps -q --filter "publish=5173" | xargs -r docker stop || true

                    echo "All old containers stopped"
                '''
            }
        }

        stage('Build Containers') {
            steps {
                sh '''
                    docker compose build
                '''
            }
        }

        stage('Run Containers') {
            steps {
                sh '''
                    docker compose up -d
                '''
            }
        }

        stage('Check Running Containers') {
            steps {
                sh '''
                    docker ps
                '''
            }
        }
    }

    post {

        success {
            echo 'Project Running Successfully!'
        }

        failure {
            echo 'Pipeline Failed!'
        }
    }
}
