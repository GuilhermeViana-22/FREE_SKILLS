# 📡 API_POST.JS - Módulo de Integração DeSkills

## 🎯 Funcionalidade

O arquivo `api_post.js` é um módulo JavaScript dedicado exclusivamente ao **envio de dados do questionário para a API DeSkills**. Ele foi separado do arquivo principal para:

- ✅ **Modularização**: Código organizado e fácil manutenção
- ✅ **Reutilização**: Pode ser usado em outros projetos
- ✅ **Testabilidade**: Fácil de testar isoladamente
- ✅ **Responsabilidade única**: Cuida apenas do envio para API

## 🔗 Endpoint Configurado

```
POST https://api.deskills.com.br/freskills
```

## 📋 Estrutura do Payload Enviado

```json
{
  "submissionId": "freeskills_1693234567890_abc123def",
  "timestamp": "2025-08-28T15:53:41.000Z",
  "user": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "(11) 99999-9999",
    "city": "São Paulo",
    "registeredAt": "2025-08-28T15:53:41.000Z"
  },
  "survey": {
    "title": "FREE SKILLS - Pesquisa de Satisfação",
    "version": "1.0",
    "questions": [
      {
        "questionId": 1,
        "question": "Você está satisfeito com nosso serviço?",
        "answer": "sim",
        "answerType": "positive"
      }
    ],
    "statistics": {
      "totalQuestions": 12,
      "positiveAnswers": 8,
      "negativeAnswers": 4,
      "satisfactionScore": 66.67,
      "completionRate": 100,
      "completionTime": 480
    }
  },
  "technical": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Linux x86_64",
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo",
    "screenResolution": "1920x1080",
    "viewportSize": "1366x768",
    "connection": {
      "effectiveType": "4g",
      "downlink": 10
    }
  },
  "source": {
    "application": "FREE_SKILLS_QUESTIONNAIRE",
    "version": "1.0.0",
    "environment": "production",
    "referrer": "direct"
  }
}
```

## 🛠️ Funcionalidades Implementadas

### ✨ Envio Inteligente
- **3 tentativas automáticas** com delay incremental
- **Validação de payload** antes do envio  
- **Headers otimizados** para APIs REST
- **Logs detalhados** para debugging

### 🔄 Sistema de Backup
- **Fallback automático** para localStorage
- **Função para reenvio** de dados salvos
- **Gestão de backups** com timestamp
- **Limpeza automática** após envio bem-sucedido

### 🎨 Feedback Visual
- **Alertas personalizados** com ícones FontAwesome
- **4 tipos de alerta**: info, success, error, warning
- **Auto-dismiss** após 6 segundos
- **Animações suaves** e responsivas

### 🧪 Ferramentas de Debug
- **Status checker** da API DeSkills
- **Listagem de backups** locais
- **Console logs** coloridos e organizados
- **Validações** em múltiplas camadas

## 🚀 Como Usar

### Uso Básico (Automático)
O módulo é chamado automaticamente pelo `main.js` quando o usuário completa o questionário:

```javascript
// Enviado automaticamente após completar questionário
const result = await window.sendSurveyData(personalData, answers, questions);
```

### Uso Manual (Avançado)
```javascript
// Verificar status da API
const status = await window.checkDeSkillsStatus();
console.log('API Online:', status.online);

// Ver backups salvos localmente  
const backups = window.getLocalBackups();
console.log('Backups:', backups);

// Reenviar um backup específico
await window.resendBackup('freeskills_backup_1693234567890');

// Limpar todos os backups
window.FreeSkillsAPI.clearAllBackups();
```

### Acesso à Classe Principal
```javascript
// Instância global disponível
const api = window.FreeSkillsAPI;

// Métodos disponíveis
await api.submitSurvey(personalData, answers, questions);
await api.checkApiStatus();
api.getLocalBackups();
await api.resendBackup(backupKey);
api.clearAllBackups();
```

## ⚙️ Configuração

### Alterando Endpoint da API
```javascript
// No arquivo api_post.js, linha 11
this.apiEndpoint = 'https://api.deskills.com.br/freskills';
```

### Configurando Tentativas
```javascript
// No arquivo api_post.js, linhas 12-13  
this.retryAttempts = 3;        // Número de tentativas
this.retryDelay = 1000;        // Delay inicial em ms
```

## 🔍 Monitoramento e Debug

### Console Logs
O módulo gera logs coloridos no console:
- 📡 **Azul**: Informações gerais
- ✅ **Verde**: Sucessos  
- ⚠️ **Amarelo**: Avisos
- ❌ **Vermelho**: Erros

### Dados no LocalStorage
Os backups são salvos com as chaves:
```
freeskills_backup_[timestamp]     // Dados individuais
freeskills_latest_backup          // Referência ao último backup
```

### Verificação de Status
```javascript
// Verificar se a API está online
const status = await window.checkDeSkillsStatus();
/*
Retorna:
{
  online: true/false,
  status: 200,
  responseTime: 145.2,
  error: null
}
*/
```

## 🛡️ Tratamento de Erros

### Tipos de Erro Tratados
- **Conexão**: Sem internet ou timeout
- **400**: Dados inválidos enviados  
- **401/403**: Problemas de autorização
- **500**: Erro interno do servidor DeSkills
- **Outros**: Erros desconhecidos

### Mensagens para Usuário
- ✅ **Sucesso**: "Dados enviados com sucesso para DeSkills!"
- ⚠️ **Tentativa**: "Tentativa X falhou, tentando novamente..."
- ❌ **Erro**: "Erro ao enviar dados. Dados salvos localmente."

## 📊 Exemplo de Resposta da API

```json
{
  "success": true,
  "submissionId": "freeskills_1693234567890_abc123def",
  "message": "Questionário salvo com sucesso",
  "data": {
    "id": 12345,
    "createdAt": "2025-08-28T15:53:41.000Z",
    "satisfactionScore": 66.67,
    "classification": "satisfied"
  }
}
```

## 🔧 Manutenção

### Atualizando o Endpoint
Se a URL da API DeSkills mudar, atualize apenas a linha 11 do `api_post.js`.

### Adicionando Novos Campos
Para adicionar campos ao payload, modifique a função `formatPayload()` na linha 19.

### Alterando Validações
As validações ficam na função `validatePayload()` na linha 185.

## 🧪 Testes

### Testando Localmente
1. Abra o console do navegador (F12)
2. Execute: `await window.sendSurveyData(dados, respostas, perguntas)`
3. Verifique os logs coloridos
4. Veja dados salvos: `window.getLocalBackups()`

### Simulando Erros
```javascript
// Temporariamente altere o endpoint para testar fallback
window.FreeSkillsAPI.apiEndpoint = 'https://api-inexistente.com';
await window.sendSurveyData(dados, respostas, perguntas);
```

## 🚨 Alertas Importantes

- ⚠️ **CORS**: A API DeSkills deve permitir requisições do seu domínio
- ⚠️ **HTTPS**: Funciona apenas em conexões seguras (HTTPS)
- ⚠️ **Fallback**: Dados são sempre salvos localmente como backup
- ⚠️ **Validação**: Payload é validado antes do envio para evitar erros 400

---

**📞 Suporte**: Se a API retornar erros, verifique se a URL `https://api.deskills.com.br/freskills` está correta e acessível.
