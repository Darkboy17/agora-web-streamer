import { Module } from '@nestjs/common';
import { OrchestrateController } from './orchestrate.controller';
import { YoutubeModule } from '../youtube/youtube.module';
import { AgoraModule } from '../agora/agora.module';

@Module({
    imports: [YoutubeModule, AgoraModule],
    controllers: [OrchestrateController],
})
export class OrchestrateModule { }