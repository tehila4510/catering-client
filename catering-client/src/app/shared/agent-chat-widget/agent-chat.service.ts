import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

export interface ToolResult {
  name: string;
  data: any[];
}

export interface AgentChatApiResponse {
  success: boolean;
  data: { reply: string; toolResults: ToolResult[] };
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AgentChatService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/agent`;

  /** Controls whether the floating chat panel is open. */
  isOpen = signal(false);

  toggleOpen(): void {
    this.isOpen.update((v) => !v);
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  sendMessage(message: string): Observable<{ reply: string; toolResults: ToolResult[] }> {
    return this.http
      .post<AgentChatApiResponse>(`${this.apiUrl}/chat`, { message })
      .pipe(map((res) => res.data));
  }
}
