import uvicorn
from app.main import app

if __name__ == "__main__":
    # Start the server and bind to all interfaces so ngrok can forward requests
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
