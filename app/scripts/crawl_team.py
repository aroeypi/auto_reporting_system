# scripts/crawl_team.py
import time
import pandas as pd
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import SessionLocal
from app.db.models import Team
from io import StringIO

URL = "https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; BallraeBot/1.0)"}
TIMEOUT = 10

# 팀명 -> 코드 매핑 (표시명이 변동될 수 있어 공백 제거/부분명도 대응)
TEAM_NAME_TO_CODE = {
    "LG": "LG",
    "한화": "HH",
    "롯데": "LT",
    "SSG": "SK",
    "KIA": "HT",
    "KT": "KT",
    "NC": "NC",
    "삼성": "SS",
    "두산": "OB",
    "키움": "WO",
}

def _normalize_team_name(name: str) -> str:
    # 표 내 공백/특수문자 방어
    return (name or "").strip().replace("\u3000", " ").replace("\xa0", " ")

def _name_to_code(name: str) -> str | None:
    n = _normalize_team_name(name)
    # 완전 일치 우선
    if n in TEAM_NAME_TO_CODE:
        return TEAM_NAME_TO_CODE[n]
    # 접두/부분 일치(예: 'SSG 랜더스' -> 'SSG')
    for key in TEAM_NAME_TO_CODE:
        if n.startswith(key) or key in n:
            return TEAM_NAME_TO_CODE[key]
    return None

def fetch_team_rankings(max_retries: int = 3, backoff: float = 1.5) -> pd.DataFrame:
    last_err = None
    for i in range(max_retries):
        try:
            resp = requests.get(URL, headers=HEADERS, timeout=TIMEOUT)
            resp.raise_for_status()
            resp.encoding = resp.apparent_encoding or "utf-8"

            soup = BeautifulSoup(resp.text, "html.parser")
            table = soup.select_one("table.tData") or soup.find("table")
            if table is None:
                raise ValueError("표를 찾지 못했습니다 (selector 변경 필요).")

            df_list = pd.read_html(StringIO(str(table)))
            if not df_list:
                raise ValueError("read_html 결과가 비었습니다.")
            df = df_list[0]

            # 다중헤더 방어
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(-1)

            # 컬럼 리네임(없는 경우 대비)
            rename_map = {
                '팀명': 'team_name', '경기': 'games', '승': 'wins', '패': 'losses', '무': 'draws',
                '승률': 'win_rate', '게임차': 'games_behind', '연속': 'streak',
                '홈': 'home_record', '방문': 'away_record'
            }
            df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

            # 필수 컬럼 보정
            required = ['team_name', 'games', 'wins', 'losses', 'draws', 'win_rate',
                        'games_behind', 'streak', 'home_record', 'away_record']
            for col in required:
                if col not in df.columns:
                    df[col] = None

            # 클린업
            for col in ['team_name', 'streak', 'home_record', 'away_record']:
                df[col] = df[col].astype(str).str.strip()

            for col in ['games', 'wins', 'losses', 'draws']:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)

            # 승률/게임차 숫자화(문자 '--' 방어). teams 테이블이 varchar면 str로 저장할 것.
            for col in ['win_rate', 'games_behind']:
                df[col] = pd.to_numeric(df[col].astype(str).str.replace('%', '').str.strip(),
                                        errors='coerce')

            df['rank'] = range(1, len(df) + 1)

            # 매핑된 team_code 추가(저장 시 업서트 키로 사용)
            df['team_code'] = df['team_name'].apply(_name_to_code)

            return df
        except Exception as e:
            last_err = e
            time.sleep(backoff ** i)
    raise last_err

def save_to_db(df: pd.DataFrame):
    db: Session = SessionLocal()
    try:
        got_lock = db.execute(text("SELECT pg_try_advisory_lock(1001)")).scalar()
        if not got_lock:
            print("[crawl_team] another sync is running; skipping")
            return

        created, updated, skipped = 0, 0, 0
        for _, row in df.iterrows():
            tname = _normalize_team_name(row['team_name'])
            tcode = row.get('team_code')

            if not tcode:
                print(f"[crawl_team] skip: unknown team name -> {tname}")
                skipped += 1
                continue

            # 팀코드 기준으로 업서트
            team = db.query(Team).filter(Team.team_code == tcode).first()
            # win_rate/games_behind 컬럼이 varchar 이므로 문자열로 저장
            win_rate_str = None if pd.isna(row['win_rate']) else str(row['win_rate'])
            gb_str = None if pd.isna(row['games_behind']) else str(row['games_behind'])

            if team:
                team.name = tname or team.name  # 표시용 이름 업데이트
                team.games = int(row['games'])
                team.wins = int(row['wins'])
                team.losses = int(row['losses'])
                team.draws = int(row['draws'])
                team.win_rate = win_rate_str
                team.games_behind = gb_str
                team.streak = row['streak']
                team.home_record = row['home_record']
                team.away_record = row['away_record']
                updated += 1
            else:
                team = Team(
                    team_code=tcode,
                    name=tname,
                    games=int(row['games']),
                    wins=int(row['wins']),
                    losses=int(row['losses']),
                    draws=int(row['draws']),
                    win_rate=win_rate_str,
                    games_behind=gb_str,
                    streak=row['streak'],
                    home_record=row['home_record'],
                    away_record=row['away_record'],
                )
                db.add(team)
                created += 1

        db.commit()
        print(f"[crawl_team] upsert done: created={created}, updated={updated}, skipped={skipped}")
    except Exception:
        db.rollback()
        raise
    finally:
        try:
            db.execute(text("SELECT pg_advisory_unlock(1001)"))
        except:
            pass
        db.close()

if __name__ == "__main__":
    df = fetch_team_rankings()
    save_to_db(df)
