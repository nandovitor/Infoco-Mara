
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Employee, Supplier, SystemUser } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString: string) => {
    if (!dateString) return 'N/D';
    // Handles both 'YYYY-MM-DD' and full ISO strings by ensuring we only consider the date part
    const datePart = dateString.split('T')[0];
    return new Date(datePart + 'T00:00:00').toLocaleDateString('pt-BR');
};

export const getUserInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getEmployeeName = (employeeId: number, employees: Employee[]): string => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Desconhecido';
};

export const getSupplierName = (supplierId: number, suppliers: Supplier[]): string => {
    const supplier = suppliers.find(sup => sup.id === supplierId);
    return supplier ? supplier.name : 'N/D';
};

export const timeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const intervals: { [key: string]: number } = {
        ano: 31536000,
        mês: 2592000,
        dia: 86400,
        hora: 3600,
        minuto: 60,
    };

    if (seconds < 30) return "agora";

    for (const unit in intervals) {
        const interval = Math.floor(seconds / intervals[unit]);
        if (interval >= 1) {
            if (unit === 'mês' && interval > 1) {
                return `há ${interval} meses`;
            }
            const plural = interval > 1 ? 's' : '';
            return `há ${interval} ${unit}${plural}`;
        }
    }
    return "agora";
};

export const getSystemUser = (userId: string, users: SystemUser[]): SystemUser | null => {
    return users.find(u => u.id === userId) || null;
};

/**
 * Lida de forma segura com respostas de API, analisando JSON ou extraindo mensagens de erro de texto.
 * Previne crashes de "Unexpected token" quando a API retorna um erro não-JSON (ex: HTML).
 * @param response A resposta do fetch.
 * @returns Uma promise que resolve para os dados JSON em caso de sucesso.
 * @throws Lança um Erro com uma mensagem amigável em caso de falha.
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    // Lida com respostas de sucesso sem conteúdo (ex: 204 No Content).
    if (response.status === 204) {
      return null as T;
    }
    // Retorna o corpo da resposta JSON.
    return response.json();
  } else {
    // Se a resposta não for 'ok', tenta extrair uma mensagem de erro útil.
    let errorMessage = `Erro na comunicação com a API: ${response.status} ${response.statusText}`;
    let errorDetails: string | undefined = undefined;

    try {
      // Tenta analisar como JSON para obter uma mensagem de erro estruturada.
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
      errorDetails = errorData.details;
    } catch (jsonError) {
      // Se não for JSON, tenta ler como texto. Pode ser um erro de servidor (HTML).
      try {
        const textError = await response.text();
        // Limita o tamanho para não exibir uma página HTML inteira.
        if (textError && textError.length < 500) {
          errorMessage = textError;
        }
      } catch (textError) {
        // Mantém a mensagem de status se a leitura do texto falhar.
      }
    }
    
    const error: any = new Error(errorMessage);
    if (errorDetails) {
        error.details = errorDetails;
    }
    throw error;
  }
}
