import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsEvent, MarketStatus } from '@mocktrade/shared';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/' })
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MarketGateway.name);
  private connectedClients = 0;

  handleConnection(client: Socket) {
    this.connectedClients++;
    client.join('market');
    this.logger.log(`Connected: ${client.id} (${this.connectedClients})`);
  }

  handleDisconnect() { this.connectedClients--; }

  @SubscribeMessage('subscribe:stock')
  handleSubscribeStock(client: Socket, stockId: string) { client.join(`stock:${stockId}`); }

  @SubscribeMessage('unsubscribe:stock')
  handleUnsubscribeStock(client: Socket, stockId: string) { client.leave(`stock:${stockId}`); }

  @SubscribeMessage('subscribe:user')
  handleSubscribeUser(client: Socket, userId: string) { client.join(`user:${userId}`); }

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
