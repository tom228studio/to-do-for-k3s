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
                echo '✅ Сборка успешна! Сообщаем GitHub через API...'
                withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                    sh """
                        curl -s -X POST \\
                        -H "Authorization: token \$GITHUB_PAT" \\
                        -H "Accept: application/vnd.github.v3+json" \\
                        https://api.github.com/repos/tom228studio/to-do-for-k3s/statuses/${env.GIT_COMMIT} \\
                        -d '{"state":"success", "description":"Jenkins сборка успешна", "context":"jenkins-ci", "target_url":"${env.BUILD_URL}"}'
                    """
                }
            }
        }
        failure {
            script {
                echo '❌ Сборка провалилась! Сообщаем GitHub через API...'
                withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                    sh """
                        curl -s -X POST \\
                        -H "Authorization: token \$GITHUB_PAT" \\
                        -H "Accept: application/vnd.github.v3+json" \\
                        https://api.github.com/repos/tom228studio/to-do-for-k3s/statuses/${env.GIT_COMMIT} \\
                        -d '{"state":"failure", "description":"Ошибка в Jenkins", "context":"jenkins-ci", "target_url":"${env.BUILD_URL}"}'
                    """
                }
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