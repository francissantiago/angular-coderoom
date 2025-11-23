
import { Injectable, signal } from '@angular/core';

export interface ChatMessage {
  sender: 'Teacher' | 'Student';
  text: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  messages = signal<ChatMessage[]>([]);

  constructor() {
    // Initial message from teacher
    this.messages.set([
      {
        sender: 'Teacher',
        text: 'Bem-vindo à sala de aula! Sinta-se à vontade para tirar dúvidas sobre o código.',
        timestamp: new Date(),
      },
    ]);
  }

  sendMessage(text: string, sender: 'Teacher' | 'Student' = 'Student') {
    if (!text.trim()) return;

    const newMessage: ChatMessage = {
      sender,
      text,
      timestamp: new Date(),
    };
    this.messages.update(currentMessages => [...currentMessages, newMessage]);

    if (sender === 'Student') {
      this.simulateTeacherResponse(text);
    }
  }

  private simulateTeacherResponse(studentMessage: string) {
    setTimeout(() => {
      const response = this.getTeacherResponse(studentMessage);
      this.sendMessage(response, 'Teacher');
    }, 1500 + Math.random() * 1000); // Respond after 1.5-2.5 seconds
  }

  private getTeacherResponse(message: string): string {
    const lowerCaseMessage = message.toLowerCase();
    if (lowerCaseMessage.includes('help') || lowerCaseMessage.includes('ajuda')) {
      return "Claro! Em qual parte do código você está com dúvidas? Tente ser específico.";
    }
    if (lowerCaseMessage.includes('thank') || lowerCaseMessage.includes('obrigado')) {
        return "De nada! Continue o bom trabalho.";
    }
    if (lowerCaseMessage.includes('css')) {
      return 'Para CSS, lembre-se de verificar os seletores. Um problema comum é erro de digitação no nome da classe ou ID.';
    }
    if (lowerCaseMessage.includes('js') || lowerCaseMessage.includes('javascript')) {
      return 'Com JavaScript, o console do navegador é seu melhor amigo para depuração. Verifique se há mensagens de erro lá.';
    }
    if (lowerCaseMessage.includes('html')) {
        return 'Certifique-se de que todas as tags HTML estejam fechadas corretamente. Tags abertas podem causar problemas de layout.';
    }
    return 'Ótima pergunta. Deixe-me dar uma olhada... Enquanto isso, tente explicar o problema para si mesmo. Às vezes, isso ajuda a encontrar a solução!';
  }
}
