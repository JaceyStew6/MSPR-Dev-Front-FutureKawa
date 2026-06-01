pipeline {
  agent any

  environment {
    IMAGE_NAME = 'futurekawa-frontend'
    NODE_VERSION = '22'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Lint') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Test') {
      steps {
        sh 'npm run test:unit -- --reporter=verbose --reporter=junit --outputFile=test-results.xml'
      }
      post {
        always {
          junit 'test-results.xml'
        }
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Docker Build') {
      steps {
        sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest ."
      }
    }

    stage('Archive') {
      steps {
        archiveArtifacts artifacts: 'dist/**', fingerprint: true
      }
    }
  }

  post {
    failure {
      echo 'Build échoué - vérifier les logs'
    }
    success {
      echo "Build ${BUILD_NUMBER} réussi - image Docker : ${IMAGE_NAME}:${BUILD_NUMBER}"
    }
  }
}
