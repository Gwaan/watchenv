import { Controller, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sse')
export class SseController {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Sse()
  @UseGuards(JwtAuthGuard)
  stream(): Observable<MessageEvent> {
    return new Observable(subscriber => {
      const handler = (data: object) => subscriber.next({ data });
      this.eventEmitter.on('deployment.updated', handler);
      return () => this.eventEmitter.off('deployment.updated', handler);
    });
  }
}
