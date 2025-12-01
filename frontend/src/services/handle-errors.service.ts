import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HandleErrors {
  /**
   * Manipula erros HTTP e retorna mensagens amigáveis.
   * @param error A resposta de erro HTTP.
   * @returns Um observable que lança um erro com uma mensagem amigável.
   */
  public handleError(error: HttpErrorResponse) {
    let errorMessage = 'Erro inesperado.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro do cliente: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Erro de conexão. Verifique sua internet. Detalhes: ' + error.message;
          break;
        case 400:
          errorMessage = error.error?.message || 'Requisição inválida. Verifique os dados enviados.';
          break;
        case 401:
          errorMessage = 'Não autorizado. Faça login novamente.';
          break;
        case 403:
          errorMessage = 'Acesso negado. Você não tem permissão para este recurso.';
          break;
        case 404:
          errorMessage =
            'Recurso não encontrado. Detalhes: ' +
            (error.error?.message || 'Nenhum detalhe disponível.');
          break;
        case 500:
          errorMessage =
            'Erro no servidor. Detalhes: ' + (error.error?.message || 'Nenhum detalhe disponível.');
          break;
        default:
          errorMessage =
            `Erro desconhecido (Código: ${error.status}). Detalhes: ` +
            (error.error?.message || 'Nenhum detalhe disponível.');
      }
    }

    console.error(`Erro na API: ${errorMessage}`, error);
    return throwError(() => new Error(errorMessage));
  }
}
