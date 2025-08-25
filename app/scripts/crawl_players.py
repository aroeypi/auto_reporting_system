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

# -----------------------------
# 설정
# -----------------------------
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)

TEAM_CODES = ["OB", "LT", "SS", "KT", "LG", "NC", "WO", "HT", "SK", "HH"]
TABS = ["hitter", "pitcher"]

DUMP_HTML_DIR = "/tmp/naver_dump"
DUMP_JSON_DIR = "/tmp/naver_sniff"
os.makedirs(DUMP_HTML_DIR, exist_ok=True)
os.makedirs(DUMP_JSON_DIR, exist_ok=True)

# -----------------------------
# 유틸
# -----------------------------
def _to_int(s: Optional[str]) -> Optional[int]:
    if s is None:
        return None
    s = re.sub(r"[^\d]", "", str(s))
    return int(s) if s else None

def _ip_to_outs(ip: Optional[str]) -> Optional[int]:
    """예: '123 2/3' → 123*3+2"""
    if not ip:
        return None
    m = re.match(r"(\d+)(?:\s+(\d)/3)?", str(ip))
    if not m:
        return None
    whole = int(m.group(1))
    frac = int(m.group(2)) if m.group(2) else 0
    return whole * 3 + frac

def _normalize_columns(cols) -> List[str]:
    if isinstance(cols, pd.MultiIndex):
        cols = cols.get_level_values(-1)
    return [str(c).strip() if c is not None else "" for c in list(cols)]

# -----------------------------
# 표 → 표준 딕셔너리
# -----------------------------
def normalize_hitter_row(row: Dict[str, str]) -> Dict:
    g = lambda *xs: next((row.get(k) for k in xs if k in row and str(row.get(k)) != ""), None)
    return {
        "name": g("선수", "이름", "타자", "선수명", "name", "playerName"),
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
        "name": g("선수", "이름", "투수", "선수명", "name", "playerName"),
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

# -----------------------------
# DB UPSERTS
# -----------------------------
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
            season_code=season, player_id=player_id, team_id=team_id,
            g=d["g"], pa=d["pa"], ab=d["ab"], r=d["r"], h=d["h"],
            hr=d["hr"], rbi=d["rbi"], sb=d["sb"], cs=d["cs"], bb=d["bb"],
            hbp=d["hbp"], so=d["so"], avg=d["avg"], obp=d["obp"], slg=d["slg"],
            ops=d["ops"], war=d.get("war"), extra=d["extra"],
        )
        .on_conflict_do_update(
            constraint="uq_hitter_season_player",
            set_={
                "team_id": team_id, "g": d["g"], "pa": d["pa"], "ab": d["ab"], "r": d["r"],
                "h": d["h"], "hr": d["hr"], "rbi": d["rbi"], "sb": d["sb"], "cs": d["cs"],
                "bb": d["bb"], "hbp": d["hbp"], "so": d["so"], "avg": d["avg"], "obp": d["obp"],
                "slg": d["slg"], "ops": d["ops"], "war": d.get("war"), "extra": d["extra"],
            },
        )
    )
    db.execute(stmt)

def upsert_pitcher_stats(db: Session, season: str, player_id: int, team_id: int, d: Dict):
    stmt = (
        pg_insert(PitcherStats.__table__)
        .values(
            season_code=season, player_id=player_id, team_id=team_id,
            g=d["g"], gs=d["gs"], w=d["w"], l=d["l"], sv=d["sv"], hld=d["hld"],
            ip_outs=d["ip_outs"], h=d["h"], hr=d["hr"], bb=d["bb"], hbp=d["hbp"],
            so=d["so"], r=d["r"], er=d["er"], era=d["era"], whip=d["whip"],
            war=d.get("war"), extra=d["extra"],
        )
        .on_conflict_do_update(
            constraint="uq_pitcher_season_player",
            set_={
                "team_id": team_id, "g": d["g"], "gs": d["gs"], "w": d["w"], "l": d["l"],
                "sv": d["sv"], "hld": d["hld"], "ip_outs": d["ip_outs"], "h": d["h"],
                "hr": d["hr"], "bb": d["bb"], "hbp": d["hbp"], "so": d["so"], "r": d["r"],
                "er": d["er"], "era": d["era"], "whip": d["whip"], "war": d.get("war"),
                "extra": d["extra"],
            },
        )
    )
    db.execute(stmt)

