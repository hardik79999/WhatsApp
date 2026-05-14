"""phase5_edit_delete_starred

Revision ID: f3a9c2d1e8b7
Revises: dbe47bab89ea
Create Date: 2026-05-14 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a9c2d1e8b7'
down_revision: Union[str, Sequence[str], None] = 'dbe47bab89ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── messages table ────────────────────────────────────────────────────────
    # Add is_deleted_for_everyone (separate from soft-delete flag)
    op.add_column(
        'messages',
        sa.Column('is_deleted_for_everyone', sa.Boolean(), nullable=False, server_default='false'),
    )
    # Add edited_at timestamp
    op.add_column(
        'messages',
        sa.Column('edited_at', sa.DateTime(timezone=True), nullable=True),
    )

    # ── starred_messages table ────────────────────────────────────────────────
    op.create_table(
        'starred_messages',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('message_id', sa.UUID(), nullable=False),
        sa.Column(
            'starred_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'message_id'),
    )


def downgrade() -> None:
    op.drop_table('starred_messages')
    op.drop_column('messages', 'edited_at')
    op.drop_column('messages', 'is_deleted_for_everyone')
