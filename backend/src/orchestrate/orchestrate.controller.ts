import { Controller, Post } from '@nestjs/common';
import { YoutubeService } from '../youtube/youtube.service';
import { AgoraService } from '../agora/agora.service';

@Controller('orchestrate')
export class OrchestrateController {
    constructor(
        private readonly youtube: YoutubeService,
        private readonly agora: AgoraService,
    ) { }

    @Post('start-youtube-stream')
    async startYoutubeStream() {
        // Step 1: Get YouTube RTMP info
        const { streamKey, rtmpUrl, startTime } = await this.youtube.getStreamKeyAndRtmpUrl();

        // Step 2: Start Agora RTMP push
        const converterId = await new Promise<string>((resolve) => {
            setTimeout(async () => {
            const id = await this.agora.startRtmpPush(rtmpUrl, streamKey);
            resolve(id);
            }, startTime);
        });

        return { converterId, streamKey, rtmpUrl };
    }

}