# -----------------------------
# 브라우저/네트워크
# -----------------------------
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
            store.append({"url": url, "data": data})
            out_path = os.path.join(DUMP_JSON_DIR, f"{tag}_{len(seen)}.json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump({"url": url, "data": data}, f, ensure_ascii=False, indent=2)
            print(f"[JSON] saved: {out_path}")
    page.on("response", on_response)

def _extract_player_codes_from_links(soup: BeautifulSoup) -> Dict[str, int]:
    mapping: Dict[str, int] = {}
    for a in soup.find_all("a"):
        name = a.get_text(strip=True)
        href = a.get("href") or ""
        m = re.search(r"(?:playerId|pid)=(\d+)", href)
        if name and m:
            mapping[name] = int(m.group(1))
    return mapping

# -----------------------------
# JSON → DataFrame (유연 탐색)
# -----------------------------
def _flatten_records(lst: List[dict]) -> pd.DataFrame:
    rows = []
    for it in lst:
        if isinstance(it, dict):
            flat = {}
            for k, v in it.items():
                if isinstance(v, dict):
                    for k2, v2 in v.items():
                        flat[f"{k}.{k2}"] = v2
                else:
                    flat[k] = v
            rows.append(flat)
    return pd.DataFrame(rows) if rows else pd.DataFrame()

def _score_columns(cols: List[str], tab: str) -> int:
    s = set(map(str, cols))
    # 한국어/영문 키 모두 가중치
    hit_keys = {"선수","이름","선수명","avg","타율","ops","장타율","출루율","OPS","OBP","SLG"}
    pit_keys = {"선수","이름","선수명","ERA","평균자책","WHIP","이닝","IP","탈삼진","SO","W","L","SV"}
    target = hit_keys if tab == "hitter" else pit_keys
    return len(s & target) * 10 + len(s)  # 교집합 우선 + 전체 컬럼 수 보정

def _json_to_df_candidates(sniffed_json: List[dict], tab: str) -> List[pd.DataFrame]:
    cands: List[pd.DataFrame] = []
    for blob in sniffed_json:
        data = blob.get("data")
        if not isinstance(data, (dict, list)):
            continue
        stack = [data]
        while stack:
            cur = stack.pop()
            if isinstance(cur, dict):
                # 케이스 A: columns + rows(list of list/obj)
                if ("columns" in cur and isinstance(cur["columns"], list)) and any(
                    k in cur for k in ("rows","records","list","data","items")
                ):
                    headers = []
                    cols = cur.get("columns") or []
                    for col in cols:
                        if isinstance(col, dict):
                            headers.append(str(col.get("text") or col.get("name") or col.get("title") or "").strip())
                        else:
                            headers.append(str(col).strip())
                    rows_obj = None
                    for key in ("rows","records","list","data","items"):
                        if isinstance(cur.get(key), list):
                            rows_obj = cur[key]; break
                    if rows_obj:
                        # rows가 dict 리스트/배열 둘 다 수용
                        if rows_obj and isinstance(rows_obj[0], dict):
                            df = _flatten_records(rows_obj)
                        else:
                            df = pd.DataFrame(rows_obj)
                            if headers and df.shape[1] == len(headers):
                                df.columns = headers
                        if not df.empty:
                            cands.append(df)
                # 케이스 B: 리스트를 품은 기타 dict
                for v in cur.values():
                    if isinstance(v, (dict, list)):
                        stack.append(v)
            elif isinstance(cur, list):
                if cur and isinstance(cur[0], dict):
                    df = _flatten_records(cur)
                    if not df.empty:
                        cands.append(df)
                else:
                    for v in cur:
                        if isinstance(v, (dict, list)):
                            stack.append(v)
    # 스코어 높은 순 + 넓은 표 우선
    cands = [df for df in cands if not df.empty]
    cands.sort(key=lambda d: (_score_columns(_normalize_columns(d.columns), tab), d.shape[0], d.shape[1]), reverse=True)
    return cands

# -----------------------------
# DOM → DataFrame (직렬화)
# -----------------------------
def _serialize_dom_table(page) -> Optional[pd.DataFrame]:
    payload = page.evaluate(
        """() => {
            const pick = (sel) => Array.from(document.querySelectorAll(sel));
            const table = document.querySelector('table') || document.querySelector('[role=table]');
            if (!table) return null;
            const headCells = table.querySelectorAll('thead th, thead td');
            const headers = headCells.length
              ? Array.from(headCells).map(el => el.innerText.trim())
              : [];
            const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr =>
              Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim())
            );
            return { headers, rows };
        }"""
    )
    if not payload:
        return None
    headers = payload.get("headers") or []
    rows = payload.get("rows") or []
    if not rows:
        return None
    df = pd.DataFrame(rows)
    if headers and df.shape[1] == len(headers):
        df.columns = headers
    return df

# -----------------------------
# 표 수집 (1페이지 + ▶로 2페이지까지) → 병합
# -----------------------------
def fetch_table(season: str, tab: str, team_code: str) -> Tuple[pd.DataFrame, BeautifulSoup]:
    url = f"https://m.sports.naver.com/kbaseball/record/kbo?seasonCode={season}&tab={tab}&teamCode={team_code}"
    sniffed_json: List[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent=UA,
            locale="ko-KR",
            viewport={"width": 430, "height": 900},
            extra_http_headers={
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "Referer": "https://m.sports.naver.com/",
            },
        )
        page = ctx.new_page()
        _attach_json_sniffer(page, f"{team_code}_{tab}", sniffed_json)

        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        try:
            page.wait_for_load_state("networkidle", timeout=20_000)
        except PWTimeout:
            pass

        _scroll_to_bottom(page, steps=4, wait_ms=500)

        # HTML 덤프
        full_html = page.content()
        dump_path = os.path.join(DUMP_HTML_DIR, f"{team_code}_{tab}.html")
        with open(dump_path, "w", encoding="utf-8") as f:
            f.write(full_html)
        print(f"[DUMP] saved: {dump_path}")

        # 1) JSON 기반 후보들
        cands1 = _json_to_df_candidates(sniffed_json, tab)

        # 2) DOM 직렬화(1페이지)
        df_dom1 = _serialize_dom_table(page)
        if df_dom1 is not None:
            cands1.append(df_dom1)

        # ▶ 버튼 클릭해서 2페이지 표도 수집 (있을 때만)
        merged_df = None
        try:
            # 우측 화살(다음) 후보 선택자 몇 가지 시도
            btn = None
            for sel in [
                "button:has-text('>')",
                "button[aria-label='다음']",
                "button[aria-label='next']",
                "a:has-text('>')",
            ]:
                try:
                    b = page.locator(sel).first
                    if b and b.count() > 0:
                        btn = b; break
                except Exception:
                    continue
            if btn:
                btn.click(timeout=2_000)
                page.wait_for_timeout(800)
                # 전환 후 추가 JSON/DOM 수집
                cands2 = _json_to_df_candidates(sniffed_json, tab)
                df_dom2 = _serialize_dom_table(page)
                if df_dom2 is not None:
                    cands2.append(df_dom2)

                # 가장 좋은 후보씩 고르고 좌우 병합 시도(이름/선수 기준)
                if cands1 and cands2:
                    left = cands1[0].copy()
                    right = cands2[0].copy()
                    left.columns = _normalize_columns(left.columns)
                    right.columns = _normalize_columns(right.columns)

                    # 후보 키
                    name_keys = ["선수","이름","선수명","name","playerName"]
                    def find_name_key(cols):
                        for k in name_keys:
                            if k in cols: return k
                        return None
                    lk = find_name_key(left.columns)
                    rk = find_name_key(right.columns)
                    if lk and rk:
                        merged_df = pd.merge(left, right.drop(columns=[rk] if rk in right.columns else []),
                                             left_on=lk, right_on=rk, how="left")
                        # 중복 컬럼 처리
                        merged_df = merged_df.loc[:,~merged_df.columns.duplicated()]
        except Exception:
            pass

        soup = BeautifulSoup(full_html, "html.parser")
        browser.close()

    # 최종 DF 선택
    df_final = merged_df or (cands1[0] if cands1 else None)
    if df_final is None or df_final.empty:
        raise ValueError("표를 찾지 못했습니다. JSON/DOM 구조가 바뀐 듯 합니다.")

    df_final.columns = _normalize_columns(df_final.columns)
    return df_final.fillna(""), soup

# -----------------------------
# 엔트리
# -----------------------------
def crawl_players_all(season: str = "2025"):
    db: Session = SessionLocal()
    try:
        if not db.execute(text("SELECT pg_try_advisory_lock(2101)")).scalar():
            print("[players] another run in progress")
            return

        for code in TEAM_CODES:
            team = db.query(Team).filter(Team.team_code == code).first()
            if not team:
                print(f"[players] skip: team_code {code} not found")
                continue

            for tab in TABS:
                df = None
                try:
                    df, soup = fetch_table(season, tab, code)
                    name_to_code = _extract_player_codes_from_links(soup)

                    df.columns = _normalize_columns(df.columns)

                    # 이름 컬럼 추정
                    name_cols = {"선수","이름","선수명","name","playerName"}
                    rank_cols = {"순위","순","No","랭킹"}
                    if name_cols.isdisjoint(df.columns):
                        if len(df.columns) >= 2 and str(df.columns[0]) in rank_cols:
                            cols = list(df.columns); cols[1] = "선수"; df.columns = cols

                    for row in df.to_dict(orient="records"):
                        if tab == "hitter":
                            d = normalize_hitter_row(row)
                            if not d["name"]: continue
                            pid = upsert_player(
                                db, name=d["name"], position="B",
                                team_id=team.id, player_code=name_to_code.get(d["name"])
                            )
                            upsert_hitter_stats(db, season, pid, team.id, d)
                        else:
                            d = normalize_pitcher_row(row)
                            if not d["name"]: continue
                            pid = upsert_player(
                                db, name=d["name"], position="P",
                                team_id=team.id, player_code=name_to_code.get(d["name"])
                            )
                            upsert_pitcher_stats(db, season, pid, team.id, d)

                    db.commit()
                    print(f"[players] {code} {tab} ok: {len(df)} rows")

                except Exception as e:
                    db.rollback()
                    print(f"[players] {code} {tab} failed: {e}")
                    try:
                        if df is not None:
                            print(f"[debug] columns={list(df.columns)} shape={df.shape}")
                    except Exception:
                        pass
                time.sleep(0.9)

    finally:
        try:
            db.execute(text("SELECT pg_advisory_unlock(2101)"))
        except Exception:
            pass
        db.close()

if __name__ == "__main__":
    crawl_players_all("2025")
