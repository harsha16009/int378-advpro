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
                    docker compose down || true
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
