# FREE SKILLS - Documentação da API

## Estrutura de Dados Enviados

O questionário envia os dados no seguinte formato JSON:

```json
{
  "timestamp": "2025-08-28T15:35:18.000Z",
  "personalData": {
    "name": "João Silva",
    "email": "joao@email.com",
    "whatsapp": "(11) 99999-9999",
    "city": "São Paulo"
  },
  "surveyData": {
    "questions": [
      {
        "question": "Você está satisfeito com nosso serviço?",
        "answer": "sim"
      },
      {
        "question": "O produto atendeu às suas expectativas?",
        "answer": "nao"
      }
      // ... mais perguntas
    ],
    "summary": {
      "totalQuestions": 12,
      "yesAnswers": 8,
      "noAnswers": 4,
      "completionRate": "100%"
    }
  },
  "metadata": {
    "surveyVersion": "1.0",
    "userAgent": "Mozilla/5.0...",
    "screenResolution": "1920x1080",
    "language": "pt-BR"
  }
}
```

## APIs Integradas

### 1. API do IBGE (GET) - Estados e Cidades
O projeto automaticamente carrega:
- **Estados**: `https://servicodados.ibge.gov.br/api/v1/localidades/estados`
- **Cidades**: `https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios`

### 2. API DeSkills (POST) - Envio de Dados
- **URL**: `https://api.deskills.com.br/`
- **Método**: POST
- **Content-Type**: application/json

## Configurando sua API

O projeto já está configurado para usar as APIs do IBGE e DeSkills. Se precisar alterar, edite o objeto `config.apis` no arquivo `assets/js/main.js`:

```javascript
apis: {
    deskills: 'https://api.deskills.com.br/',
    ibgeStates: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
    ibgeCities: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios'
}
```

### 2. Exemplo de implementação da API (Node.js/Express)

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Middleware CORS se necessário
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  next();
});

// Endpoint para receber os dados do questionário
app.post('/api/survey', (req, res) => {
  try {
    const surveyData = req.body;
    
    // Validar dados recebidos
    if (!surveyData.personalData || !surveyData.surveyData) {
      return res.status(400).json({ 
        error: 'Dados incompletos' 
      });
    }
    
    // Salvar no banco de dados
    // saveSurveyToDatabase(surveyData);
    
    // Resposta de sucesso
    res.json({
      success: true,
      message: 'Questionário salvo com sucesso',
      id: Date.now() // ID gerado para o questionário
    });
    
  } catch (error) {
    console.error('Erro ao processar questionário:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

app.listen(3000, () => {
  console.log('API rodando na porta 3000');
});
```

### 3. Exemplo com PHP

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['personalData']) || !isset($input['surveyData'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados incompletos']);
        exit;
    }
    
    // Salvar no banco de dados ou arquivo
    // $saved = saveSurveyData($input);
    
    echo json_encode([
        'success' => true,
        'message' => 'Questionário salvo com sucesso',
        'id' => time()
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
}
?>
```

## Recursos Implementados

### ✅ Problemas Corrigidos:
1. **Textos brancos nos inputs** - Corrigido com CSS `!important`
2. **Duplicação de perguntas** - Implementado controle de estado adequado
3. **Estrutura de dados organizada** - Criada função `formatSurveyData()`
4. **Envio para API** - Implementado com fetch API e tratamento de erros
5. **Experiência do usuário** - Alertas visuais, loading states, fallback localStorage

### 🚀 Novas Funcionalidades (2025-08-28):
- **Integração IBGE**: Select de estados e cidades dinâmicos com dados reais
- **API DeSkills**: Configurada para envio automático dos dados
- **JavaScript Puro**: Sem dependências externas, usando apenas fetch() nativo
- **UX Melhorada**: Estados ordenados alfabeticamente, loading states
- **Tratamento de Erros**: Fallback quando APIs não respondem

### 🚀 Funcionalidades Anteriores:
- Validação de email
- Alertas customizados com auto-dismiss
- Fallback para localStorage quando API falha
- Metadados completos (resolução, navegador, etc.)
- Sistema de transições suaves
- Prevenção de cliques duplos
- Reset completo do questionário

## Testando Localmente

Para testar sem API configurada, os dados são salvos no localStorage do navegador. Abra as Developer Tools (F12) e digite:

```javascript
// Ver dados salvos
console.log(JSON.parse(localStorage.getItem('surveyData')));

// Limpar dados salvos  
localStorage.removeItem('surveyData');
```

## Personalização

### Alterando Perguntas
Edite o array `questions` no arquivo `main.js`, linhas 57-68.

### Alterando Cores/Estilo
Modifique o arquivo `assets/css/styles.css` ou as classes Tailwind no HTML.

### Adicionando Campos Pessoais
Edite a função `showPersonalDataForm()` no arquivo `main.js`.

## Troubleshooting

### Textos não aparecem nos inputs
- Verifique se o CSS está sendo carregado corretamente
- Os styles com `!important` devem forçar a cor preta

### API não recebe dados
- Verifique o endpoint configurado
- Confirme se o CORS está habilitado na API
- Verifique o console do navegador para erros

### Perguntas duplicadas
- O problema foi corrigido com a organização do estado da aplicação
- Se ainda ocorrer, limpe o cache do navegador
