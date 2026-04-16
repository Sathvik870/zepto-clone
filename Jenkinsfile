pipeline {
    agent any

    environment {
        IMAGE_NAME = "sathvikayyasamy/zepto-backend"
    }

    stages {

        stage('Install Dependencies') {
 	    agent {
               docker {
                  image 'node:20'
               }
            }
            steps {
               dir('backend') {
                  sh 'npm install'
               }
            }
        }

        stage('Run Tests') {
            agent {
               docker {
                  image 'node:20'
               }
            }
            steps {
               dir('backend') {
                  sh 'npm test'
               }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('backend') {
                    sh 'docker build -t $IMAGE_NAME:latest .'
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'USERNAME',
                    passwordVariable: 'PASSWORD'
                )]) {
                    sh '''
                    echo $PASSWORD | docker login -u $USERNAME --password-stdin
                    docker push $IMAGE_NAME:latest
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully 🚀'
        }
        failure {
            echo 'Pipeline failed ❌ Check logs immediately'
        }
    }
}
