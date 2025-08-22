# app/schemas/team.py
from pydantic import BaseModel

class TeamBase(BaseModel):
    name: str
    team_code: str  # 예: OB

class TeamCreate(TeamBase):
    pass

class TeamResponse(TeamBase):
    id: int
    class Config:
        orm_mode = True
