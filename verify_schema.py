#!/usr/bin/env python3
"""
Database Schema Verification Script
Checks if all required columns and tables exist
"""

import sys
import os
from pathlib import Path

# Add backend to path and load environment
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Load environment variables
from dotenv import load_dotenv
env_path = backend_dir / '.env'
load_dotenv(env_path)

from sqlalchemy import inspect, create_engine
from app.core.config import settings

def verify_schema():
    """Verify database schema has all required columns and tables"""
    
    print("🔍 Verifying Database Schema...\n")
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    # Check if tables exist
    required_tables = [
        'users', 'chats', 'chat_participants', 'messages', 
        'message_status', 'message_reactions', 'contacts', 
        'statuses', 'status_views', 'calls', 'call_participants'
    ]
    
    existing_tables = inspector.get_table_names()
    
    print("📋 Table Verification:")
    all_tables_exist = True
    for table in required_tables:
        exists = table in existing_tables
        status = "✅" if exists else "❌"
        print(f"  {status} {table}")
        if not exists:
            all_tables_exist = False
    
    print()
    
    # Check messages table columns
    print("📋 Messages Table Column Verification:")
    required_message_columns = [
        'id', 'chat_id', 'sender_id', 'content', 'media_url',
        'thumbnail_url', 'file_size', 'duration', 'message_type',
        'reply_to_message_id', 'is_edited', 'edited_at', 'is_deleted',
        'deleted_at', 'status', 'created_at', 'updated_at'
    ]
    
    if 'messages' in existing_tables:
        message_columns = [col['name'] for col in inspector.get_columns('messages')]
        all_columns_exist = True
        
        for col in required_message_columns:
            exists = col in message_columns
            status = "✅" if exists else "❌"
            print(f"  {status} {col}")
            if not exists:
                all_columns_exist = False
        
        if not all_columns_exist:
            print("\n❌ CRITICAL: Missing columns in messages table!")
            return False
    else:
        print("  ❌ messages table does not exist!")
        return False
    
    print()
    
    # Check message_reactions table
    print("📋 Message Reactions Table Verification:")
    if 'message_reactions' in existing_tables:
        reaction_columns = [col['name'] for col in inspector.get_columns('message_reactions')]
        required_reaction_columns = ['id', 'message_id', 'user_id', 'reaction', 'created_at']
        
        all_reaction_columns_exist = True
        for col in required_reaction_columns:
            exists = col in reaction_columns
            status = "✅" if exists else "❌"
            print(f"  {status} {col}")
            if not exists:
                all_reaction_columns_exist = False
        
        if not all_reaction_columns_exist:
            print("\n❌ CRITICAL: Missing columns in message_reactions table!")
            return False
    else:
        print("  ❌ message_reactions table does not exist!")
        return False
    
    print()
    
    if all_tables_exist and all_columns_exist and all_reaction_columns_exist:
        print("✅ All schema verifications passed!")
        print("✅ Database is ready for use!")
        return True
    else:
        print("❌ Schema verification failed!")
        print("💡 Run: alembic upgrade head")
        return False

if __name__ == "__main__":
    try:
        success = verify_schema()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error during verification: {e}")
        print("💡 Make sure the database is running and accessible")
        sys.exit(1)
