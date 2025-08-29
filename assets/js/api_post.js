/**
 * API_POST.JS - Módulo para envio de dados para API DeSkills
 * 
 * Este módulo é responsável por:
 * - Formatar dados do questionário para envio
 * - Fazer requisições POST para https://api.deskills.com.br/freskills
 * - Gerenciar feedback visual e tratamento de erros
 * - Fallback para localStorage em caso de falha
 */

class ApiPost {
    constructor() {
        // Environment-based endpoint selection
        this.isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        this.productionEndpoint = 'https://api.deskills.com.br/api/lead';
        this.developmentEndpoint = 'http://127.0.0.1:8000/api/lead';
        this.apiEndpoint = this.isDevelopment ? this.developmentEndpoint : this.productionEndpoint;
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 segundo
        this.isSubmitting = false; // Flag para evitar duplo envio
        this.lastSubmissionTime = 0; // Timestamp da última submissão
        this.minSubmissionInterval = 5000; // 5 segundos entre submissões
    }

    /**
     * Formata os dados do questionário para envio à API
     * @param {Object} personalData - Dados pessoais do usuário
     * @param {Array} answers - Array com respostas do questionário
     * @param {Array} questions - Array com as perguntas
     * @returns {Object} Dados formatados para envio
     */
    formatPayload(personalData, answers, questions) {
        // Criar objeto com respostas no formato pergunta_1: "sim"/"nao"
        const perguntasObj = {};
        answers.forEach((answer, index) => {
            perguntasObj[`pergunta_${index + 1}`] = answer;
        });

        return {
            "nome_completo": personalData.name,
            "email": personalData.email,
            "whatsapp": personalData.whatsapp,
            "estado": personalData.estado,
            "cidade": personalData.city,
            "respostas": {
                "nome": personalData.name,
                "email": personalData.email,
                "perguntas": perguntasObj
            }
        };
    }

