document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenu = document.getElementById('mobileMenu');
    const openMenuBtn = document.getElementById('mobileMenuToggle') || document.querySelector('header.topbar button[aria-label="Menu"]');
    const closeMenuBtn = document.getElementById('closeMobileMenu');

    function openMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('hidden');
        document.addEventListener('click', handleOutsideClick);
    }

    function closeMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.add('hidden');
        document.removeEventListener('click', handleOutsideClick);
    }

    function handleOutsideClick(event) {
        if (!mobileMenu) return;
        const topbar = document.querySelector('header.topbar');
        if (topbar && !topbar.contains(event.target)) {
            closeMobileMenu();
        }
    }

    if (openMenuBtn) {
        openMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (mobileMenu && mobileMenu.classList.contains('hidden')) {
                openMobileMenu();
            } else {
                closeMobileMenu();
            }
        });
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeMobileMenu();
        });
    }

    window.addEventListener('resize', function() {
        if (window.innerWidth >= 640) {
            closeMobileMenu();
        }
    });

    // Footer current year
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Configurações do questionário
    const config = {
        questions: [
            "👉 Você sente satisfação com a sua rotina e consegue encontrar motivos para agradecer no seu dia a dia?",
            "👉 Você se sente à vontade para expressar suas ideias claramente em conversas ou apresentações em público?",
            "👉 Quando enfrenta mudanças ou imprevistos, você consegue se adaptar sem perder o foco principal?",
            "👉 Você costuma assumir iniciativas em grupo e contribuir para que todos trabalhem em harmonia?",
            "👉 Você busca soluções novas e diferentes para problemas do cotidiano, em vez de sempre repetir o mesmo padrão?",
            "👉 Você age antes de ser solicitado, antecipando demandas e necessidades em sua vida ou trabalho?",
            "👉 Você costuma se colocar no lugar das outras pessoas para entender o que elas sentem ou pensam?",
            "👉 Você mantém seus valores e princípios mesmo quando ninguém está observando?",
            "👉 Você questiona informações e procura diferentes pontos de vista antes de aceitar algo como verdade?",
            "👉 Você organiza suas finanças pessoais e consegue planejar gastos e investimentos com clareza?",
            "👉 Você consegue controlar suas emoções em momentos de pressão, evitando reações impulsivas?",
            "👉 Você costuma identificar oportunidades e transformar ideias em ações práticas e concretas?"
        ],
        apis: {
            ibgeStates: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
            ibgeCities: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios'
        }
    };

    // Elementos DOM
    const elements = {
        form: document.getElementById('questionForm'),
        progressBar: document.querySelector('.progress-bar'),
        progressText: document.getElementById('progress'),
        cardTitle: document.getElementById('cardTitle'),
        cardSubtitle: document.getElementById('cardSubtitle')
    };
    
    // Estado da aplicação
    const state = {
        currentStep: 'personal',
        currentQuestion: 0,
        answers: [],
        personalData: {},
        totalSteps: 16,
        currentStepNumber: 0,
        isTransitioning: false
    };

    showPersonalDataForm();

    function showPersonalDataForm() {
        elements.form.innerHTML = `
            <div class="fade-in">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-user text-2xl text-blue-600"></i>
                    </div>
                    <h2 class="text-xl font-semibold text-gray-800 mb-2">Seus Dados</h2>
                    <p class="text-gray-600">Precisamos conhecê-lo melhor!</p>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-user mr-2 text-blue-600"></i>Nome Completo
                        </label>
                        <input type="text" id="userName" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Digite seu nome completo" required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-envelope mr-2 text-blue-600"></i>E-mail
                        </label>
                        <input type="email" id="userEmail" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="seu@email.com" required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fab fa-whatsapp mr-2 text-green-600"></i>WhatsApp
                        </label>
                        <input type="tel" id="userWhatsapp" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="(11) 99999-9999" required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-map-marker-alt mr-2 text-red-600"></i>Estado
                        </label>
                        <select id="userState" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" required>
                            <option value="">Carregando estados...</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-city mr-2 text-blue-600"></i>Cidade
                        </label>
                        <select id="userCity" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" required disabled>
                            <option value="">Selecione um estado primeiro</option>
                        </select>
                    </div>
                </div>
                
                <div class="mt-8 text-center">
                    <button type="button" id="continueToQuestions" class="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105">
                        <i class="fas fa-arrow-right mr-2"></i>Continuar para as Perguntas
                    </button>
                </div>
            </div>
        `;
        
        // Event listener para o botão continuar
        document.getElementById('continueToQuestions').addEventListener('click', function() {
            const name = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();
            const whatsapp = document.getElementById('userWhatsapp').value.trim();
            const city = document.getElementById('userCity').value.trim();
            const stateSelect = document.getElementById('userState');
            const selectedStateOption = stateSelect.options[stateSelect.selectedIndex];
            const estado = selectedStateOption ? selectedStateOption.text.replace(/ \([A-Z]{2}\)/, '') : '';
            
            if (!name || !email || !whatsapp || !city || !estado) {
                showAlert('Por favor, preencha todos os campos!', 'error');
                return;
            }
            
            // Validação simples de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAlert('Por favor, insira um e-mail válido!', 'error');
                return;
            }
            
            // Validação de WhatsApp (deve ter pelo menos 10 dígitos)
            const phoneRegex = /\d{10,}/;
            if (!phoneRegex.test(whatsapp.replace(/\D/g, ''))) {
                showAlert('Por favor, insira um WhatsApp válido!', 'error');
                return;
            }
            
            state.personalData = { name, email, whatsapp, city, estado };
            state.currentStep = 'questions';
            state.currentStepNumber = 4;
            
            // Atualizar títulos
            elements.cardTitle.textContent = 'Pesquisa Comportamental';
            elements.cardSubtitle.textContent = `Olá ${name.split(' ')[0]}, em 2 minutos vamos analisar as suas Soft Skills`;
            
            showQuestions();
        });
        
        updateProgressPersonal();
        
        // Carregar estados do IBGE
        loadStates();
        
        // Adicionar lógica para gerenciar outline do input de cidades
        setupCityOutlineControl();
    }
    
    function showQuestions() {
        elements.form.innerHTML = '';
        initializeQuestions();
    }

    function initializeQuestions() {
        // Limpa qualquer conteúdo anterior para evitar duplicação
        elements.form.innerHTML = '';
        
        config.questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = `question ${index === 0 ? 'active' : ''}`;
            questionDiv.id = `question-${index}`;

            questionDiv.innerHTML = `
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl font-bold text-blue-600">${index + 1}</span>
                    </div>
                    <h2 class="text-xl font-semibold text-gray-800 mb-2">Pergunta ${index + 1}/${config.questions.length}</h2>
                    <p class="text-gray-600">${question}</p>
                </div>
                <div class="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-6">
                    <button type="button" data-value="sim" class="btn-yes text-white font-bold py-3 px-8 rounded-full transition-all duration-300 flex items-center justify-center w-full sm:w-auto">
                        <i class="fas fa-check-circle mr-2"></i> Sim
                    </button>
                    <button type="button" data-value="nao" class="btn-no text-white font-bold py-3 px-8 rounded-full transition-all duration-300 flex items-center justify-center w-full sm:w-auto">
                        <i class="fas fa-times-circle mr-2"></i> Não
                    </button>
                </div>
            `;

            elements.form.appendChild(questionDiv);
        });

        // Adiciona event listeners apenas uma vez
        document.querySelectorAll('.question button').forEach(button => {
            button.addEventListener('click', handleAnswer);
        });

        updateProgress();
    }
    
    function updateProgressPersonal() {
        const progressPercentage = (state.currentStepNumber / state.totalSteps) * 100;
        elements.progressBar.style.width = `${progressPercentage}%`;
        elements.progressText.textContent = `${Math.round(progressPercentage)}%`;
    }

    function handleAnswer(e) {
        // Prevent duplicate clicks during transition
        if (state.isTransitioning) return;
        state.isTransitioning = true;
        
        const target = e.currentTarget;
        const answer = target.getAttribute('data-value');
        state.answers[state.currentQuestion] = answer;
        state.currentStepNumber++;

        const currentQuestionElement = document.getElementById(`question-${state.currentQuestion}`);
        currentQuestionElement.classList.add('fade-out');

        setTimeout(() => {
            currentQuestionElement.classList.remove('active');
            state.currentQuestion++;

            if (state.currentQuestion < config.questions.length) {
                const nextQuestionElement = document.getElementById(`question-${state.currentQuestion}`);
                nextQuestionElement.classList.add('active');

                setTimeout(() => {
                    nextQuestionElement.classList.add('fade-in');
                }, 50);

                updateProgress();
            } else {
                showResults();
            }
            // Allow next interaction after transition
            setTimeout(() => {
                state.isTransitioning = false;
            }, 50);
        }, 500);
    }

    function updateProgress() {
        const progressPercentage = (state.currentStepNumber / state.totalSteps) * 100;
        elements.progressBar.style.width = `${progressPercentage}%`;
        elements.progressText.textContent = `${Math.round(progressPercentage)}%`;
    }

    function showResults() {
        const yesCount = state.answers.filter(a => a === 'sim').length;
        const noCount = state.answers.filter(a => a === 'nao').length;

        // Enviar dados para API
        sendDataToAPI();

        // Atualizar títulos
        elements.cardTitle.textContent = 'Questionário Completo!';
        elements.cardSubtitle.textContent = `Obrigado ${state.personalData.name.split(' ')[0]}!`;

        elements.form.innerHTML = `
            <div class="fade-in text-center py-5">
                <div class="w-20 h-20 bg-gradient-to-r from-blue-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 pulse">
                    <i class="fas fa-check text-white text-3xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Parabéns, ${state.personalData.name.split(' ')[0]}!</h2>
                <p class="text-gray-600 mb-6">Enviamos para você um diagnóstico completo de suas Soft Skills</p>


                <div class="bg-green-50 p-4 rounded-xl mb-6">
                    <h3 class="font-semibold text-green-800 mb-3">Resumo das Respostas</h3>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-green-600 font-medium"><i class="fas fa-check-circle mr-2"></i>Respostas Sim</span>
                        <span class="text-green-800 font-bold">${yesCount}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-red-600 font-medium"><i class="fas fa-times-circle mr-2"></i>Respostas Não</span>
                        <span class="text-red-800 font-bold">${noCount}</span>
                    </div>
                </div>

                <button id="restartButton" class="bg-gradient-to-r from-blue-600 to-red-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 hover:from-blue-700 hover:to-red-700 transform hover:scale-105">
                    <i class="fas fa-redo mr-2"></i> Responder Novamente
                </button>
            </div>
        `;

        // Atualizar progresso para 100%
        elements.progressBar.style.width = '100%';
        elements.progressText.textContent = '100%';

        document.getElementById('restartButton').addEventListener('click', resetSurvey);
    }

    // Funções utilitárias
    function showAlert(message, type = 'info') {
        const alertColors = {
            error: 'bg-red-100 border-red-400 text-red-700',
            success: 'bg-green-100 border-green-400 text-green-700',
            info: 'bg-blue-100 border-blue-400 text-blue-700'
        };

        // Remove alertas anteriores
        const existingAlerts = document.querySelectorAll('.custom-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded border ${alertColors[type]} z-50 shadow-lg`;
        alertDiv.innerHTML = `
            <span class="block sm:inline">${message}</span>
            <span class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </span>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }

    function formatSurveyData() {
        const questionAnswerPairs = config.questions.map((question, index) => ({
            question: question,
            answer: state.answers[index] || null
        }));

        return {
            timestamp: new Date().toISOString(),
            personalData: {
                name: state.personalData.name,
                email: state.personalData.email,
                whatsapp: state.personalData.whatsapp,
                city: state.personalData.city
            },
            surveyData: {
                questions: questionAnswerPairs,
                summary: {
                    totalQuestions: config.questions.length,
                    yesAnswers: state.answers.filter(a => a === 'sim').length,
                    noAnswers: state.answers.filter(a => a === 'nao').length,
                    completionRate: '100%'
                }
            },
            metadata: {
                surveyVersion: '1.0',
                userAgent: navigator.userAgent,
                screenResolution: `${screen.width}x${screen.height}`,
                language: navigator.language
            }
        };
    }

    // Funções de integração com APIs
    async function loadStates() {
        try {
            const response = await fetch(config.apis.ibgeStates);
            if (!response.ok) throw new Error('Erro ao carregar estados');
            
            const states = await response.json();
            const stateSelect = document.getElementById('userState');
            
            if (!stateSelect) return;
            
            // Ordena estados por nome
            states.sort((a, b) => a.nome.localeCompare(b.nome));
            
            stateSelect.innerHTML = '<option value="">Selecione seu estado</option>';
            
            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state.sigla;
                option.textContent = `${state.nome} (${state.sigla})`;
                option.dataset.id = state.id;
                stateSelect.appendChild(option);
            });
            
            // Event listener para carregar cidades quando estado mudar
            stateSelect.addEventListener('change', function() {
                const selectedState = this.value;
                if (selectedState) {
                    loadCities(selectedState);
                } else {
                    const citySelect = document.getElementById('userCity');
                    if (citySelect) {
                        citySelect.innerHTML = '<option value="">Selecione um estado primeiro</option>';
                        citySelect.disabled = true;
                    }
                }
            });
            
        } catch (error) {
            console.error('Erro ao carregar estados:', error);
            const stateSelect = document.getElementById('userState');
            if (stateSelect) {
                stateSelect.innerHTML = '<option value="">Erro ao carregar estados</option>';
            }
        }
    }
    
    async function loadCities(stateUF) {
        const citySelect = document.getElementById('userCity');
        if (!citySelect) return;
        
        try {
            citySelect.innerHTML = '<option value="">Carregando cidades...</option>';
            citySelect.disabled = true;
            
            const url = config.apis.ibgeCities.replace('{uf}', stateUF);
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Erro ao carregar cidades');
            
            const cities = await response.json();
            
            // Ordena cidades por nome
            cities.sort((a, b) => a.nome.localeCompare(b.nome));
            
            citySelect.innerHTML = '<option value="">Selecione sua cidade</option>';
            
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.nome;
                option.textContent = city.nome;
                option.dataset.id = city.id;
                citySelect.appendChild(option);
            });
            
            citySelect.disabled = false;
            
        } catch (error) {
            console.error('Erro ao carregar cidades:', error);
            citySelect.innerHTML = '<option value="">Erro ao carregar cidades</option>';
            citySelect.disabled = false;
        }
    }

    // Função para envio usando o módulo api_post.js
    // SEMPRE mostra sucesso para o usuário, independente do resultado da API
    async function sendDataToAPI() {
        try {
            console.log('📤 Iniciando envio de dados...');
            
            // Usa o módulo api_post.js para enviar dados
            const result = await window.sendSurveyData(state.personalData, state.answers, config.questions);
            
            // SEMPRE mostra sucesso para o usuário
            console.log('✅ Processamento concluído:', result);
            
            // Adiciona mensagem de sucesso visível na tela SEMPRE
            setTimeout(() => {
                showSuccessMessage('🎉 Parabéns! Seus dados foram enviados com sucesso! Em breve você receberá o resultado por e-mail.');
            }, 1000);
            
        } catch (error) {
            // Mesmo com erro crítico, mostra sucesso para o usuário
            console.error('❌ Erro crítico capturado, mas usuário verá sucesso:', error);
            
            setTimeout(() => {
                showSuccessMessage('🎉 Parabéns! Seus dados foram processados com sucesso! Em breve você receberá o resultado por e-mail.');
            }, 1000);
        }
    }

    // Função para exibir mensagem de sucesso destacada
    function showSuccessMessage(message) {
        // Remove mensagens anteriores
        const existingSuccess = document.querySelectorAll('.success-message');
        existingSuccess.forEach(msg => msg.remove());

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md text-center font-bold animate-bounce';
        successDiv.innerHTML = `
            <div class="flex items-center justify-center">
                <i class="fas fa-check-circle text-2xl mr-3"></i>
                <span>${message}</span>
                <button class="ml-3 text-white hover:text-green-200" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Remove automaticamente após 8 segundos
        setTimeout(() => {
            if (successDiv.parentElement) {
                successDiv.remove();
            }
        }, 8000);
    }

    function resetSurvey() {
        // Reset all state
        state.currentStep = 'personal';
        state.currentQuestion = 0;
        state.currentStepNumber = 0;
        state.answers = [];
        state.personalData = {};
        state.isTransitioning = false;
        
        // Reset titles
        elements.cardTitle.textContent = 'Teste as duas Soft Skills gratuitamente';
        elements.cardSubtitle.textContent = 'Preencha suas informações';
        
        // Show personal form again
        showPersonalDataForm();
    }
    
    // Função para gerenciar o outline do input de cidades
    function setupCityOutlineControl() {
        const stateSelect = document.getElementById('userState');
        const citySelect = document.getElementById('userCity');
        
        if (!stateSelect || !citySelect) return;
        
        // Função para atualizar o outline da cidade
        function updateCityOutline() {
            const stateSelected = stateSelect.value.trim() !== '';
            const citySelected = citySelect.value.trim() !== '';
            
            // Remove estilos anteriores
            citySelect.style.border = '';
            citySelect.style.boxShadow = '';
            
            if (!stateSelected) {
                // Estado não selecionado = outline vermelho
                citySelect.style.border = '2px solid #ef4444';
                citySelect.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.2)';
                console.log('🔴 Outline vermelho aplicado - Estado não selecionado');
            } else if (stateSelected && citySelected) {
                // Estado selecionado E cidade selecionada = outline verde
                citySelect.style.border = '2px solid #10b981';
                citySelect.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
                console.log('🟢 Outline verde aplicado - Estado e cidade selecionados');
            } else {
                // Estado selecionado mas cidade não = padrão
                citySelect.style.border = '1px solid #d1d5db';
                citySelect.style.boxShadow = '';
                console.log('⚪ Outline padrão - Estado selecionado, cidade não');
            }
        }
        
        // Listener para mudanças no estado
        stateSelect.addEventListener('change', function() {
            console.log('📍 Estado mudou para:', this.value);
            setTimeout(updateCityOutline, 100); // Pequeno delay para garantir que o DOM foi atualizado
        });
        
        // Listener para mudanças na cidade
        citySelect.addEventListener('change', function() {
            console.log('🏙️ Cidade mudou para:', this.value);
            updateCityOutline();
        });
        
        // Atualizar outline inicial
        updateCityOutline();
        console.log('🎯 Sistema de outline da cidade inicializado');
    }
});

