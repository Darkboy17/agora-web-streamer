import { Injectable, HttpException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

@Injectable()
export class AgoraService {
    private readonly config = {
        appId: process.env.AGORA_APP_ID || '',
        customerKey: process.env.AGORA_CUSTOMER_ID || '',
        customerSecret: process.env.AGORA_CUSTOMER_SECRET || '',
        region: process.env.AGORA_REGION,
        channel: process.env.AGORA_CHANNEL,
        uid: 201,
        youtubeStreamKey: process.env.YOUTUBE_STREAM_KEY || '',
        youtubeRtmpUrl: process.env.YOUTUBE_RTMP_URL
    };

    // The axios instance, styled just like your Express code
    private agoraApi = axios.create({
        baseURL: `https://api.agora.io/${this.config.region}/v1/projects/${this.config.appId}`,
        headers: {
            'Authorization': `Basic ${Buffer.from(`${this.config.customerKey}:${this.config.customerSecret}`).toString('base64')}`,
            'Content-Type': 'application/json'
        }
    });

    async startRtmpPush(youtubeRtmpUrl: string, youtubeStreamKey: string) {
        console.log('Starting RTMP push to YouTube:', youtubeRtmpUrl, youtubeStreamKey);
        try {
            const resp = await this.agoraApi.post('/rtmp-converters', {
                converter: {
                    name: `youtube_push_${Date.now()}`,
                    "transcodeOptions": {
                        "rtcChannel": "queenlive",
                        "audioOptions": {
                            "codecProfile": "HE-AAC",
                            "sampleRate": 48000,
                            "bitrate": 128,
                            "audioChannels": 1,
                            "rtcStreamUids": [
                                201,
                                202
                            ]
                        },
                        "videoOptions": {
                            "canvas": {
                                "width": 360,
                                "height": 640,
                                "color": 0
                            },
                            "layout": [
                                {
                                    "rtcStreamUid": 201,
                                    "region": {
                                        "xPos": 0,
                                        "yPos": 0,
                                        "zIndex": 1,
                                        "width": 360,
                                        "height": 640
                                    },
                                    "fillMode": "fill",
                                    "placeholderImageUrl": "http://example/host_placeholder.jpg"
                                },
                                {
                                    "rtcStreamUid": 202,
                                    "region": {
                                        "xPos": 0,
                                        "yPos": 320,
                                        "zIndex": 1,
                                        "width": 360,
                                        "height": 320
                                    }
                                }
                            ],
                            "codec": "H.264",
                            "codecProfile": "high",
                            "frameRate": 30,
                            "gop": 60,
                            "bitrate": 6000,
                            "layoutType": 1,
                            "vertical": {
                                "maxResolutionUid": 201,
                                "fillMode": "fill",
                                "refreshIntervalSec": 4
                            },
                            "defaultPlaceholderImageUrl": "http://example/host_placeholder.jpg",
                            "seiOptions": {
                                "source": {
                                    "metadata": true,
                                    "datastream": true,
                                    "customized": {
                                        "payload": "example"
                                    }
                                },
                                "sink": {
                                    "type": 100
                                }
                            }
                        }
                    },
                    rtmpUrl: youtubeRtmpUrl + "/" + youtubeStreamKey,
                    "idleTimeout": 300
                }
            });
            return resp.data.converter.id;
        } catch (err) {
            throw new HttpException(
                err.response?.data || err.message,
                err.response?.status || 500
            );
        }
    }

    async stopRtmpPush(converterId: string) {
        try {
            await this.agoraApi.delete(`/rtmp-converters/${converterId}`);
        } catch (err) {
            throw new HttpException(
                err.response?.data || err.message,
                err.response?.status || 500
            );
        }
    }
}