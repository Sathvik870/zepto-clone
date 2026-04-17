pipeline {
    agent any

    environment {
        IMAGE_NAME = "sathvikayyasamy/zepto-backend"
        IMAGE_TAG = "${BUILD_NUMBER}"
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

	stage('Code Quality - SonarQube') {
            agent {
                docker {
                    image 'sonarsource/sonar-scanner-cli:latest'
		}
	    }
            steps {
                dir('backend') {
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                       sh '''
                       sonar-scanner \
                       -Dsonar.projectKey=zepto \
                       -Dsonar.sources=. \
                       -Dsonar.host.url=http://192.168.49.1:9000 \
                       -Dsonar.login=$SONAR_TOKEN
                       '''
		    }
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
                    sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG .'
                }
            }
        }

	stage('Security Scan - Trivy') {
            steps {
               sh '''
               docker run --rm \
               -v /var/run/docker.sock:/var/run/docker.sock \
               aquasec/trivy image --exit-code 1 --severity CRITICAL $IMAGE_NAME:$IMAGE_TAG
               '''
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
                    docker push $IMAGE_NAME:$IMAGE_TAG
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

               sed -i "s|image: .*|image: $IMAGE_NAME:$IMAGE_TAG|g" k8s/deployment.yaml

               git add .
               git commit -m "Update image to $IMAGE_TAG"
               git push origin main
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
