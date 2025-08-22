# scripts/crawl_players.py
from __future__ import annotations

import json
import os
import re
import time
from io import StringIO
from typing import Dict, List, Optional, Tuple

import pandas as pd
from bs4 import BeautifulSoup
from playwright.sync_api import TimeoutError as PWTimeout
from playwright.sync_api import sync_playwright
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Player, Team, HitterStats, PitcherStats

# ----------------------------------
# 설정
# ----------------------------------

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)

# 반드시 실제 teamCode와 일치해야 함
TEAM_CODES = ["OB", "LT", "SS", "KT", "LG", "NC", "WO", "HT", "SK", "HH"]
TABS = ["hitter", "pitcher"]

DUMP_HTML_DIR = "/tmp/naver_dump"
DUMP_JSON_DIR = "/tmp/naver_sniff"
os.makedirs(DUMP_HTML_DIR, exist_ok=True)
os.makedirs(DUMP_JSON_DIR, exist_ok=True)

# ----------------------------------
# 유틸
# ----------------------------------

def _to_int(s: Optional[str]) -> Optional[int]:
    if s is None:
        return None
    s = re.sub(r"[^\d]", "", str(s))
    return int(s) if s else None

def _ip_to_outs(ip: Optional[str]) -> Optional[int]:
    """예: '123 2/3' → 123*3+2 = 371 아웃"""
    if not ip:
        return None
    m = re.match(r"(\d+)(?:\s+(\d)/3)?", str(ip))
    if not m:
        return None
    whole = int(m.group(1))
    frac = int(m.group(2)) if m.group(2) else 0
    return whole * 3 + frac

# ----------------------------------
# 표 → 표준 딕셔너리
# ----------------------------------

def normalize_hitter_row(row: Dict[str, str]) -> Dict:
    g = lambda *xs: next((row.get(k) for k in xs if k in row and str(row.get(k)) != ""), None)
    return {
        "name": g("선수", "이름", "타자", "선수명"),
        "g": _to_int(g("경기", "G")),
        "pa": _to_int(g("타석", "PA")),
        "ab": _to_int(g("타수", "AB")),
        "r": _to_int(g("득점", "R")),
        "h": _to_int(g("안타", "H")),
        "hr": _to_int(g("홈런", "HR")),
        "rbi": _to_int(g("타점", "RBI")),
        "sb": _to_int(g("도루", "SB")),
        "cs": _to_int(g("도실", "CS")),
        "bb": _to_int(g("볼넷", "BB")),
        "hbp": _to_int(g("사구", "HBP")),
        "so": _to_int(g("삼진", "SO")),
        "avg": g("타율", "AVG"),
        "obp": g("출루율", "OBP"),
        "slg": g("장타율", "SLG"),
        "ops": g("OPS"),
        "war": g("WAR"),
        "extra": {k: v for k, v in row.items()},
    }

def normalize_pitcher_row(row: Dict[str, str]) -> Dict:
    g = lambda *xs: next((row.get(k) for k in xs if k in row and str(row.get(k)) != ""), None)
    return {
        "name": g("선수", "이름", "투수", "선수명"),
        "g": _to_int(g("경기", "G")),
        "gs": _to_int(g("선발", "GS")),
        "w": _to_int(g("승", "W")),
        "l": _to_int(g("패", "L")),
        "sv": _to_int(g("세이브", "SV")),
        "hld": _to_int(g("홀드", "HLD")),
        "ip_outs": _ip_to_outs(g("이닝", "IP")),
        "h": _to_int(g("피안타", "H")),
        "hr": _to_int(g("피홈런", "HR")),
        "bb": _to_int(g("볼넷", "BB")),
        "hbp": _to_int(g("사구", "HBP")),
        "so": _to_int(g("탈삼진", "SO", "K")),
        "r": _to_int(g("실점", "R")),
        "er": _to_int(g("자책", "ER")),
        "era": g("평균자책", "ERA"),
        "whip": g("WHIP"),
        "war": g("WAR"),
        "extra": {k: v for k, v in row.items()},
    }

# ----------------------------------
# DB UPSERTS
# ----------------------------------

