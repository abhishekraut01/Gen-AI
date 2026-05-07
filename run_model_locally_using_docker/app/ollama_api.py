from fastapi import Body, FastAPI
from ollama import Client

app = FastAPI()

client = Client(
    host="http://localhost:11434",
)

client.pull("gemma3:1b")  # Pull the model you want to use

@app.post("/generate")
def generate_response(prompt: str = Body(... , description="The prompt to generate a response for")):
    response = client.chat(
        model="gemma3:1b",  # Specify the model you want to use
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    return {"content": response.message.content}