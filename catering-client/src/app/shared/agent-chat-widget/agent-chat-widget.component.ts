/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  signal,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Dish } from '../../core/models/dish.model';
import { Package } from '../../core/models/package.model';
import { DishCardComponent } from '../components/dish-card/dish-card.component';
import { PackageCardComponent } from '../components/package-card/package-card.component';
import { AgentChatService, ToolResult } from './agent-chat.service';

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
  isApproved: boolean;
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
export class AgentChatWidgetComponent implements AfterViewInit {
  chatService = inject(AgentChatService);

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  ngAfterViewInit(): void {
    // #region agent log
    setTimeout(() => {
      const widget = document.querySelector('.chat-widget') as HTMLElement | null;
      const fab = document.querySelector('.widget-fab') as HTMLElement | null;
      const wr = widget?.getBoundingClientRect();
      const fr = fab?.getBoundingClientRect();
      fetch('http://127.0.0.1:7472/ingest/1efcf1af-9ffc-46cb-be5f-a6ada37ad3ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b9e9ae'},body:JSON.stringify({sessionId:'b9e9ae',hypothesisId:'H1',location:'agent-chat-widget.component.ts:ngAfterViewInit',message:'widget vs fab geometry + pointer-events',data:{widgetRect:wr&&{w:Math.round(wr.width),h:Math.round(wr.height),top:Math.round(wr.top),left:Math.round(wr.left)},widgetPE:widget?getComputedStyle(widget).pointerEvents:null,fabRect:fr&&{w:Math.round(fr.width),h:Math.round(fr.height)},isOpen:this.chatService.isOpen()},timestamp:Date.now()})}).catch((err)=>console.error('[AgentChat] ngAfterViewInit failed:', err));
    }, 500);
    // #endregion
  }

  messages = signal<ChatMessage[]>([
    {
      role: 'agent',
      contentType: 'text',
      text: 'שלום! אני העוזר החכם של קייטרינג המלך 👑\nאני יכול לעזור לך לגלות מנות וחבילות, לבצע הזמנה ולצפות בהזמנות שלך. במה אוכל לעזור?',
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
        // #region agent log
        fetch('http://127.0.0.1:7472/ingest/1efcf1af-9ffc-46cb-be5f-a6ada37ad3ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b9e9ae'},body:JSON.stringify({sessionId:'b9e9ae',hypothesisId:'H5',location:'agent-chat-widget.component.ts:next',message:'chat success',data:{replyLen:reply?.length||0,toolResultsCount:toolResults?.length||0},timestamp:Date.now()})}).catch((err)=>console.error('[AgentChat] sendMessage failed:', err));
        // #endregion
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
        // #region agent log
        console.error('[AgentChat] sendMessage failed:', err);
        fetch('http://127.0.0.1:7472/ingest/1efcf1af-9ffc-46cb-be5f-a6ada37ad3ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b9e9ae'},body:JSON.stringify({sessionId:'b9e9ae',hypothesisId:'H5',location:'agent-chat-widget.component.ts:error',message:'chat error',data:{status:err?.status,statusText:err?.statusText,name:err?.name,message:err?.message,serverMsg:err?.error?.message,isLoadingBefore:this.isLoading()},timestamp:Date.now()})}).catch((err)=>console.error('[AgentChat] sendMessage failed:', err));
        // #endregion
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
      isApproved: !!o.isApproved,
    };
  }

  formatOrderDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? date : d.toLocaleDateString('he-IL');
  }

  orderStatus(order: OrderCard): string {
    return order.isApproved ? 'מאושרת' : 'ממתינה לאישור';
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
