pipeline {
    agent any

    environment {
        // Указываем безопасную папку для конфигов Docker внутри контейнера Jenkins
        DOCKER_CONFIG = "${WORKSPACE}/.docker"
        
        DOCKER_HUB_REPO = 't0mst'
    }

    stages {
        stage('Checkout') {
            steps {
                // Скачиваем код из GitHub
                checkout scm
            }
        }

        stage('Build & Push Backend') {
            steps {
                script {
                    // Берем первые 7 символов хеша коммита
                    def shortCommit = env.GIT_COMMIT.take(7)
                    
                    // Безопасно подставляем логин и пароль из настроек Jenkins
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        sh """
                            echo "🔑 Логинимся в Docker Hub..."
                            echo "\$DOCKER_PASS" | docker login --username "\$DOCKER_USER" --password-stdin
                            
                            echo "📦 Собираем backend..."
                            docker build -t ${DOCKER_HUB_REPO}/backend:${shortCommit} -t ${DOCKER_HUB_REPO}/backend:latest ./backend
                            
                            echo "🚀 Пушим backend..."
                            docker push ${DOCKER_HUB_REPO}/backend:${shortCommit}
                            docker push ${DOCKER_HUB_REPO}/backend:latest
                        """
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                script {
                    def shortCommit = env.GIT_COMMIT.take(7)
                    
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        sh """
                            echo "🔑 Логинимся в Docker Hub..."
                            echo "\$DOCKER_PASS" | docker login --username "\$DOCKER_USER" --password-stdin
                            
                            echo "📦 Собираем frontend..."
                            docker build -t ${DOCKER_HUB_REPO}/frontend:${shortCommit} -t ${DOCKER_HUB_REPO}/frontend:latest ./frontend
                            
                            echo "🚀 Пушим frontend..."
                            docker push ${DOCKER_HUB_REPO}/frontend:${shortCommit}
                            docker push ${DOCKER_HUB_REPO}/frontend:latest
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                echo '✅ Сборка успешна! Сообщаем GitHub...'
                githubNotify context: 'jenkins-ci', description: 'Образы успешно собраны и отправлены', status: 'SUCCESS', targetUrl: env.BUILD_URL
            }
        }
        failure {
            script {
                echo '❌ Сборка провалилась! Сообщаем GitHub...'
                githubNotify context: 'jenkins-ci', description: 'Ошибка в процессе сборки', status: 'FAILURE', targetUrl: env.BUILD_URL
            }
        }
        always {
            script {
                echo '🧹 Очистка временных файлов...'
                sh 'rm -rf ${WORKSPACE}/.docker || true'
            }
        }
    }
}