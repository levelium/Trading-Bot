#!/usr/bin/env python3
"""
FvgGold AI Trader - Windows VPS & Local Execution Entry Point
Backwards compatible with existing start_service.bat and scripts.
Redirects to the corrected, production-ready app.py implementation.
"""
from app import main

if __name__ == '__main__':
    main()
