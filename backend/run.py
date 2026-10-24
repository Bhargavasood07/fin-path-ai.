import uvicorn
from app.config import HOST, PORT

if __name__ == "__main__":
    print(f"Starting FinPath AI Backend on http://{HOST}:{PORT}")
    print(f"Interactive Swagger Documentation: http://{HOST}:{PORT}/docs")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
