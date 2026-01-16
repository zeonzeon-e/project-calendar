import { NextResponse } from 'next/server';

// 전역 변수로 마지막 신호 시간 관리
// (Next.js 개발 모드에서도 유지되도록 globalThis 사용)
const globalState = globalThis as unknown as {
    heartbeatTimer?: NodeJS.Timeout;
    lastHeartbeat?: number;
};

const SHUTDOWN_DELAY = 5000; // 5초간 신호 없으면 종료

function startShutdownTimer() {
    if (globalState.heartbeatTimer) return;

    console.log('[System] Heartbeat monitor started. Auto-shutdown enabled.');

    globalState.heartbeatTimer = setInterval(() => {
        const now = Date.now();
        // 마지막 신호로부터 SHUTDOWN_DELAY 지났으면 종료
        if (globalState.lastHeartbeat && (now - globalState.lastHeartbeat > SHUTDOWN_DELAY)) {
            console.log('[System] No heartbeat detected. Shutting down...');
            process.exit(0);
        }
    }, 2000); // 2초마다 체크
}

export async function GET() {
    globalState.lastHeartbeat = Date.now();
    startShutdownTimer();
    return NextResponse.json({ status: 'alive' });
}
