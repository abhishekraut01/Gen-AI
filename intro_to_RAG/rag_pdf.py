from langchain_community.document_loaders import PyPDFLoader
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
import os
from dotenv import load_dotenv
from langchain_qdrant import QdrantVectorStore

load_dotenv()


file_path = Path(__file__).parent / "Bhgwat_gita.pdf"
loader = PyPDFLoader(file_path=str(file_path))

docs = loader.load()
print(f"Total pages loaded: {len(docs)}")

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, 
    chunk_overlap=200
)

splits = text_splitter.split_documents(documents=docs)

embedder = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

vector_store = QdrantVectorStore.from_documents(
    documents=[],
    collection_name="bhagwat_gita", 
    embedding=embedder,
    url="http://localhost:6333"
)

vector_store.add_documents(documents=splits)
print(f"Injection completed. Total documents in vector store: {vector_store._collection_info().points_count}")