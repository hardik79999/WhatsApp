"""Add media uploads table and group membership metadata

Revision ID: 42e5d7c1f3a8
Revises: dbe47bab89ea
Create Date: 2026-05-14 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '42e5d7c1f3a8'
down_revision = 'dbe47bab89ea'
branch_labels = None
depends_on = None


def upgrade() -> None:
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
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'group_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('group_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['group_id'], ['chats.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.add_column('chats', sa.Column('group_pic_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('chats', sa.Column('group_created_by_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        'fk_chats_group_pic_id_media_uploads',
        'chats', 'media_uploads', ['group_pic_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_chats_group_created_by_id_users',
        'chats', 'users', ['group_created_by_id'], ['id'], ondelete='SET NULL'
    )

    op.add_column('messages', sa.Column('media_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('messages', sa.Column('caption', sa.String(), nullable=True))
    op.create_foreign_key(
        'fk_messages_media_id_media_uploads',
        'messages', 'media_uploads', ['media_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_messages_media_id_media_uploads', 'messages', type_='foreignkey')
    op.drop_column('messages', 'caption')
    op.drop_column('messages', 'media_id')

    op.drop_constraint('fk_chats_group_created_by_id_users', 'chats', type_='foreignkey')
    op.drop_constraint('fk_chats_group_pic_id_media_uploads', 'chats', type_='foreignkey')
    op.drop_column('chats', 'group_created_by_id')
    op.drop_column('chats', 'group_pic_id')

    op.drop_table('group_members')
    op.drop_table('media_uploads')
