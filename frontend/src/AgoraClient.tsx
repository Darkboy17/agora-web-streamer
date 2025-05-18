import AgoraRTC from "agora-rtc-sdk-ng";
import { useRef, useEffect, useState } from "react";
import type {
    IAgoraRTCClient,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
    ClientRole
} from "agora-rtc-sdk-ng";

type Role = 'host' | 'audience';

const appId = import.meta.env.VITE_AGORA_APP_ID;
const token = import.meta.env.VITE_AGORA_TOKEN;
const channel = import.meta.env.VITE_AGORA_CHANNEL || 'queenlive';

const generateUid = () => {
    return Math.floor(Math.random() * 1000000000); // 9-digit number (Agora accepts up to 32-bit int)
};

const AgoraClient = () => {
    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const videoContainerRef = useRef<HTMLDivElement | null>(null); // 👈 New ref for video container
    const uid = generateUid();

    const [converterId, setConverterId] = useState('');
    const [joined, setJoined] = useState(false);

    const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
    const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);

    useEffect(() => {
        const client = AgoraRTC.createClient({ mode: "live", codec: "h264" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
            await client.subscribe(user, mediaType);

            if (mediaType === "video") {
                const remoteContainer = document.createElement("div");
                remoteContainer.id = generateUid().toString();
                remoteContainer.className = `
      w-full aspect-video
      rounded-lg overflow-hidden
      relative min-w-[320px] min-h-[180px]
    `;
                remoteContainer.style.width = "640px";
                remoteContainer.style.height = "480px";
                remoteContainer.textContent = `Audience UID: ${remoteContainer.id}`;
                videoContainerRef.current?.append(remoteContainer); // 👈 Append to container
                user.videoTrack?.play(remoteContainer);

            }

            if (mediaType === "audio") {
                user.audioTrack?.play();
            }
        });

        client.on("user-unpublished", (user) => {
            const remoteEl = document.getElementById(user.uid.toString());
            remoteEl?.remove();
        });

        return () => {
            client.leave();
        };
    }, []);


    const startYoutubeStream = async () => {
        const response = await fetch('http://localhost:5000/orchestrate/start-youtube-stream', {
            method: 'POST'
        });

        const data = await response.json();
        setConverterId(data.converterId);
    };

    const stopRtmpPush = async (converterId: string) => {
        await fetch('http://localhost:5000/stop-rtmp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ converterId })
        });
        console.log('RTMP push stopped');
    };

    const joinChannel = async (role: Role) => {
        try {
            const client = clientRef.current;
            if (!client) return;

            const userRole: ClientRole = role === 'host' ? 'host' : 'audience';
            const userUID: number = role === 'host' ? uid : generateUid();

            await client.join(appId, channel, token, userUID);
            client.setClientRole(userRole);

            if (role === 'host') {
                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                const videoTrack = await AgoraRTC.createCameraVideoTrack();

                localAudioTrackRef.current = audioTrack;
                localVideoTrackRef.current = videoTrack;

                await client.publish([audioTrack, videoTrack]);

                const localContainer = document.createElement("div");
                localContainer.textContent = `You (Host) UID: ${userUID}`;
                localContainer.id = uid.toString();


                localContainer.style.width = "640px";
                localContainer.style.height = "480px";

                videoContainerRef.current?.append(localContainer); // 👈 Append to container
                videoTrack.play(localContainer);

                // Optional: start streaming
                // await startYoutubeStream();
            }

            console.log(`Joined as ${role}`);
            setJoined(true);
        } catch (err) {
            console.error(`Failed to join as ${role}:`, err);
        }
    };

    const leaveChannel = async () => {
        const client = clientRef.current;
        if (!client) return;

        localAudioTrackRef.current?.close();
        localVideoTrackRef.current?.close();

        const localEl = document.getElementById(uid.toString());
        localEl?.remove();

        client.remoteUsers.forEach((user) => {
            const remoteEl = document.getElementById(user.uid.toString());
            remoteEl?.remove();
        });

        await client.leave();
        console.log("Left channel");
        setJoined(false);

        //await stopRtmpPush(converterId);
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-center p-6">
            <h2 className="text-3xl font-bold mb-6">Queenlive Web App</h2>

            <div className={`flex flex-col items-center justify-center w-full max-w-4xl ${joined ? 'flex-row-reverse' : 'flex-col'}`}>
                {/* 👇 Video container */}
                <div
                    ref={videoContainerRef}
                    className={`flex flex-wrap gap-4 justify-center items-center border border-gray-300 p-7 rounded-md bg-white transition-all duration-300 ${joined ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'
                        }`}
                />

                <div className="flex flex-col gap-4 w-full max-w-md mb-6">
                    {!joined &&
                        <button
                            onClick={() => joinChannel('host')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl shadow"
                        >
                            🎤 Join as Host
                        </button>
                    }
                    {!joined && <button
                        onClick={() => joinChannel('audience')}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-xl shadow"
                    >
                        👀 Join as Audience
                    </button>}
                    <button
                        onClick={leaveChannel}
                        className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-xl shadow"
                    >
                        🚪 Leave
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgoraClient;
