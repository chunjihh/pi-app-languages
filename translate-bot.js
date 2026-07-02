const fs = require('fs');
const path = require('path');

// 1. 26개국 타겟 언어 목록 (HTML select value 매칭)
const targetLanguages = [
    'en', 'ja', 'zh-CN', 'zh-TW', 'vi', 'id', 'ms', 'th', 'tl', 
    'hi', 'bn', 'ur', 'fr', 'de', 'es', 'pt', 'it', 'ru', 'uk', 
    'pl', 'nl', 'tr', 'ro', 'ar', 'fa', 'sw'
];

// 순수 웹 엔드포인트 우회 번역 함수 (도커 내부망 에러 원천 차단)
async function googleTranslateAlternative(text, targetLang) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // 구글 파싱 레이아웃에서 번역 텍스트 추출
        if (data && data[0] && data[0][0]) {
            return data[0][0][0];
        }
        return text;
    } catch (e) {
        return text; // 에러 시 원본 반환
    }
}

async function runTranslationBot() {
    try {
        const koPath = path.join(__dirname, 'ko.json');
        if (!fs.existsSync(koPath)) {
            console.error("❌ 기준이 되는 ko.json 파일이 없습니다.");
            return;
        }
        const koData = JSON.parse(fs.readFileSync(koPath, 'utf8'));
        console.log("🚀 ==================================================");
        console.log("🤖 아랑's 초경량 우회 엔진 기반 27개국 번역 가동...");
        console.log("🚀 ==================================================");

        for (const lang of targetLanguages) {
            const translatedJson = {};
            console.log(`⏳ [실시간 통역] ko ➡️ ${lang} 파일 제조 시작...`);

            for (const key of Object.keys(koData)) {
                const sourceText = koData[key];
                // 순수 fetch 우회 함수 호출
                translatedJson[key] = await googleTranslateAlternative(sourceText, lang);
            }

            const outputPath = path.join(__dirname, `${lang}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(translatedJson, null, 2), 'utf8');
            console.log(`✅ [제조 완료] ${lang}.json 안착 성공!`);
            
            // 안전망 차단 방지 미세 딜레이 (0.3초)
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        console.log("🏆 27개국 전체 마스터 다국어 JSON 빌드 완수!");
    } catch (error) {
        console.error("💀 봇 가동 중 에러 발생:", error);
    }
}

runTranslationBot();