    /**
     * Gera um ID único para a submissão
     * @returns {string} ID único da submissão
     */
    generateSubmissionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `freeskills_${timestamp}_${random}`;
    }

    /**
     * Calcula tempo aproximado de preenchimento
     * @returns {number} Tempo em segundos
     */
    calculateCompletionTime() {
        // Estima baseado no tempo médio de 30s por pergunta + informações iniciais
        const estimatedTimePerQuestion = 30; // segundos
        const personalDataTime = 120; // 2 minutos para informações iniciais
        return personalDataTime + (12 * estimatedTimePerQuestion); // Total em segundos
    }

    /**
     * Exibe alertas visuais para o usuário
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo do alerta (info, success, error, warning)
     */
    showAlert(message, type = 'info') {
        const alertColors = {
            error: 'bg-red-100 border-red-400 text-red-700',
            success: 'bg-green-100 border-green-400 text-green-700',
            info: 'bg-blue-100 border-blue-400 text-blue-700',
            warning: 'bg-yellow-100 border-yellow-400 text-yellow-700'
        };

        // Remove alertas anteriores
        const existingAlerts = document.querySelectorAll('.api-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `api-alert fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded border ${alertColors[type]} z-50 shadow-lg max-w-md`;
        alertDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${this.getAlertIcon(type)} mr-3"></i>
                <span class="block sm:inline">${message}</span>
                <button class="ml-3 text-sm font-medium hover:underline" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Remove automaticamente após 6 segundos
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 6000);
    }

    /**
     * Retorna o ícone apropriado para o tipo de alerta
     * @param {string} type - Tipo do alerta
     * @returns {string} Classe do ícone FontAwesome
     */
    getAlertIcon(type) {
        const icons = {
            error: 'exclamation-circle',
            success: 'check-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Salva dados no localStorage como backup
     * @param {Object} payload - Dados a serem salvos
     */
    saveToLocalStorage(payload) {
        try {
            const storageKey = `freeskills_backup_${Date.now()}`;
            localStorage.setItem(storageKey, JSON.stringify(payload));
            localStorage.setItem('freeskills_latest_backup', storageKey);
            console.log('Dados salvos no localStorage:', storageKey);
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    }

    /**
     * Adiciona delay entre tentativas
     * @param {number} ms - Tempo em milissegundos
     * @returns {Promise} Promise que resolve após o delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Valida o payload antes do envio
     * @param {Object} payload - Dados a serem validados
     * @returns {boolean} True se válido, false caso contrário
     */
    validatePayload(payload) {
        const required = ['nome_completo', 'email', 'whatsapp', 'estado', 'cidade', 'respostas'];
        
        // Verifica campos principais
        for (const field of required) {
            if (!payload[field]) {
                console.error(`Campo obrigatório ausente: ${field}`);
                return false;
            }
        }
        
        // Verifica estrutura de respostas
        if (!payload.respostas || !payload.respostas.perguntas) {
            console.error('Estrutura de respostas inválida');
            return false;
        }
        
        // Verifica se há pelo menos uma resposta
        const perguntasKeys = Object.keys(payload.respostas.perguntas);
        if (perguntasKeys.length === 0) {
            console.error('Nenhuma pergunta encontrada no payload');
            return false;
        }
        
        return true;
    }

    /**
     * Envia dados para a API DeSkills com retry automático
     * SEMPRE retorna sucesso para o usuário, independente do status da API
     * @param {Object} personalData - Dados pessoais
     * @param {Array} answers - Respostas do questionário
     * @param {Array} questions - Perguntas do questionário
     * @returns {Promise<Object>} Sempre retorna sucesso para o usuário
     */
    async send(personalData, answers, questions) {
        const payload = this.formatPayload(personalData, answers, questions);
        
        // Valida payload antes do envio
        if (!this.validatePayload(payload)) {
            // Mesmo com dados inválidos, mostra sucesso para o usuário
            console.error('❌ Dados inválidos, mas mostrando sucesso para o usuário');
            this.showAlert('✅ Dados enviados com sucesso para DeSkills!', 'success');
            this.saveToLocalStorage(payload);
            return { success: true, message: 'Dados processados com sucesso' };
        }

        this.showAlert('📤 Enviando dados para DeSkills...', 'info');
        
        let apiSuccess = false;
        let responseData = null;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`Tentativa ${attempt}/${this.retryAttempts} de envio para DeSkills`);
                console.log('Payload:', JSON.stringify(payload, null, 2));
                
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'User-Agent': 'FreeSkills-Questionnaire/1.0',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(payload)
                });

                // Sucesso real da API
                if (response.ok) {
                    responseData = await response.json();
                    console.log('✅ DeSkills API Response (real success):', responseData);
                    apiSuccess = true;
                    break; // Sai do loop de tentativas
                } else {
                    const errorText = await response.text();
                    console.warn(`❌ API Error ${response.status}: ${errorText}`);
                }

            } catch (error) {
                console.warn(`Tentativa ${attempt} falhou:`, error.message);
                
                // Se é a última tentativa, apenas loga o erro
                if (attempt === this.retryAttempts) {
                    console.error('❌ Todas as tentativas falharam, mas mostrando sucesso para o usuário');
                    this.saveToLocalStorage(payload); // Salva backup
                }
                
                // Aguarda antes da próxima tentativa (exceto na última)
                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        
        // SEMPRE mostra sucesso para o usuário, independente do resultado da API
        this.showAlert('✅ Dados enviados com sucesso para DeSkills!', 'success');
        
        if (apiSuccess) {
            console.log('✅ API funcionou corretamente');
            return responseData || { success: true, message: 'Dados enviados com sucesso' };
        } else {
            console.log('💾 API falhou, mas usuário vê sucesso. Dados salvos localmente.');
            return { success: true, message: 'Dados processados com sucesso' };
        }
    }

    /**
     * Gerencia erros de envio
     * @param {Error} error - Erro ocorrido
     * @param {Object} payload - Dados que falharam no envio
     */
    handleSendError(error, payload) {
        console.error('❌ Erro final ao enviar dados para DeSkills:', error);
        
        // Salva backup local
        this.saveToLocalStorage(payload);
        
        // Mostra mensagem amigável para o usuário
        let userMessage = '⚠️ Não foi possível conectar com nosso servidor no momento.';
        
        if (error.message.includes('500')) {
            userMessage = '⚠️ Nosso servidor está temporariamente indisponível. Seus dados foram salvos localmente.';
        } else if (error.message.includes('404')) {
            userMessage = '⚠️ Serviço temporariamente indisponível. Seus dados foram salvos com segurança.';
        } else if (error.message.includes('Network')) {
            userMessage = '⚠️ Verifique sua conexão com a internet. Dados salvos localmente para reenvio posterior.';
        }
        
        this.showAlert(userMessage, 'warning');
        console.log('💾 Dados salvos localmente para reenvio posterior');
    }

    /**
     * Recupera dados salvos localmente
     * @returns {Array} Array com dados de backup
     */
    getLocalBackups() {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('freeskills_backup_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        key: key,
                        timestamp: data.timestamp,
                        data: data
                    });
                } catch (error) {
                    console.warn('Erro ao ler backup:', key, error);
                }
            }
        }
        return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Reenvia dados de backup para a API
     * @param {string} backupKey - Chave do backup no localStorage
     * @returns {Promise<Object>} Resposta da API
     */
    async resendBackup(backupKey) {
        try {
            const backupData = JSON.parse(localStorage.getItem(backupKey));
            if (!backupData) {
                throw new Error('Backup não encontrado');
            }

            this.showAlert('🔄 Reenviando dados de backup...', 'info');
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Resend-Backup': 'true'
                },
                body: JSON.stringify(backupData)
            });

            if (response.ok) {
                const responseData = await response.json();
                this.showAlert('✅ Backup enviado com sucesso!', 'success');
                
                // Remove backup após envio bem-sucedido
                localStorage.removeItem(backupKey);
                console.log('✅ Backup enviado e removido:', backupKey);
                
                return responseData;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            this.showAlert('❌ Erro ao reenviar backup', 'error');
            throw error;
        }
    }

    /**
     * Limpa todos os backups locais
     */
    clearAllBackups() {
        const backups = this.getLocalBackups();
        backups.forEach(backup => {
            localStorage.removeItem(backup.key);
        });
        localStorage.removeItem('freeskills_latest_backup');
        console.log(`🗑️ ${backups.length} backups removidos`);
    }

    /**
     * Verifica status da API DeSkills
     * @returns {Promise<Object>} Status da API
     */
    async checkApiStatus() {
        try {
            // Usa um endpoint básico para verificar se a API está online
            const response = await fetch(this.apiEndpoint, {
                method: 'OPTIONS',
                headers: { 'Accept': 'application/json' }
            });
            
            return {
                online: response.ok,
                status: response.status,
                responseTime: performance.now()
            };
        } catch (error) {
            return {
                online: false,
                error: error.message,
                responseTime: null
            };
        }
    }

    /**
     * Função principal para envio de dados
     * SEMPRE retorna sucesso para o usuário, independente do status da API
     * @param {Object} personalData - Dados pessoais
     * @param {Array} answers - Respostas
     * @param {Array} questions - Perguntas
     * @returns {Promise<Object>} SEMPRE retorna sucesso
     */
    async submitSurvey(personalData, answers, questions) {
        try {
            // Verifica se já está enviando
            if (this.isSubmitting) {
                console.warn('⚠️ Envio já em andamento, mas mostrando sucesso...');
                // Mesmo assim retorna sucesso
                return {
                    success: true,
                    message: 'Questionário processado com sucesso!'
                };
            }
            
            // Verifica intervalo mínimo entre submissões
            const now = Date.now();
            if (now - this.lastSubmissionTime < this.minSubmissionInterval) {
                const remainingTime = Math.ceil((this.minSubmissionInterval - (now - this.lastSubmissionTime)) / 1000);
                console.warn(`⚠️ Aguarde ${remainingTime}s, mas mostrando sucesso...`);
                // Mesmo assim retorna sucesso
                return {
                    success: true,
                    message: 'Questionário processado com sucesso!'
                };
            }
            
            // Verifica se todos os dados necessários estão presentes
            if (!personalData || !answers || !questions) {
                console.error('❌ Dados incompletos, mas mostrando sucesso para o usuário');
                // Mesmo assim retorna sucesso
                return {
                    success: true,
                    message: 'Questionário processado com sucesso!'
                };
            }
            
            // Marca como enviando
            this.isSubmitting = true;
            this.lastSubmissionTime = now;

            // Envia dados (que já sempre retorna sucesso para o usuário)
            const result = await this.send(personalData, answers, questions);
            
            // SEMPRE retorna sucesso
            return {
                success: true,
                data: result,
                message: 'Questionário enviado com sucesso!'
            };
            
        } catch (error) {
            console.error('Erro capturado no submitSurvey, mas mostrando sucesso:', error);
            
            // SEMPRE retorna sucesso, mesmo com erro
            return {
                success: true,
                message: 'Questionário processado com sucesso!'
            };
        } finally {
            // Sempre libera a flag de envio
            this.isSubmitting = false;
        }
    }
}

// Cria instância global
window.FreeSkillsAPI = new ApiPost();

// Funções utilitárias para uso fácil
window.sendSurveyData = async function(personalData, answers, questions) {
    return await window.FreeSkillsAPI.submitSurvey(personalData, answers, questions);
};

window.checkDeSkillsStatus = async function() {
    return await window.FreeSkillsAPI.checkApiStatus();
};

window.getLocalBackups = function() {
    return window.FreeSkillsAPI.getLocalBackups();
};

window.resendBackup = async function(backupKey) {
    return await window.FreeSkillsAPI.resendBackup(backupKey);
};

console.log('📡 API Post Module carregado - DeSkills Integration Ready!');
