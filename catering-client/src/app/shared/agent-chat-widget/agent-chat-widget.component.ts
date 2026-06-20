/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
  isOrderApproved,
  ORDER_STATUS_APPROVED,
  ORDER_STATUS_PENDING,
} from '../../core/models/order.model';
import { DishCardComponent } from '../components/dish-card/dish-card.component';
import { PackageCardComponent } from '../components/package-card/package-card.component';
import { AgentChatService, ChatTurn, ToolResult } from './agent-chat.service';

type MessageContentType = 'text' | 'cards';
type CardKind = 'dishes' | 'packages' | 'orders';

/** Lightweight order summary rendered inline in the chat (no dedicated card component). */
export interface OrderCard {
  id: string;
  packageName: string;
  numberOfGuests: number;
  eventDate: string;
  address: string;
  totalPrice: number;
  paymentStatus: string;
}

export interface ChatMessage {
  role: 'user' | 'agent';
  contentType: MessageContentType;
  timestamp: Date;
  text?: string;
  cardKind?: CardKind;
  dishes?: Dish[];
  packages?: Package[];
  orders?: OrderCard[];
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

  readonly isOrderApproved = isOrderApproved;

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  messages = signal<ChatMessage[]>([
    {
      role: 'agent',
      contentType: 'text',
      text: 'שלום! אני העוזר החכם של קייטרינג המלך 👑\nאני יכול לעזור לך לגלות מנות וחבילות, לבצע הזמנה ולצפות בהזמנות שלך. במה אוכל לעזור?',
      timestamp: new Date(),
    },
  ]);

  /** Full conversation history for the API (includes tool-call turns, not just visible text). */
  private conversationHistory = signal<ChatTurn[]>([]);

  inputText = '';
  isLoading = signal(false);

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading()) return;

    // Prior turns for the backend (text + tool calls/responses), excluding the new message.
    const history = this.conversationHistory();

    this.inputText = '';
    this.pushMessage({ role: 'user', contentType: 'text', text, timestamp: new Date() });
    this.isLoading.set(true);
    this.scrollToBottom();

    this.chatService.sendMessage(text, history).subscribe({
      next: ({ reply, toolResults, historyTurns }) => {
        if (historyTurns?.length) {
          this.conversationHistory.update((h) => [...h, ...historyTurns]);
        }
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
      error: (err) => {
        console.error('[AgentChat] sendMessage failed:', err);
        this.pushMessage({
          role: 'agent',
          contentType: 'text',
          text: this.chatErrorMessage(err),
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
      } else if (result.name === 'getOrdersByUser' || result.name === 'createOrder') {
        // Both an order list and a freshly created order arrive as an array of order docs.
        this.pushMessage({
          role: 'agent',
          contentType: 'cards',
          cardKind: 'orders',
          orders: result.data.map((o) => this.toOrder(o)),
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

  private toOrder(o: any): OrderCard {
    // packageId may arrive populated ({ packageName }) or as a bare id string.
    const pkg = o.packageId;
    const packageName =
      pkg && typeof pkg === 'object' ? (pkg.packageName ?? '') : '';

    return {
      id: o._id ?? o.id ?? '',
      packageName,
      numberOfGuests: o.numberOfGuests ?? 0,
      eventDate: o.eventDate ?? '',
      address: o.address ?? '',
      totalPrice: o.totalPrice ?? 0,
      paymentStatus: o.paymentStatus ?? ORDER_STATUS_PENDING,
    };
  }

  formatOrderDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? date : d.toLocaleDateString('he-IL');
  }

  orderStatus(order: OrderCard): string {
    return isOrderApproved(order) ? ORDER_STATUS_APPROVED : ORDER_STATUS_PENDING;
  }

  private chatErrorMessage(err: { status?: number; error?: { message?: string } }): string {
    const serverMsg = err?.error?.message?.trim();
    if (serverMsg) return serverMsg;
    if (err?.status === 429) {
      return 'שירות ה-AI עמוס כרגע. נסה שוב בעוד כמה דקות.';
    }
    return 'מצטערים, אירעה שגיאה. אנא נסה שוב מאוחר יותר.';
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