def upsert_player(db: Session, *, name: str, position: str, team_id: int, player_code: Optional[int]) -> int:
    if player_code:
        stmt = (
            pg_insert(Player.__table__)
            .values(player_code=player_code, name=name, position=position, team_id=team_id)
            .on_conflict_do_update(
                index_elements=["player_code"],
                set_={"name": name, "position": position, "team_id": team_id},
            )
            .returning(Player.id)
        )
        return db.execute(stmt).scalar()

    # player_code 미존재 시: 이름+팀으로 근사 (동명이인 리스크)
    p = db.query(Player).filter(Player.name == name, Player.team_id == team_id).first()
    if not p:
        p = Player(name=name, position=position, team_id=team_id)
        db.add(p)
        db.flush()
    return p.id

def upsert_hitter_stats(db: Session, season: str, player_id: int, team_id: int, d: Dict):
    stmt = (
        pg_insert(HitterStats.__table__)
        .values(
            season_code=season,
            player_id=player_id,
            team_id=team_id,
            g=d["g"],
            pa=d["pa"],
            ab=d["ab"],
            r=d["r"],
            h=d["h"],
            hr=d["hr"],
            rbi=d["rbi"],
            sb=d["sb"],
            cs=d["cs"],
            bb=d["bb"],
            hbp=d["hbp"],
            so=d["so"],
            avg=d["avg"],
            obp=d["obp"],
            slg=d["slg"],
            ops=d["ops"],
            war=d.get("war"),
            extra=d["extra"],
        )
        .on_conflict_do_update(
            constraint="uq_hitter_season_player",
            set_={
                "team_id": team_id,
                "g": d["g"],
                "pa": d["pa"],
                "ab": d["ab"],
                "r": d["r"],
                "h": d["h"],
                "hr": d["hr"],
                "rbi": d["rbi"],
                "sb": d["sb"],
                "cs": d["cs"],
                "bb": d["bb"],
                "hbp": d["hbp"],
                "so": d["so"],
                "avg": d["avg"],
                "obp": d["obp"],
                "slg": d["slg"],
                "ops": d["ops"],
                "war": d.get("war"),
                "extra": d["extra"],
            },
        )
    )
    db.execute(stmt)

def upsert_pitcher_stats(db: Session, season: str, player_id: int, team_id: int, d: Dict):
    stmt = (
        pg_insert(PitcherStats.__table__)
        .values(
            season_code=season,
            player_id=player_id,
            team_id=team_id,
            g=d["g"],
            gs=d["gs"],
            w=d["w"],
            l=d["l"],
            sv=d["sv"],
            hld=d["hld"],
            ip_outs=d["ip_outs"],
            h=d["h"],
            hr=d["hr"],
            bb=d["bb"],
            hbp=d["hbp"],
            so=d["so"],
            r=d["r"],
            er=d["er"],
            era=d["era"],
            whip=d["whip"],
            war=d.get("war"),
            extra=d["extra"],
        )
        .on_conflict_do_update(
            constraint="uq_pitcher_season_player",
            set_={
                "team_id": team_id,
                "g": d["g"],
                "gs": d["gs"],
                "w": d["w"],
                "l": d["l"],
                "sv": d["sv"],
                "hld": d["hld"],
                "ip_outs": d["ip_outs"],
                "h": d["h"],
                "hr": d["hr"],
                "bb": d["bb"],
                "hbp": d["hbp"],
                "so": d["so"],
                "r": d["r"],
                "er": d["er"],
                "era": d["era"],
                "whip": d["whip"],
                "war": d.get("war"),
                "extra": d["extra"],
            },
        )
    )
    db.execute(stmt)

# ----------------------------------
# 브라우저/파서
# ----------------------------------

def _scroll_to_bottom(page, steps=10, wait_ms=700):
    for _ in range(steps):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(wait_ms)

