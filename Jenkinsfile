pipeline {
    agent any

    environment {
        DOCKER_CONFIG = "${WORKSPACE}/.docker"
        DOCKER_HUB_REPO = 't0mst'
        GITHUB_REPO = 'tom228studio/to-do-for-k3s'
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Build & Push Backend') {
            steps {
                script {
                    // Сохраняем короткий хеш в глобальную переменную окружения
                    env.SHORT_COMMIT = env.GIT_COMMIT.take(7)
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        sh """
                            echo "\$DOCKER_PASS" | docker login --username "\$DOCKER_USER" --password-stdin
                            docker build -t ${DOCKER_HUB_REPO}/backend:${env.SHORT_COMMIT} -t ${DOCKER_HUB_REPO}/backend:latest ./backend
                            docker push ${DOCKER_HUB_REPO}/backend:${env.SHORT_COMMIT}
                            docker push ${DOCKER_HUB_REPO}/backend:latest
                        """
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        sh """
                            echo "\$DOCKER_PASS" | docker login --username "\$DOCKER_USER" --password-stdin
                            docker build -t ${DOCKER_HUB_REPO}/frontend:${env.SHORT_COMMIT} -t ${DOCKER_HUB_REPO}/frontend:latest ./frontend
                            docker push ${DOCKER_HUB_REPO}/frontend:${env.SHORT_COMMIT}
                            docker push ${DOCKER_HUB_REPO}/frontend:latest
                        """
                    }
                }
            }
        }
        
        // ❌ УДАЛИЛИ stage('Update Git Manifests') отсюда, чтобы не пушить в dev!
    }

    post {
        success {
            script {
                echo '✅ Сборка успешна!'
                withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                    
                    // 🔄 НОВАЯ ЛОГИКА: Сначала мержим, потом обновляем YAML в main
                    echo '🔄 Вливаем dev в main и обновляем манифесты...'
                    sh """
                        git config user.email "jenkins@tom228studio.com"
                        git config user.name "Jenkins CI"
                        git remote set-url origin https://x-access-token:\${GITHUB_PAT}@github.com/${GITHUB_REPO}.git
                        git fetch origin
                        
                        # 1. Переключаемся на main и мержим dev
                        git checkout -B main origin/main
                        git merge origin/dev --no-ff -m "chore: auto-merge dev into main"
                        
                        # 2. Теперь обновляем YAML уже в ветке main
                        sed -i 's|image: t0mst/frontend:.*|image: t0mst/frontend:${env.SHORT_COMMIT}|' k8s/*.yaml
                        sed -i 's|image: t0mst/backend:.*|image: t0mst/backend:${env.SHORT_COMMIT}|' k8s/*.yaml
                        
                        git add k8s/
                        if ! git diff --staged --quiet; then
                            git commit -m "chore: update images to ${env.SHORT_COMMIT} in main"
                            git push origin main
                            echo "✅ YAML обновлен и отправлен в main!"
                        else
                            echo "ℹ️ Изменений в YAML нет."
                        fi
                    """
                    
                    // Обновляем статус в GitHub
                    sh """
                        curl -s -X POST -H "Authorization: token \$GITHUB_PAT" -H "Accept: application/vnd.github.v3+json" \\
                        https://api.github.com/repos/${GITHUB_REPO}/statuses/${env.GIT_COMMIT} \\
                        -d '{"state":"success", "description":"Jenkins OK", "context":"jenkins-ci", "target_url":"${env.BUILD_URL}"}'
                    """
                }
            }
        }
        failure {
            script {
                echo '❌ Сборка провалилась!'
                withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                    sh """
                        curl -s -X POST -H "Authorization: token \$GITHUB_PAT" -H "Accept: application/vnd.github.v3+json" \\
                        https://api.github.com/repos/${GITHUB_REPO}/statuses/${env.GIT_COMMIT} \\
                        -d '{"state":"failure", "description":"Jenkins Failed", "context":"jenkins-ci", "target_url":"${env.BUILD_URL}"}'
                    """
                }
            }
        }
        always {
            script {
                sh 'rm -rf ${WORKSPACE}/.docker || true'
            }
        }
    }
}