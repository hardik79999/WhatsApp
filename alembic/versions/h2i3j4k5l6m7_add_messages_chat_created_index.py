# Created by: Master Fix Pass
"""add_messages_chat_created_index

Revision ID: h2i3j4k5l6m7
Revises: 6f0c9d1a2b3c
Create Date: 2026-05-15 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "h2i3j4k5l6m7"
down_revision: Union[str, Sequence[str], None] = "6f0c9d1a2b3c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEX_NAME = "ix_messages_chat_id_created_at"


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing = {index.get("name") for index in inspector.get_indexes("messages")}
    if INDEX_NAME not in existing:
        op.create_index(INDEX_NAME, "messages", ["chat_id", "created_at"])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing = {index.get("name") for index in inspector.get_indexes("messages")}
    if INDEX_NAME in existing:
        op.drop_index(INDEX_NAME, table_name="messages")
