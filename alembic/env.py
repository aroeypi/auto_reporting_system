# alembic/env.py
import os, sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# (프로젝트 루트 경로 추가 - 필요 시 조정)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # .../alembic
PROJECT_ROOT = os.path.dirname(BASE_DIR)               # 프로젝트 루트
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

# ★★★ 여기 중요 ★★★
from app.db.database import Base
import app.db.models  # <- 이 import로 모든 모델이 Base.metadata에 등록됨

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 환경변수에서 DB URL 구성(네 값에 맞게)
POSTGRES_DB = os.getenv("POSTGRES_DB", "report_db")
POSTGRES_USER = os.getenv("POSTGRES_USER", "report_user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "pizza")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
config.set_main_option(
    "sqlalchemy.url",
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

# Alembic이 비교할 대상
target_metadata = Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
