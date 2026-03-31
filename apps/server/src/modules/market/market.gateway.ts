import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { WsEvent, MarketStatus } from '@mocktrade/shared';
import { MarketStateService } from './market-state.service';
import { createCorsOriginMatcher } from '../../cors-origin';

@WebSocketGateway({
  cors: { origin: createCorsOriginMatcher(process.env.CORS_ORIGIN), credentials: true },
  namespace: '/',
})
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MarketGateway.name);
  private connectedClients = 0;

  constructor(
    private readonly marketState: MarketStateService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit() {
    this.marketState.onStatusChange((status, countdown) => {
      this.broadcastMarketStatus(status, countdown);
    });
  }

  handleConnection(client: Socket) {
    this.connectedClients++;
    client.join('market');
    this.logger.log(`Connected: ${client.id} (${this.connectedClients})`);
    const snapshot = this.marketState.getStatusSnapshot();
    client.emit(WsEvent.MARKET_STATUS, {
      status: snapshot.status,
      countdown: snapshot.countdown,
    });
  }

  handleDisconnect() { this.connectedClients--; }

  @SubscribeMessage('subscribe:stock')
  handleSubscribeStock(client: Socket, stockId: string) { client.join(`stock:${stockId}`); }

  @SubscribeMessage('unsubscribe:stock')
  handleUnsubscribeStock(client: Socket, stockId: string) { client.leave(`stock:${stockId}`); }

  @SubscribeMessage('subscribe:user')
  handleSubscribeUser(client: Socket, userId: string) {
    const authUserId = this.extractUserId(client);
    if (!authUserId || authUserId !== userId) {
      client.emit('error', { message: '未授权：只能订阅自己的事件频道' });
      return;
    }
    client.join(`user:${userId}`);
  }

  private extractUserId(client: Socket): string | null {
    try {
      const token = client.handshake.auth?.token;
      if (!token) return null;
      const payload = this.jwtService.verify(token);
      return payload.sub || null;
    } catch {
      return null;
    }
  }

  broadcastTicks(ticks: Array<{ stockId: string; price: number; change: number; changePercent: number; volume: number }>) {
    this.server.to('market').emit(WsEvent.TICK, ticks);
    for (const t of ticks) this.server.to(`stock:${t.stockId}`).emit(WsEvent.TICK, t);
  }

  broadcastMarketStatus(status: MarketStatus, countdown: number) {
    this.server.to('market').emit(WsEvent.MARKET_STATUS, { status, countdown });
  }

  broadcastNews(news: { id: string; title: string; sentiment: string; relatedStockIds: string[] }) {
    this.server.to('market').emit(WsEvent.NEWS_PUBLISHED, news);
  }

  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  getConnectedCount() { return this.connectedClients; }
}
