"""Add per-user message deletions table

Revision ID: 6f0c9d1a2b3c
Revises: g1h2i3j4k5l6
Create Date: 2026-05-14 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6f0c9d1a2b3c"
down_revision: Union[str, Sequence[str], None] = "g1h2i3j4k5l6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "message_deletions",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("message_id", sa.UUID(), nullable=False),
        sa.Column(
            "deleted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["message_id"], ["messages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "message_id"),
    )
    op.create_index("ix_message_deletions_user_id", "message_deletions", ["user_id"])
    op.create_index("ix_message_deletions_message_id", "message_deletions", ["message_id"])


def downgrade() -> None:
    op.drop_index("ix_message_deletions_message_id", table_name="message_deletions")
    op.drop_index("ix_message_deletions_user_id", table_name="message_deletions")
    op.drop_table("message_deletions")

