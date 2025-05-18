import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as moment from 'moment-timezone';

dotenv.config();

@Injectable()
export class YoutubeService {
    private youtube = google.youtube('v3');
    private logger = new Logger(YoutubeService.name);

    async getAuthClient() {
        const oauth2Client = new google.auth.OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            process.env.REDIRECT_URI
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN,
        });

        return oauth2Client;
    }

    async createLiveStream(auth: any) {
        const response = await this.youtube.liveStreams.insert({
            auth,
            part: ['snippet', 'cdn', 'contentDetails'],
            requestBody: {
                snippet: {
                    title: 'Live Stream via API',
                    description: 'Stream created using YouTube Live Streaming API',
                },
                cdn: {
                    format: '1080p',
                    ingestionType: 'rtmp',
                    resolution: '1080p',
                    frameRate: '60fps'
                },
                contentDetails: {
                    isReusable: true,
                },
            },
        });

        return response.data;
    }

    async createBroadcast(auth: any, madeForKids = false) {

        const waitTime = 1 * 60 * 1000; // 1 minute
        const scheduledStartTime = new Date(Date.now() + waitTime).toISOString(); // 1 minute from now

        const response = await this.youtube.liveBroadcasts.insert({
            auth,
            part: ['snippet', 'status', 'contentDetails'],
            requestBody: {
                snippet: {
                    title: 'Mock QueenLive Scheduled Broadcast using Agora\'s Media Push',
                    scheduledStartTime,
                    description: 'Live stream automated via YouTube API',
                },
                status: {
                    privacyStatus: 'public',
                    selfDeclaredMadeForKids: madeForKids
                },
                contentDetails: {
                    monitorStream: { enableMonitorStream: true },
                    enableAutoStart: true,
                    enableAutoStop: true
                },
            },
        });

        return { ...response.data, scheduledStartTime, waitTime };
    }

    async bindBroadcastToStream(auth: any, broadcastId: string, streamId: string) {
        const response = await this.youtube.liveBroadcasts.bind({
            auth,
            part: ['id', 'snippet'],
            id: broadcastId,
            streamId: streamId,
        });

        return response.data;
    }

    convertUTCToTimezone(utc: string, timezone: string) {
        return moment.utc(utc).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
    }

    async getStreamKeyAndRtmpUrl(): Promise<{ streamKey: string; rtmpUrl: string; startTime: number }> {
        const auth = await this.getAuthClient();
        this.logger.log('Authenticated with YouTube API');

        const liveStream = await this.createLiveStream(auth);
        this.logger.log(`Created live stream: ${JSON.stringify(liveStream)}`);

        const broadcast = await this.createBroadcast(auth, false);
        this.logger.log(`Created broadcast: ${JSON.stringify(broadcast)}`);

        await this.bindBroadcastToStream(auth, broadcast.id!, liveStream.id!);
        this.logger.log(`Bound broadcast ${broadcast.id} to stream ${liveStream.id}`);

        const ingestInfo = liveStream.cdn?.ingestionInfo;
        if (!ingestInfo) {
            this.logger.error('Failed to get ingestion info from YouTube');
            throw new Error('Failed to get ingestion info from YouTube');
        }

        this.logger.log(`RTMP URL: ${ingestInfo.ingestionAddress}, Stream Key: ${ingestInfo.streamName}`);

        return {
            streamKey: ingestInfo.streamName!,
            rtmpUrl: ingestInfo.ingestionAddress!,
            startTime: broadcast.waitTime!,
        };
    }

}