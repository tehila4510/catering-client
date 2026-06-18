import {
  Component,
  signal,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Dish } from '../../core/models/dish.model';
import { Package } from '../../core/models/package.model';
import { DishCardComponent } from '../components/dish-card/dish-card.component';
import { PackageCardComponent } from '../components/package-card/package-card.component';
import { AgentChatService, ToolResult } from './agent-chat.service';

type MessageContentType = 'text' | 'cards';
type CardKind = 'dishes' | 'packages';

export interface ChatMessage {
  role: 'user' | 'agent';
  contentType: MessageContentType;
  timestamp: Date;
  text?: string;
  cardKind?: CardKind;
  dishes?: Dish[];
  packages?: Package[];
}

@Component({
  selector: 'app-agent-chat-widget',
  standalone: true,
  imports: [FormsModule, DishCardComponent, PackageCardComponent],
  templateUrl: './agent-chat-widget.component.html',
  styleUrl: './agent-chat-widget.component.scss',
})
export class AgentChatWidgetComponent {
  chatService = inject(AgentChatService);

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  messages = signal<ChatMessage[]>([
    {
      role: 'agent',
      contentType: 'text',
      text: 'שלום! אני העוזר החכם של קייטרינג המלך 👑\nאני יכול לעזור לך לגלות מנות וחבילות. במה אוכל לעזור?',
      timestamp: new Date(),
    },
  ]);

  inputText = '';
  isLoading = signal(false);

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading()) return;

    this.inputText = '';
    this.pushMessage({ role: 'user', contentType: 'text', text, timestamp: new Date() });
    this.isLoading.set(true);
    this.scrollToBottom();

    this.chatService.sendMessage(text).subscribe({
      next: ({ reply, toolResults }) => {
        if (reply?.trim()) {
          this.pushMessage({
            role: 'agent',
            contentType: 'text',
            text: reply,
            timestamp: new Date(),
          });
        }
        this.appendToolResultCards(toolResults);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.pushMessage({
          role: 'agent',
          contentType: 'text',
          text: 'מצטערים, אירעה שגיאה. אנא נסה שוב מאוחר יותר.',
          timestamp: new Date(),
        });
        this.isLoading.set(false);
        this.scrollToBottom();
      },
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }

  private appendToolResultCards(toolResults: ToolResult[] | undefined): void {
    if (!toolResults?.length) return;

    for (const result of toolResults) {
      if (!result.data?.length) continue;

      if (result.name === 'getDishes') {
        this.pushMessage({
          role: 'agent',
          contentType: 'cards',
          cardKind: 'dishes',
          dishes: result.data.map((d) => this.toDish(d)),
          timestamp: new Date(),
        });
      } else if (result.name === 'getPackages') {
        this.pushMessage({
          role: 'agent',
          contentType: 'cards',
          cardKind: 'packages',
          packages: result.data.map((p) => this.toPackage(p)),
          timestamp: new Date(),
        });
      }
    }
  }

  private toDish(d: any): Dish {
    return {
      id: d._id ?? d.id ?? '',
      name: d.name ?? '',
      description: d.description ?? '',
      category: d.category ?? '',
      imageUrl: d.imageUrl,
      isActive: d.isActive,
    };
  }

  private toPackage(p: any): Package {
    return {
      id: p._id ?? p.id ?? '',
      name: p.name ?? '',
      description: p.description ?? '',
      pricePerPerson: p.pricePerPerson ?? 0,
      limits: p.limits ?? {
        starters: 0,
        mainCourses: 0,
        salads: 0,
        desserts: 0,
        breads: 0,
        drinks: 0,
      },
      featured: p.featured,
      imageUrl: p.imageUrl,
    };
  }

  private pushMessage(msg: ChatMessage): void {
    this.messages.update((msgs) => [...msgs, msg]);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }
}
