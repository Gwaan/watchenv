import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { SseDeploymentEvent } from './models';

@Injectable({ providedIn: 'root' })
export class SseService {
  connect(): Observable<SseDeploymentEvent> {
    return new Observable((subscriber) => {
      const es = new EventSource('/api/sse', { withCredentials: true });

      es.onmessage = (event) => {
        subscriber.next(JSON.parse(event.data));
      };

      es.onerror = () => subscriber.error(new Error('SSE connection lost'));

      return () => es.close();
    });
  }
}
