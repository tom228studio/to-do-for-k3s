pipeline {
    agent any

    environment {
        // Указываем безопасную папку для конфигов Docker внутри контейнера Jenkins
        DOCKER_CONFIG = "${WORKSPACE}/.docker"
        DOCKER_HUB_REPO = 't0mst'
        GITHUB_REPO = 'tom228studio/to-do-for-k3s'
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
                    def shortCommit = env.GIT_COMMIT.take(7)
                    
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
                    // 1. Обновляем статус коммита в GitHub
                    sh """
                        curl -s -X POST \\
                        -H "Authorization: token \$GITHUB_PAT" \\
                        -H "Accept: application/vnd.github.v3+json" \\
                        https://api.github.com/repos/${GITHUB_REPO}/statuses/${env.GIT_COMMIT} \\
                        -d '{"state":"success", "description":"Jenkins сборка успешна", "context":"jenkins-ci", "target_url":"${env.BUILD_URL}"}'
                    """
                    
                     // 2. Проверяем ветку надежным способом
                    // Собираем имя ветки из всех возможных переменных, а если их нет — спрашиваем у git
                    def rawBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    
                    // Очищаем имя ветки от мусора вроде 'origin/', '*/' или 'refs/heads/'
                    def cleanBranch = rawBranch.replaceAll('^(\\*/|refs/heads/|origin/)', '').trim()
                    
                    echo "🔍 Определена ветка: '${cleanBranch}' (сырое значение: '${rawBranch}')"

                    if (cleanBranch == 'dev') {
                        echo '🔄 Ветка dev прошла проверку. Выполняем слияние в main...'
                        
                        sh """
                            # Настраиваем git для коммита от имени Jenkins
                            git config user.email "jenkins@tom228studio.com"
                            git config user.name "Jenkins CI"
                            
                            # Добавляем токен в URL для авторизации пуша
                            git remote set-url origin https://x-access-token:\${GITHUB_PAT}@github.com/${GITHUB_REPO}.git
                            
                            # Получаем актуальные данные с удаленного репозитория
                            git fetch origin
                            
                            # Переключаемся на main (синхронизируем с удаленным) 
                            git checkout -B main origin/main
                            
                            # Мержим dev в main. 
                            git merge origin/dev --no-ff -m "chore: auto-merge dev into main [skip ci]"
                            
                            # Пушим изменения в main
                            git push origin main
                            
                            echo '✅ Успешно влито в main!'
                        """
                    } else {
                        echo "ℹ️ Текущая ветка: '${cleanBranch}'. Пропускаем слияние в main (только для dev)."
                    }
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
                        https://api.github.com/repos/${GITHUB_REPO}/statuses/${env.GIT_COMMIT} \\
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