
import { Component, ChangeDetectionStrategy, inject, signal, viewChild, ElementRef, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '@services/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  chatService = inject(ChatService);
  messages = this.chatService.messages;
  newMessage = signal('');
  role = input<'Student' | 'Teacher'>('Student');

  chatContainer = viewChild<ElementRef<HTMLDivElement>>('chatContainer');

  constructor() {
    // Scroll to bottom when messages change
    effect(() => {
        this.messages(); // Depend on messages signal
        // Use a timeout to ensure scrolling happens after the DOM has updated
        setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  handleInput(event: Event) {
    this.newMessage.set((event.target as HTMLInputElement).value);
  }

  sendMessage() {
    const text = this.newMessage().trim();
    if (text) {
      this.chatService.sendMessage(text, this.role());
      this.newMessage.set('');
    }
  }

  formatTimestamp(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    const container = this.chatContainer()?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
