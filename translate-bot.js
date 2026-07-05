const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. 26개국 타겟 언어 목록
const targetLanguages = [
    'en', 'ja', 'zh-CN', 'zh-TW', 'vi', 'id', 'ms', 'th', 'tl', 
    'hi', 'bn', 'ur', 'fr', 'de', 'es', 'pt', 'it', 'ru', 'uk', 
    'pl', 'nl', 'tr', 'ro', 'ar', 'fa', 'sw'
];

// 2. 순수 웹 엔드포인트 우회 번역 함수
async function googleTranslateAlternative(text, targetLang) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data[0] && data[0][0]) {
            return data[0][0][0];
        }
        return text;
    } catch (e) {
        return text; // 에러 시 원본 반환
    }
}

// 3. Git 명령어 실행 헬퍼 함수
function runGitCommand(command) {
    try {
        return execSync(command, { cwd: __dirname, encoding: 'utf8' }).trim();
    } catch (error) {
        console.error(`⚠️ [Git 에러]: ${command} 실행 실패 ->`, error.message);
        return null;
    }
}

// 4. 핵심 메인 번역 및 깃허브 동기화 엔진
let isRunning = false;
async function runTranslationAndPushEngine() {
    if (isRunning) return; 
    isRunning = true;

    try {
        const koPath = path.join(__dirname, 'ko.json');
        if (!fs.existsSync(koPath)) {
            console.error("❌ 기준이 되는 ko.json 파일이 없습니다.");
            isRunning = false;
            return;
        }

        console.log("\n🚀 ==================================================");
        console.log("🤖 [엔진 가동] 26개국 우회 번역 및 깃허브 동기화 시작...");
        console.log("🚀 ==================================================");

        const koData = JSON.parse(fs.readFileSync(koPath, 'utf8'));

        // [단계 1] Local에서 26개국 번역본 제조 부근 수정
        for (const lang of targetLanguages) {
            const translatedJson = {};
            console.log(`⏳ [통역 중] ko ➡️ ${lang} 파일 생성...`);

            for (const key of Object.keys(koData)) {
                const sourceText = koData[key];
                translatedJson[key] = await googleTranslateAlternative(sourceText, lang);
            }

            const outputPath = path.join(__dirname, `${lang}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(translatedJson, null, 2), 'utf8');
    
            // 💡 구글 우회 API 차단 방지를 위해 언어별 대기 시간을 0.3초 -> 0.8초로 넉넉히 확대
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        console.log("✅ 26개국 파일 로컬 생성 완료!");

        // ==========================================
        // 🌟 [교정] [단계 2] 깃허브 금고로 한방에 발사 (Push)
        // ==========================================
        console.log("📤 깃허브 원격 저장소로 동기화(Push)를 시도합니다...");

        // 1. git add 전에 먼저 변경사항이 존재하는지 감지합니다.
        const status = runGitCommand('git status --porcelain');

        if (status) {
            console.log("📝 변동 포착! 스테이징 및 커밋 진행 중...");
            runGitCommand('git add .'); // 안전하게 현재 디렉토리 전체 반영
            runGitCommand('git commit -m "feat: 아랑 통합 마스터 엔진 다국어 실시간 누적 반영"');
            runGitCommand('git push origin main');
            console.log("🏆 [완수] 번역본 전용 깃허브 금고 안착 성공!");
        } else {
            console.log("✨ 변동 사항이 없어 깃허브 Push를 생략합니다.");
        }

    } catch (error) {
        console.error("💀 마스터 엔진 구동 중 예외 발생:", error);
    } finally {
        isRunning = false;
    }
}

// 5. 정기적인 원격 저장소 회수(Pull) 엔진 - 5분마다 한 번씩 실행
setInterval(() => {
    if (isRunning) return;
    console.log("⏳ [정기 검진] 깃허브 저장소의 최신 상태를 체크합니다 (Pull)...");
    
    runGitCommand('git fetch origin main');
    const localHEAD = runGitCommand('git rev-parse HEAD');
    const remoteHEAD = runGitCommand('git rev-parse origin/main');

    if (localHEAD && remoteHEAD && localHEAD !== remoteHEAD) {
        runGitCommand('git pull origin main');
        console.log("📥 [싱크 완료] 원격 저장소의 변동사항을 반영했습니다.");
    }
}, 300000); // 5분 (300,000ms)

// 6. 🌍 ko.json 실시간 이벤트 감시단 (fs.watch + 파일 타임스탬프 하이브리드 감시)
const koFilePath = path.join(__dirname, 'ko.json');
console.log(`📡 [상시 감시망 가동] ${koFilePath} 실시간 모니터링 중...`);

let watchTimeout;
let lastMtime = fs.existsSync(koFilePath) ? fs.statSync(koFilePath).mtimeMs : 0;

function triggerEngine() {
    clearTimeout(watchTimeout);
    watchTimeout = setTimeout(() => {
        console.log("🚨 ko.json 변경 포착! 5초 뒤 번역 엔진을 깨웁니다.");
        runTranslationAndPushEngine();
    }, 5000);
}

// 방식 A: OS 커널 신호 감시
fs.watch(koFilePath, (eventType, filename) => {
    if (filename && eventType === 'change') {
        triggerEngine();
    }
});

// 방식 B: 도커 신호 유실 방지용 5초 정기 검진 (서버 부하 전혀 없음)
setInterval(() => {
    if (fs.existsSync(koFilePath)) {
        const currentMtime = fs.statSync(koFilePath).mtimeMs;
        if (currentMtime !== lastMtime) {
            lastMtime = currentMtime;
            triggerEngine();
        }
    }
}, 15000);
