#app/db/models.py
from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, ForeignKey, UniqueConstraint, func, text
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    sources = Column(JSONB, nullable=True)
    tags = Column(JSONB, nullable=True, server_default=text("'[]'::jsonb"))
    captions = Column(JSONB, nullable=True, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name  = Column(String)
    email      = Column(String, unique=True, index=True)
    phone      = Column(String)
    username   = Column(String, unique=True, index=True)
    password   = Column(String)

class Team(Base):
    __tablename__ = "teams"
    id         = Column(Integer, primary_key=True, index=True)
    team_code  = Column(String, unique=True, index=True)   # 예: OB, LT ...
    name       = Column(String, unique=True, index=True)

    # 순위/요약
    games = Column(Integer)
    wins  = Column(Integer)
    losses = Column(Integer)
    draws  = Column(Integer)
    win_rate = Column(String)
    games_behind = Column(String)
    streak = Column(String)
    home_record = Column(String)
    away_record = Column(String)

    players    = relationship("Player", back_populates="team", cascade="all, delete-orphan")
    home_games = relationship("Game", back_populates="home_team", foreign_keys="Game.home_team_id")
    away_games = relationship("Game", back_populates="away_team", foreign_keys="Game.away_team_id")

class Player(Base):
    __tablename__ = "players"
    id          = Column(Integer, primary_key=True, index=True)
    player_code = Column(Integer, unique=True, index=True, nullable=True)  # 네이버 playerId
    name        = Column(String, index=True, nullable=False)
    position    = Column(String, index=True)  # 'B'|'P' (대표 포지션)
    team_id     = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), index=True, nullable=True)
    bat_hand    = Column(String, nullable=True)   # L/R/S
    throw_hand  = Column(String, nullable=True)   # L/R
    birth       = Column(Date,   nullable=True)

    team = relationship("Team", back_populates="players")

class Game(Base):
    __tablename__ = "games"
    id           = Column(Integer, primary_key=True, index=True)
    game_code    = Column(String, unique=True, index=True)   # 예: 20250810DSHE02025
    date         = Column(Date, index=True)
    home_team_id = Column(Integer, ForeignKey("teams.id", ondelete="RESTRICT"), index=True)
    away_team_id = Column(Integer, ForeignKey("teams.id", ondelete="RESTRICT"), index=True)
    stadium      = Column(String)
    result       = Column(String)

    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_games")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_games")

class HitterStats(Base):
    __tablename__ = "hitter_stats"
    id          = Column(Integer, primary_key=True)
    season_code = Column(String, index=True)                      # '2025'
    player_id   = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"), index=True, nullable=False)
    team_id     = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), index=True)
    g  = Column(Integer); pa = Column(Integer); ab = Column(Integer)
    r  = Column(Integer); h  = Column(Integer); hr = Column(Integer); rbi = Column(Integer)
    sb = Column(Integer); cs = Column(Integer); bb = Column(Integer); hbp = Column(Integer)
    so = Column(Integer)
    avg = Column(String); obp = Column(String); slg = Column(String); ops = Column(String); war = Column(String)
    extra = Column(JSONB)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    __table_args__ = (UniqueConstraint('season_code','player_id', name='uq_hitter_season_player'),)

class PitcherStats(Base):
    __tablename__ = "pitcher_stats"
    id          = Column(Integer, primary_key=True)
    season_code = Column(String, index=True)
    player_id   = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"), index=True, nullable=False)
    team_id     = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), index=True)
    g  = Column(Integer); gs = Column(Integer); w = Column(Integer); l = Column(Integer)
    sv = Column(Integer); hld = Column(Integer)
    ip_outs = Column(Integer)  # 이닝을 '아웃 수'로 저장(1이닝=3)
    h  = Column(Integer); hr = Column(Integer); bb = Column(Integer); hbp = Column(Integer)
    so = Column(Integer); r = Column(Integer); er = Column(Integer)
    era = Column(String); whip = Column(String); war = Column(String)
    extra = Column(JSONB)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    __table_args__ = (UniqueConstraint('season_code','player_id', name='uq_pitcher_season_player'),)
