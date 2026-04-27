import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { SseEnvironmentUpdatedEvent } from '@watchenv/shared';

@Injectable({ providedIn: 'root' })
export class SseService {
  connect(): Observable<SseEnvironmentUpdatedEvent> {
    return new Observable((subscriber) => {
      const es = new EventSource('/api/sse', { withCredentials: true });

      es.onmessage = (event) => {
        console.log('sse event deploy received:', event);
        subscriber.next(JSON.parse(event.data));
      };

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          subscriber.error(new Error('SSE connection lost'));
        }
      };

      return () => es.close();
    });
  }
}
