"""add_status_column_and_reactions_table

Revision ID: dbe47bab89ea
Revises: a5be8e718de8
Create Date: 2026-05-13 18:23:47.505641

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dbe47bab89ea'
down_revision: Union[str, Sequence[str], None] = 'a5be8e718de8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add status column to messages table
    op.add_column('messages', sa.Column('status', sa.String(), nullable=True, server_default='sent'))
    
    # Create message_reactions table
    op.create_table(
        'message_reactions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('message_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('reaction', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('message_id', 'user_id', name='unique_user_message_reaction')
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop message_reactions table
    op.drop_table('message_reactions')
    
    # Remove status column from messages table
    op.drop_column('messages', 'status')
