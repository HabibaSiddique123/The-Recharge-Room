#!/usr/bin/env python3
"""
Database migration script to add is_admin column to users table
"""

import sqlite3
import os

def migrate_database():
    """Add is_admin column to users table"""
    try:
        # Get the database path
        db_path = os.path.join(os.path.dirname(__file__), 'instance', 'recharge_room.db')
        
        if not os.path.exists(db_path):
            print(f"Database not found at {db_path}")
            return False
        
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if is_admin column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_admin' in columns:
            print("is_admin column already exists in users table")
            conn.close()
            return True
        
        # Add is_admin column
        cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
        
        # Commit the changes
        conn.commit()
        print("Successfully added is_admin column to users table")
        
        # Verify the migration
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_admin' in columns:
            print("Migration verified: is_admin column added successfully")
            success = True
        else:
            print("Migration failed: is_admin column not found after migration")
            success = False
        
        conn.close()
        return success
        
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        return False

if __name__ == "__main__":
    migrate_database()