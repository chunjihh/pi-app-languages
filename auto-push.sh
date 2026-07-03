#!/bin/bash
# 🌍 아랑's 다국어 자동 순환 요새 최종 통합 마스터 엔진 (Push & Pull 올인원)
CDIR="/data/global_languages/shared"
cd $CDIR

# 타이머 카운터 초기화 (10초에 한 번씩 돌기 때문에, 6번 돌면 1분 / 30번 돌면 5분)
PULL_COUNTER=0

while true; do
    # ----------------------------------------------------------------------
    # [파트 1] 수집 및 발사 (PUSH) 엔진
    # ----------------------------------------------------------------------
    # 내 컴퓨터 도커(app.js)가 수집한 ko.json에 변동 사항이 포착되었는가?
    if git status --porcelain | grep -q "ko.json"; then
        echo "🚨 [순환 엔진] ko.json 동적 변동 감지! 5분(300초)간 트래픽 모으기 돌입..."
        sleep 300  # 5분간 댓글 및 상품명 변동분을 묵직하게 버퍼링
        
        git add ko.json
        git commit -m "feat: 파이 네트워크 동적 데이터 실시간 누적 반영"
        git push origin main
        echo "✅ [순환 엔진] 5분간 모인 원본 데이터를 깃허브 금고로 슛 완료!"
    fi

    # ----------------------------------------------------------------------
    # [파트 2] 회수 및 서빙 (PULL) 엔진
    # ----------------------------------------------------------------------
    # 1분(60초)마다 한 번씩 깃허브 로봇이 구워놓은 최신 26개국 번역본 회수하기
    if [ $PULL_COUNTER -ge 6 ]; then
        echo "⏳ [순환 엔진] 1분 정기 검진: 깃허브 로봇이 구운 최신 26개국 번역본을 수색합니다..."
        
        # 깃허브 원격 서버 상태를 찔러보고 최신 번역본이 있다면 강제로 다운로드(Pull)
        git fetch origin main
        
        # 로컬과 원격의 싱크 차이가 있다면 가져와서 덮어씌움
        if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
            git pull origin main
            echo "📥 [순환 엔진 완료] 깃허브 로봇표 최신 26개국 번역본 내 컴퓨터 보관소로 입고 완료! 🚀"
        fi
        
        PULL_COUNTER=0 # 카운터 초기화
    fi

    # 10초 쉼호흡 및 카운터 증가 (서버 CPU 부하 0% 유지 비결)
    sleep 60
    PULL_COUNTER=$((PULL_COUNTER + 1))
done