def _attach_json_sniffer(page, tag: str, store: list):
    seen = set()

    def on_response(resp):
        try:
            ctype = (resp.headers or {}).get("content-type", "")
        except Exception:
            ctype = ""
        url = resp.url
        if "application/json" in ctype and "sports" in url and url not in seen:
            seen.add(url)
            try:
                data = resp.json()
            except Exception:
                return
            # 메모리에도 보관
            store.append({"url": url, "data": data})
            # 파일도 저장
            out_path = os.path.join(DUMP_JSON_DIR, f"{tag}_{len(seen)}.json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump({"url": url, "data": data}, f, ensure_ascii=False, indent=2)
            print(f"[JSON] saved: {out_path}")

    page.on("response", on_response)

def _extract_table_like_html(page) -> Optional[str]:
    # 1) <table>
    t = page.locator("table").first
    if t.count() > 0:
        return "<table>" + t.inner_html() + "</table>"

    # 2) role=table
    rt = page.get_by_role("table").first
    if rt.count() > 0:
        return "<table>" + rt.inner_html() + "</table>"

    # 3) ul/li 가상 테이블
    uls = page.locator("ul")
    for i in range(min(10, uls.count())):
        ul = uls.nth(i)
        lis = ul.locator("li")
        if lis.count() > 1:
            header_texts = lis.nth(0).locator("*").all_text_contents()
            headers = [h.strip() for h in header_texts if h.strip()]
            rows = []
            for j in range(1, min(lis.count(), 200)):
                cells = lis.nth(j).locator("*").all_text_contents()
                cells = [c.strip() for c in cells if c.strip()]
                if cells:
                    rows.append(cells)
            if rows and headers:
                col_html = "".join(f"<th>{h}</th>" for h in headers[: len(rows[0])])
                body_html = "".join(
                    "<tr>" + "".join(f"<td>{c}</td>" for c in r[: len(rows[0])]) + "</tr>" for r in rows
                )
                return f"<table><thead><tr>{col_html}</tr></thead><tbody>{body_html}</tbody></table>"

    # 4) iframe 내부
    for f in page.frames:
        try:
            t2 = f.locator("table").first
            if t2.count() > 0:
                return "<table>" + t2.inner_html() + "</table>"
        except Exception:
            pass
    return None

def extract_player_codes_from_links(soup: BeautifulSoup) -> Dict[str, int]:
    mapping: Dict[str, int] = {}
    # 선수 이름이 앵커 텍스트로 붙고, href에 playerId= 또는 pid=가 포함되는 경우 대응
    for a in soup.find_all("a"):
        name = a.get_text(strip=True)
        href = a.get("href") or ""
        m = re.search(r"(?:playerId|pid)=(\d+)", href)
        if name and m:
            mapping[name] = int(m.group(1))
    return mapping

def try_parse_from_json(sniffed_json: List[dict], tab: str) -> Optional[pd.DataFrame]:
    """
    네이버 내부 JSON 응답에서 표 데이터를 바로 뽑아낸다.
    구조가 바뀔 수 있어서 넓게 탐색한다. (keys에 stat, player, hitter/pitcher 등이 있으면 매칭)
    """
    candidates: List[pd.DataFrame] = []
    for blob in sniffed_json:
        data = blob.get("data")
        if not isinstance(data, (dict, list)):
            continue

        # dict 루트: 리스트를 깊게 탐색
        stack = [data]
        while stack:
            cur = stack.pop()
            if isinstance(cur, dict):
                for v in cur.values():
                    stack.append(v)
            elif isinstance(cur, list):
                # 리스트가 레코드 후보인지 검사
                if cur and isinstance(cur[0], dict):
                    sample_keys = set(cur[0].keys())
                    # 타자/투수 표에 자주 포함되는 키로 휴리스틱
                    hit_keys = {"name", "playerName", "avg", "ops", "ab", "hr", "rbi"}
                    pit_keys = {"name", "playerName", "era", "whip", "ip", "so", "w", "l", "sv"}

                    if (tab == "hitter" and sample_keys & hit_keys) or (tab == "pitcher" and sample_keys & pit_keys):
                        # 카드/중첩 키도 평탄화
                        rows = []
                        for it in cur:
                            flat = {}
                            for k, v in it.items():
                                if isinstance(v, dict):
                                    for k2, v2 in v.items():
                                        flat[f"{k}.{k2}"] = v2
                                else:
                                    flat[k] = v
                            rows.append(flat)
                        try:
                            df = pd.DataFrame(rows)
                            if len(df) > 0:
                                candidates.append(df)
                        except Exception:
                            pass
                else:
                    for v in cur:
                        stack.append(v)

    # 우선순위: 컬럼수가 많은 것 → 행이 많은 것
    if candidates:
        candidates.sort(key=lambda d: (d.shape[1], d.shape[0]), reverse=True)
        return candidates[0]
    return None

def fetch_table(season: str, tab: str, team_code: str) -> Tuple[pd.DataFrame, BeautifulSoup]:
    """
    1) JSON 스니핑으로 시도 → 성공 시 그걸로 DF 생성
    2) 실패 시 렌더링된 DOM에서 table/role=table/ul-li 가상테이블을 추출해 DF 생성
    """
    url = f"https://m.sports.naver.com/kbaseball/record/kbo?seasonCode={season}&tab={tab}&teamCode={team_code}"

    sniffed_json: List[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(user_agent=UA, locale="ko-KR", viewport={"width": 430, "height": 900})
        page = ctx.new_page()
        _attach_json_sniffer(page, f"{team_code}_{tab}", sniffed_json)

        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        try:
            page.wait_for_load_state("networkidle", timeout=15_000)
        except PWTimeout:
            pass

        _scroll_to_bottom(page, steps=10, wait_ms=700)
        try:
            page.wait_for_selector("table, [role='table'], ul li", timeout=10_000)
        except PWTimeout:
            _scroll_to_bottom(page, steps=6, wait_ms=700)

        # HTML 덤프 저장 (디버깅)
        full_html = page.content()
        dump_path = os.path.join(DUMP_HTML_DIR, f"{team_code}_{tab}.html")
        with open(dump_path, "w", encoding="utf-8") as f:
            f.write(full_html)
        print(f"[DUMP] saved: {dump_path}")

        # 1) JSON 직파싱 시도
        df_json = try_parse_from_json(sniffed_json, tab)
        if df_json is not None and len(df_json) > 0:
            soup = BeautifulSoup(full_html, "html.parser")
            browser.close()
            return df_json.fillna(""), soup

        # 2) DOM에서 테이블류 추출
        table_like_html = _extract_table_like_html(page)
        soup = BeautifulSoup(full_html, "html.parser")
        browser.close()

    if not table_like_html:
        raise ValueError("표를 찾지 못했습니다. 셀렉터를 확인하세요.")

    # pandas로 읽기
    dfs = pd.read_html(StringIO(table_like_html))
    if not dfs:
        raise ValueError("read_html failed.")
    df = dfs[0]
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(-1)
    return df.fillna(""), soup

# ----------------------------------
# 엔트리
# ----------------------------------

def crawl_players_all(season: str = "2025"):
    db: Session = SessionLocal()
    try:
        # 동시 실행 잠금
        if not db.execute(text("SELECT pg_try_advisory_lock(2101)")).scalar():
            print("[players] another run in progress")
            return

        for code in TEAM_CODES:
            team = db.query(Team).filter(Team.team_code == code).first()
            if not team:
                print(f"[players] skip: team_code {code} not found")
                continue

            for tab in TABS:
                try:
                    df, soup = fetch_table(season, tab, code)
                    name_to_code = extract_player_codes_from_links(soup)

                    # 컬럼명 정규화: 상위 헤더/빈 헤더 제거
                    df.columns = [str(c).strip() for c in df.columns]
                    # 이름 컬럼 추정(네이버 표마다 다를 수 있음)
                    if "선수" not in df.columns and "이름" not in df.columns and "선수명" not in df.columns:
                        # 첫 컬럼이 순위라면 두 번째가 이름인 경우 多
                        if df.columns and (df.columns[0] in ("순위", "순", "No", "랭킹")) and len(df.columns) >= 2:
                            # 임시로 두 번째 컬럼명을 '선수'로 태그
                            cols = list(df.columns)
                            cols[1] = "선수"
                            df.columns = cols

                    for row in df.to_dict(orient="records"):
                        if tab == "hitter":
                            d = normalize_hitter_row(row)
                            if not d["name"]:
                                continue
                            pid = upsert_player(
                                db,
                                name=d["name"],
                                position="B",
                                team_id=team.id,
                                player_code=name_to_code.get(d["name"]),
                            )
                            upsert_hitter_stats(db, season, pid, team.id, d)
                        else:
                            d = normalize_pitcher_row(row)
                            if not d["name"]:
                                continue
                            pid = upsert_player(
                                db,
                                name=d["name"],
                                position="P",
                                team_id=team.id,
                                player_code=name_to_code.get(d["name"]),
                            )
                            upsert_pitcher_stats(db, season, pid, team.id, d)

                    db.commit()
                    print(f"[players] {code} {tab} ok: {len(df)} rows")
                except Exception as e:
                    db.rollback()
                    print(f"[players] {code} {tab} failed: {e}")
                time.sleep(0.9)

    finally:
        try:
            db.execute(text("SELECT pg_advisory_unlock(2101)"))
        except Exception:
            pass
        db.close()

if __name__ == "__main__":
    crawl_players_all("2025")
