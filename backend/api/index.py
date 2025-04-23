from mangum import Mangum
import sys
import os

# Add the parent directory to the path so we can import from main.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the app and handler from your main file
from main import app, handler

# Export the handler for Vercel
def lambda_handler(event, context):
    return handler(event, context)