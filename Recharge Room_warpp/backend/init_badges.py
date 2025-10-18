#!/usr/bin/env python3
"""
Script to initialize default badges
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.utils.init_badges import init_default_badges

def main():
    """Initialize badges"""
    app = create_app()
    
    with app.app_context():
        print("Initializing default badges...")
        init_default_badges()
        print("Badge initialization complete!")

if __name__ == '__main__':
    main()