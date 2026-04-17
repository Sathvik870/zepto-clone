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
        stage('Update GitOps Repo') {
            steps {
                withCredentials([usernamePassword(
                credentialsId: 'github-creds',
                usernameVariable: 'GIT_USER',
                passwordVariable: 'GIT_PASS'
            )]) {
                sh '''
                git config --global user.name "jenkins"
                git config --global user.email "jenkins@local"

                rm -rf temp-repo
                git clone https://$GIT_USER:$GIT_PASS@github.com/Sathvik870/zepto-clone.git temp-repo

                cd temp-repo

               sed -i "s|image: .*|image: sathvikayyasamy/zepto-backend:latest|" k8s/deployment.yaml

               git add .
               git commit -m "Auto update image from Jenkins"
               git push
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
