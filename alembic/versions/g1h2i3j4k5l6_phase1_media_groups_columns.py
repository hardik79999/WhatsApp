"""phase1_media_groups_columns

Adds all columns and tables that the Phase 1 models reference but that are
missing from the existing migration chain:

  chats          → group_pic_id, group_created_by_id
  messages       → media_id, caption, is_deleted_for_everyone (already in f3a9c2d1e8b7 but
                   added here as idempotent guard via try/except in env)
  media_uploads  → new table
  group_members  → new table

Revision ID: g1h2i3j4k5l6
Revises: f3a9c2d1e8b7
Create Date: 2026-05-14 12:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'g1h2i3j4k5l6'
down_revision: Union[str, Sequence[str], None] = '0bea693ea022'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from sqlalchemy import inspect
    conn = op.get_bind()
    insp = inspect(conn)

    def table_exists(name: str) -> bool:
        return name in insp.get_table_names()

    def col_exists(table: str, col: str) -> bool:
        return any(c.get("name") == col for c in insp.get_columns(table))

    def fk_exists_on_column(table: str, col: str) -> bool:
        for fk in insp.get_foreign_keys(table):
            if col in (fk.get("constrained_columns") or []):
                return True
        return False

    def index_exists(table: str, index_name: str) -> bool:
        return any(i.get("name") == index_name for i in insp.get_indexes(table))

    # ── 1. media_uploads ─────────────────────────────────────────────────────
    if not table_exists("media_uploads"):
        op.create_table(
            'media_uploads',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('uploaded_by_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('file_name', sa.String(), nullable=False),
            sa.Column('file_type', sa.String(), nullable=False),
            sa.Column('mime_type', sa.String(), nullable=False),
            sa.Column('file_size', sa.Integer(), nullable=False),
            sa.Column('file_url', sa.String(), nullable=False),
            sa.Column('thumbnail_url', sa.String(), nullable=True),
            sa.Column('file_path', sa.String(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
        )

    # ── 2. group_members ─────────────────────────────────────────────────────
    if not table_exists("group_members"):
        op.create_table(
            'group_members',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('group_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('role', sa.String(), nullable=True, server_default='member'),
            sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.ForeignKeyConstraint(['group_id'], ['chats.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
    if table_exists("group_members") and not index_exists("group_members", "ix_group_members_group_id"):
        op.create_index('ix_group_members_group_id', 'group_members', ['group_id'])
    if table_exists("group_members") and not index_exists("group_members", "ix_group_members_user_id"):
        op.create_index('ix_group_members_user_id',  'group_members', ['user_id'])

    # ── 3. chats — add group_pic_id + group_created_by_id ────────────────────
    if not col_exists("chats", "group_pic_id"):
        op.add_column('chats', sa.Column('group_pic_id', postgresql.UUID(as_uuid=True), nullable=True))
    if not col_exists("chats", "group_created_by_id"):
        op.add_column('chats', sa.Column('group_created_by_id', postgresql.UUID(as_uuid=True), nullable=True))
    if table_exists("chats") and table_exists("media_uploads") and col_exists("chats", "group_pic_id") and not fk_exists_on_column("chats", "group_pic_id"):
        op.create_foreign_key(
            'fk_chats_group_pic_id', 'chats', 'media_uploads',
            ['group_pic_id'], ['id'], ondelete='SET NULL')
    if table_exists("chats") and table_exists("users") and col_exists("chats", "group_created_by_id") and not fk_exists_on_column("chats", "group_created_by_id"):
        op.create_foreign_key(
            'fk_chats_group_created_by_id', 'chats', 'users',
            ['group_created_by_id'], ['id'], ondelete='SET NULL')

    # ── 4. messages — add media_id + caption ─────────────────────────────────
    if not col_exists("messages", "media_id"):
        op.add_column('messages', sa.Column('media_id', postgresql.UUID(as_uuid=True), nullable=True))
    if not col_exists("messages", "caption"):
        op.add_column('messages', sa.Column('caption', sa.String(), nullable=True))
    if table_exists("messages") and table_exists("media_uploads") and col_exists("messages", "media_id") and not fk_exists_on_column("messages", "media_id"):
        op.create_foreign_key(
            'fk_messages_media_id', 'messages', 'media_uploads',
            ['media_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint('fk_messages_media_id', 'messages', type_='foreignkey')
    op.drop_column('messages', 'caption')
    op.drop_column('messages', 'media_id')

    op.drop_constraint('fk_chats_group_created_by_id', 'chats', type_='foreignkey')
    op.drop_constraint('fk_chats_group_pic_id', 'chats', type_='foreignkey')
    op.drop_column('chats', 'group_created_by_id')
    op.drop_column('chats', 'group_pic_id')

    op.drop_index('ix_group_members_user_id',  table_name='group_members')
    op.drop_index('ix_group_members_group_id', table_name='group_members')
    op.drop_table('group_members')
    op.drop_table('media_uploads')
