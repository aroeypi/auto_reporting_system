# app/api/admin_sync.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.core.deps import admin_required
from scripts.crawl_team import fetch_team_rankings, save_to_db as save_teams

router = APIRouter(tags=["admin-sync"])

@router.post("/admin/sync/teams")
def sync_teams(db: Session = Depends(get_db), _admin=Depends(admin_required)):
    # 내부에서 advisory lock은 save_to_db에서 이미 잡아도 되고,
    # 여기서 잡고 save_to_db엔 생략해도 됨. 중복으로 잡아도 OK.
    try:
        df = fetch_team_rankings()
        # save_to_db 내부에서 commit/rollback/lock 처리
        save_teams(df)
        return {"status": "ok", "message": "teams synced"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
