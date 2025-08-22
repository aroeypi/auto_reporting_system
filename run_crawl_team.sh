#!/usr/bin/env bash
set -euo pipefail

# 1) 프로젝트 루트로 이동 (.env 읽히게)
cd /Users/piyeola/my-backend

# 2) 가상환경 파이썬 절대경로로 실행 (which python 결과로 교체)
PY="/Users/piyeola/venv/bin/python"

# 3) 크롤링 실행 → 표준출력/표준에러를 로그에 append
#    날짜/시간 프리픽스도 찍어두자
{
  echo "[$(date '+%F %T')] crawl_team start"
  "$PY" -m app.scripts.crawl_team
  echo "[$(date '+%F %T')] crawl_team end"
} >> logs/crawl_team.log 2>&1
