import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from main import app

# Vercel serverless function handler
def handler(request):
    return app(request)
