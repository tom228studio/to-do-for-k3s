pipeline {
    agent any

    environment {
        DOCKER_CONFIG = '/DATA/AppData/actions-runner/.docker' // Если Jenkins работает на ZimaOS
        DOCKER_HUB_REPO = 't0mst'
    }

    stages {
        stage('Checkout') {
            steps {
                // 1. Сначала скачиваем код. После этого шага переменная env.GIT_COMMIT станет доступна!
                checkout scm
            }
        }

        stage('Build & Push Backend') {
            steps {
                script {
                    // Берем первые 7 символов из полного хеша коммита (аналог --short)
                    def shortCommit = env.GIT_COMMIT.take(7)
                    
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-credentials') {
                        // Собираем образ
                        def backendImage = docker.build("${DOCKER_HUB_REPO}/backend:${shortCommit}", "./backend")
                        
                        // Пушим с коротким хешем
                        backendImage.push()
                        // Пушим с тегом latest
                        backendImage.push('latest')
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                script {
                    def shortCommit = env.GIT_COMMIT.take(7)
                    
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-credentials') {
                        def frontendImage = docker.build("${DOCKER_HUB_REPO}/frontend:${shortCommit}", "./frontend")
                        
                        frontendImage.push()
                        frontendImage.push('latest')
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Пайплайн завершен.'
        }
        failure {
            echo '❌ Сборка не удалась! Проверьте логи выше.'
        }
    }
}