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
                    env.SHORT_COMMIT = env.GIT_COMMIT.take(7) // Делаем переменную глобальной для пайплайна
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

        // 🆕 НОВЫЙ ЭТАП: Обновляем YAML в Git
        stage('Update Git Manifests') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                        sh """
                            echo "📝 Обновляем теги образов в YAML..."
                            
                            # ВАЖНО: Замени 'твой_файл.yaml' на реальное имя файла в папке k8s!
                            # Если у тебя все в одном файле, укажи его. Если в разных, продублируй строку.
                            # Например: k8s/deployments.yaml или k8s/frontend.yaml
                            
                            sed -i 's|image: t0mst/frontend:.*|image: t0mst/frontend:${env.SHORT_COMMIT}|' k8s/*.yaml
                            sed -i 's|image: t0mst/backend:.*|image: t0mst/backend:${env.SHORT_COMMIT}|' k8s/*.yaml
                            
                            git config user.email "jenkins@tom228studio.com"
                            git config user.name "Jenkins CI"
                            git remote set-url origin https://x-access-token:\${GITHUB_PAT}@github.com/${GITHUB_REPO}.git
                            
                            git add k8s/
                            if ! git diff --staged --quiet; then
                                git commit -m "chore: update images to ${env.SHORT_COMMIT} [skip ci]"
                                git push origin HEAD:dev
                                echo "✅ YAML обновлен и отправлен в dev!"
                            else
                                echo "ℹ️ Изменений в YAML нет."
                            fi
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                echo '✅ Сборка успешна!'
                withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                    // Обновляем статус в GitHub
                    sh """
                        curl -s -X POST -H "Authorization: token \$GITHUB_PAT" -H "Accept: application/vnd.github.v3+json" \\
                        https://api.github.com/repos/${GITHUB_REPO}/statuses/${env.GIT_COMMIT} \\
                        -d '{"state":"success", "description":"Jenkins OK", "context":"jenkins-ci", "target_url":"${env.BUILD_URL}"}'
                    """
                    
                    // Мержим dev в main (без проверок ветки, раз эта задача для dev)
                    echo '🔄 Вливаем dev в main...'
                    sh """
                        git config user.email "jenkins@tom228studio.com"
                        git config user.name "Jenkins CI"
                        git remote set-url origin https://x-access-token:\${GITHUB_PAT}@github.com/${GITHUB_REPO}.git
                        git fetch origin
                        git checkout -B main origin/main
                        git merge origin/dev --no-ff -m "chore: auto-merge dev into main [skip ci]"
                        git push origin main
                        echo '✅ Успешно влито в main!'
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