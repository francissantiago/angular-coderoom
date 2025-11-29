
import { Component, ChangeDetectionStrategy, inject, signal, viewChild, ElementRef, effect, input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '@services/chat.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements OnInit, OnDestroy {
  chatService = inject(ChatService);
  messages = this.chatService.messages;
  newMessage = signal('');
  role = input<'Student' | 'Teacher'>('Student');

  // Component state
  isLoading = signal<boolean>(false);

  private destroyed = new Subject<void>();

  chatContainer = viewChild<ElementRef<HTMLDivElement>>('chatContainer');

  ngOnInit() {
    // Initialization logic if needed
  }

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

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
