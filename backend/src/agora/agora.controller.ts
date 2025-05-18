import { Controller, Post, Body } from '@nestjs/common';
import { AgoraService } from './agora.service';

@Controller()
export class AgoraController {
    constructor(private readonly agora: AgoraService) { }

    @Post('start-rtmp')
    async startRtmp(
        @Body('streamKey') streamKey: string,

        @Body('rtmpUrl') rtmpUrl: string,
    ) {
        // Pass streamKey and rtmpUrl to the service
        const converterId = await this.agora.startRtmpPush(streamKey, rtmpUrl);
        return { converterId };
    }

    @Post('stop-rtmp')
    async stopRtmp(@Body('converterId') converterId: string) {
        await this.agora.stopRtmpPush(converterId);
        return { success: true };
    }
}