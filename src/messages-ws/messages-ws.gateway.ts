import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from "socket.io";
import { JwtPayload } from '../auth/interfaces';
import { NewMessageDto } from './dtos/new-message.dto';
import { MessagesWsService } from './messages-ws.service';

@WebSocketGateway({cors:true})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect{
  
  @WebSocketServer() wss:Server;

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload
    try {
      payload = this.jwtService.verify(token)
      await this.messagesWsService.registerClient(client, payload.id)
    } catch (error) {
      client.disconnect();
      return;
    }
    this.messagesWsService.registerClient(client, payload.id);
    this.wss.emit('server:clients-updated', this.messagesWsService.getConnectedClients())
  }

  handleDisconnect(client: Socket) {
    this.messagesWsService.removeClient(client.id);
    this.wss.emit('server:clients-updated', this.messagesWsService.getConnectedClients())
  }

  @SubscribeMessage('front:message-oneUser')
  handleMessageFromClient(client:Socket, payload:NewMessageDto){
    
    //! Emite unicamente al cliente
    // client.emit('front:message-fromServer', {
    //   fullName: 'Soy yo',
    //   message: payload.message || 'no message'
    // })

    //! Emitir a todos MENOS, al cliente inicial
    // client.broadcast.emit('front:message-fromServer', {
    //   fullName: 'Soy yo',
    //   message: payload.message || 'no message'
    // })

    this.wss.emit('front:message-fromServer', {
      fullName: this.messagesWsService.getUserFullNameById(client.id),
      message: payload.message || 'no message'
    })

  }

}
