from fastapi import FastAPI
from mangum import Mangum  # AWS Lambda adapter

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

handler = Mangum(app)
