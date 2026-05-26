from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from backend.services import embed_service, settings_service, vector_service
from backend.config import GROQ_API_KEY
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_llm():
    settings = settings_service.get_llm_settings()
    if settings.get("provider") != "groq":
        logger.warning("Only Groq is currently executable in this backend.")
        return None

    try:
        return ChatGroq(
            temperature=settings.get("temperature", 0.0),
            groq_api_key=GROQ_API_KEY,
            model_name=settings.get("model", "llama-3.1-8b-instant"),
            max_tokens=settings.get("max_tokens", 512),
        )
    except Exception as e:
        logger.error(f"Failed to initialize Groq LLM: {e}")
        return None

# Define the RAG prompt template
prompt_template = """
You are an assistant for question-answering tasks. 
Use the following pieces of retrieved context to answer the question. 
If you don't know the answer, just say that you don't know. 
Use three sentences maximum and keep the answer concise.

Question: {question} 
Context: {context} 

Answer:
"""

prompt = PromptTemplate.from_template(prompt_template)

def get_retriever(top_k: int, doc_ids: list[str] | None = None):
    """
    Returns a retriever function that fetches context from the vector store.
    """
    def retriever(query: str):
        query_embedding = embed_service.generate_embeddings([query])[0]
        # Pass the doc_ids to the search function
        search_results = vector_service.search_similar(query_embedding, k=top_k, doc_ids=doc_ids)
        return search_results # Return the structured results
    return retriever

def answer_question_with_rag(query: str, doc_ids: list[str] | None = None, top_k: int = 5):
    """
    Answers a question using the RAG pipeline.
    """
    llm = get_llm()
    if not llm:
        return "LLM not initialized. Please check the provider, model, and API key configuration.", []
        
    try:
        logger.info(f"Answering question: '{query}' within doc_ids: '{doc_ids or 'all'}'")

        # 1. Get structured search results from the retriever
        retriever_fn = get_retriever(top_k, doc_ids)
        search_results = retriever_fn(query)

        if not search_results:
            logger.warning("No relevant documents found for the query.")
            return "I'm sorry, but I couldn't find any relevant information to answer your question.", []

        # 2. Format the context for the LLM
        context = "\n\n".join([result["text"] for result in search_results])

        # 3. Define a more standard RAG chain
        rag_chain = (
            RunnablePassthrough.assign(context=lambda _: context)
            | prompt
            | llm
            | StrOutputParser()
        )

        # 4. Invoke the chain with the user's question
        logger.info("Invoking RAG chain...")
        answer = rag_chain.invoke({"question": query}) # Pass a dictionary
        logger.info(f"Generated answer: {answer}")
        
        # 5. The search_results are our sources
        return answer, search_results

    except Exception as e:
        logger.error(f"Error in RAG pipeline: {e}", exc_info=True)
        return "An unexpected error occurred while generating the answer.", []

