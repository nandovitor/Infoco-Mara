
import { Employee, Task, FinanceData } from '../types';

interface AiContextData {
    employees: Employee[];
    tasks: Task[];
    financeData: FinanceData[];
}

/**
 * Gera uma análise baseada em IA chamando o endpoint de backend da aplicação.
 * @param userInput A pergunta do usuário.
 * @param contextData Os dados da aplicação (funcionários, tarefas, etc.).
 * @returns O texto da resposta da IA.
 * @throws Lançará um erro se a chamada da API falhar.
 */
export const getAiDataAnalysis = async (userInput: string, contextData: AiContextData): Promise<string> => {
    try {
        const response = await fetch('/api/router?entity=gemini&action=analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userInput, contextData }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `O servidor respondeu com o status ${response.status}.`);
        }

        const data = await response.json();
        
        // Handle cases where the API might not return a response key, though our backend always should.
        // Importantly, this now allows for an empty string "" as a valid response from the AI.
        if (data.response === undefined || data.response === null) {
            throw new Error('A resposta da API estava em um formato inválido ou não continha um campo de resposta.');
        }

        return data.response;

    } catch (error: any) {
        console.error("Erro ao chamar a API de análise:", error);
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             throw new Error('Não foi possível conectar ao serviço de IA. Verifique sua conexão e se o servidor está online.');
        }
        throw error;
    }
};
