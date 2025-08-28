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
        this.productionEndpoint = 'https://api.deskilss/api';
        this.developmentEndpoint = 'http://127.0.0.1:8000/api/lead';
        this.apiEndpoint = this.isDevelopment ? this.developmentEndpoint : this.productionEndpoint;
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 segundo
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
        // Estima baseado no tempo médio de 30s por pergunta + dados pessoais
        const estimatedTimePerQuestion = 30; // segundos
        const personalDataTime = 120; // 2 minutos para dados pessoais
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
     * @param {Object} personalData - Dados pessoais
     * @param {Array} answers - Respostas do questionário
     * @param {Array} questions - Perguntas do questionário
     * @returns {Promise<Object>} Resposta da API ou erro
     */
    async send(personalData, answers, questions) {
        const payload = this.formatPayload(personalData, answers, questions);
        
        // Valida payload antes do envio
        if (!this.validatePayload(payload)) {
            throw new Error('Dados inválidos para envio');
        }

        this.showAlert('📤 Enviando dados para DeSkills...', 'info');
        
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

                // Sucesso
                if (response.ok) {
                    const responseData = await response.json();
                    this.showAlert('✅ Dados enviados com sucesso para DeSkills!', 'success');
                    console.log('✅ DeSkills API Response:', responseData);
                    return responseData;
                }

                // Erro HTTP
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);

            } catch (error) {
                console.warn(`Tentativa ${attempt} falhou:`, error.message);
                
                // Se é a última tentativa, lança o erro
                if (attempt === this.retryAttempts) {
                    this.handleSendError(error, payload);
                    throw error;
                }
                
                // Aguarda antes da próxima tentativa
                this.showAlert(`⚠️ Tentativa ${attempt} falhou, tentando novamente...`, 'warning');
                await this.delay(this.retryDelay * attempt);
            }
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
        
        // Determina tipo de erro e mensagem apropriada
        let errorMessage = '❌ Erro ao enviar dados. ';
        
        if (error.name === 'TypeError' || error.message.includes('fetch')) {
            errorMessage += 'Verifique sua conexão com a internet.';
        } else if (error.message.includes('400')) {
            errorMessage += 'Dados inválidos enviados.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage += 'Erro de autorização na API.';
        } else if (error.message.includes('500')) {
            errorMessage += 'Erro interno do servidor DeSkills.';
        } else {
            errorMessage += 'Erro desconhecido.';
        }
        
        errorMessage += ' Dados salvos localmente.';
        this.showAlert(errorMessage, 'error');
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
            const response = await fetch(this.apiEndpoint.replace('/freskills', '/health'), {
                method: 'GET',
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
     * @param {Object} personalData - Dados pessoais
     * @param {Array} answers - Respostas
     * @param {Array} questions - Perguntas
     * @returns {Promise<Object>} Resultado do envio
     */
    async submitSurvey(personalData, answers, questions) {
        try {
            // Verifica se todos os dados necessários estão presentes
            if (!personalData || !answers || !questions) {
                throw new Error('Dados incompletos para envio');
            }

            // Envia dados
            const result = await this.send(personalData, answers, questions);
            
            return {
                success: true,
                data: result,
                message: 'Questionário enviado com sucesso!'
            };
            
        } catch (error) {
            console.error('Erro no envio do questionário:', error);
            
            return {
                success: false,
                error: error.message,
                message: 'Erro ao enviar questionário. Dados salvos localmente.'
            };
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
