import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgoraService } from './agora/agora.service';
import { AgoraController } from './agora/agora.controller';
import { OrchestrateModule } from './orchestrate/orchestrate.module';

@Module({
  imports: [OrchestrateModule],
  controllers: [AppController, AgoraController],
  providers: [AppService, AgoraService],
})
export class AppModule { }
