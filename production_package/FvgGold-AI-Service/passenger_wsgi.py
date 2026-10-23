"""
Passenger WSGI entry point for cPanel / CloudLinux Python Applications.
Do not modify unless required by your hosting provider.
"""
import sys
import os

# Add the application directory to the Python path
INTERP = sys.executable
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

# Import the WSGI application callable from app.py
from app import application
