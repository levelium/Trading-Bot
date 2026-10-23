"""
Standard WSGI entry point for Gunicorn, uWSGI, and Apache mod_wsgi.
Usage with Gunicorn:
    gunicorn --bind 0.0.0.0:8787 --workers 2 wsgi:application
"""
import sys
import os

app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from app import application

if __name__ == '__main__':
    from app import main
    main()
