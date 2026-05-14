"""Merge multiple heads

Revision ID: 0bea693ea022
Revises: 42e5d7c1f3a8, f3a9c2d1e8b7
Create Date: 2026-05-14 14:16:27.671233

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0bea693ea022'
down_revision: Union[str, Sequence[str], None] = ('42e5d7c1f3a8', 'f3a9c2d1e8b7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
