<div align="center">

# DocIntel AI <img width="32" height="32" alt="Image" src="https://github.com/user-attachments/assets/4d500119-9bb2-4ac1-9891-d207358cd620" />


An enterprise-style AI platform for document understanding, semantic retrieval, and context-aware question answering.

![React](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/RAG-LangChain-121212?style=for-the-badge)
![FAISS](https://img.shields.io/badge/Vector%20DB-FAISS-5B21B6?style=for-the-badge)
![SentenceTransformers](https://img.shields.io/badge/Embeddings-Sentence%20Transformers-2563EB?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

---

## Overview

DocIntel AI is an AI-powered document intelligence system designed to process, classify, retrieve, and analyze unstructured documents using semantic search and Retrieval-Augmented Generation (RAG). It enables users to upload files such as PDFs, resumes, reports, and research papers, then retrieve contextually relevant content and ask natural-language questions grounded in the uploaded documents. 

Traditional document search systems depend heavily on keyword matching, which often misses semantic meaning and contextual relevance. DocIntel AI improves this by combining text extraction, chunking, embeddings, vector search, and LLM-based answer generation into a modern document intelligence workflow. 

---

## Problem

Organizations and institutions generate large amounts of unstructured documents daily, but traditional systems still rely on keyword-based retrieval that often fails to understand meaning, produces inaccurate results, requires manual searching, and increases retrieval time. 

DocIntel AI addresses this by building a system capable of understanding document context, performing semantic retrieval, generating context-aware responses, and reducing manual analysis effort. 

---

## Features

- Upload and process documents such as PDFs, research papers, resumes, and reports. 
- Extract text content from uploaded documents. 
- Split documents into chunks for efficient retrieval. 
- Generate semantic embeddings using transformer-based models. 
- Store and search embeddings in a vector database. 
- Perform semantic search instead of plain keyword search.
- Classify uploaded documents into meaningful categories. 
- Ask context-aware questions using RAG-based querying. 
- Build a modular, production-style AI application for placement and portfolio use. 

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS  |
| Backend | FastAPI  |
| Embeddings | Sentence Transformers  |
| Vector Database | FAISS or ChromaDB  |
| RAG Framework | LangChain  |
| LLM | Gemini / OpenAI / Groq  |
| PDF Parsing | pdfplumber / PyPDF  |

---

## Workflow

DocIntel AI follows this end-to-end pipeline: 

1. Upload a document. 
2. Extract and preprocess text from the file. 
3. Split the extracted text into chunks. 
4. Generate embeddings for each chunk. 
5. Store embeddings in a vector database. 
6. Accept a user search query or question. 
7. Retrieve relevant document chunks using semantic similarity. 
8. Generate a context-aware answer using Retrieval-Augmented Generation.

---

## Architecture
<p align="center">
  <img src="https://github.com/user-attachments/assets/f704a260-a8ee-43b0-bed3-b7b290ad8f22" alt="DocIntel Architecture Diagram" width="420" />
</p>

This architecture is designed to improve retrieval relevance compared with traditional keyword-based document search.

---

## Project Structure

```bash
document-intelligence-rag/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── DashboardLayout.jsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCard.jsx
│   │   │   │   ├── UploadBox.jsx
│   │   │   │   ├── ActivityList.jsx
│   │   │   │   ├── CategoryChart.jsx
│   │   │   │   └── TrendChart.jsx
│   │   │   │
│   │   │   ├── documents/
│   │   │   │   ├── DocumentCard.jsx
│   │   │   │   ├── DocumentGrid.jsx
│   │   │   │   └── DocumentFilters.jsx
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   ├── MessageBubble.jsx
│   │   │   │   ├── CitationCard.jsx
│   │   │   │   └── SuggestedQuestions.jsx
│   │   │   │
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   ├── SearchResults.jsx
│   │   │   │   └── ChunkPreview.jsx
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   └── ThemeToggle.jsx
│   │   │   │
│   │   │   └── ui/
│   │   │       ├── Button.jsx
│   │   │       ├── Card.jsx
│   │   │       ├── Input.jsx
│   │   │       ├── Badge.jsx
│   │   │       └── Loader.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── SearchPage.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── context/
│   │   │   └── ThemeContext.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── services/
│   │   ├── document_processor.py
│   │   ├── chunking_service.py
│   │   ├── embedding_service.py
│   │   ├── vector_service.py
│   │   ├── retrieval_service.py
│   │   └── rag_service.py
│   │
│   ├── routes/
│   │   ├── upload_routes.py
│   │   ├── search_routes.py
│   │   ├── chat_routes.py
│   │   └── analytics_routes.py
│   │
│   ├── models/
│   │   ├── document_models.py
│   │   └── query_models.py
│   │
│   └── main.py
│
├── vector_store/
├── data/
├── prompts/
├── README.md
└── .gitignore
```

The project follows a modular full-stack architecture with a React + Tailwind frontend and a FastAPI backend. The frontend is organized into reusable feature-based components such as dashboard, documents, chat, and search, while the backend is separated into services, routes, and models for document processing, semantic retrieval, and RAG-based querying. This structure improves maintainability, scalability, and development clarity. 

---

## Functional Requirements

The core functional requirements defined for the system are:

- Document upload. 
- Text extraction. 
- Document chunking. 
- Embedding generation. 
- Semantic search. 
- Document classification. 
- RAG-based querying. 

---

## Installation

### Clone the repository

```bash
git clone https://github.com/your-username/document-intelligence-rag.git
cd document-intelligence-rag
```

### Setup backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Setup frontend

```bash
cd ../frontend
npm install
npm run dev
```

### Run backend

```bash
cd ../backend
uvicorn main:app --reload
```

---

## Environment Variables

Create a `.env` file in the backend directory:

```env
LLM_PROVIDER=groq
LLM_API_KEY=your_api_key
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
VECTOR_DB=faiss
```

Depending on your implementation, you can also add storage configuration, database credentials, API keys, or deployment-specific settings.

---

## Usage

Once the app is running:

- Upload a supported document.
- Let the system extract, chunk, and index the content.
- Perform semantic search using natural-language queries.
- Ask document-based questions and receive context-aware answers.
- Explore classification and retrieval behavior across multiple document types.

### Example Queries

- `Summarize this research paper`
- `What are the skills mentioned in this resume?`
- `Find documents related to machine learning in healthcare`
- `What does this report say about revenue growth?`
- `What are the major findings in this uploaded PDF?`

These example tasks reflect the PRD’s goal of semantic retrieval and context-aware document querying. 

---

## Screenshots
## DocIntel Dashboard

Screenshots of the DocIntel AI dashboard are available in the Google Drive folder below:

[View Dashboard Screenshots](https://drive.google.com/drive/folders/1AOds55r-iYUrFsEGSPmHLn2k1pJmzYUf?usp=sharing)


## Edge Cases

The PRD identifies several practical issues the system should handle: [file:1]

- Wrong classification. 
- OCR or text extraction failure. 
- Duplicate documents. 
- Long document context loss. 
- Poor retrieval quality. 
- Hallucinated responses. 
- Unsupported files. 
- Empty documents. 

These are important when designing evaluation, error handling, and fallback logic. 

---

## Future Enhancements

Planned enhancements include: 

- OCR integration. 
- Multi-language support. 
- Conversational memory. 
- Multi-document querying. 
- Analytics dashboard. 
- Authentication system. 
- Hybrid retrieval. 
- Cloud deployment. 

---

## Why This Project Stands Out

DocIntel AI is not just a document uploader or search bar. It demonstrates a real AI engineering workflow by combining semantic embeddings, vector databases, and RAG into a usable application that improves document understanding and contextual retrieval. 

For a placement or portfolio project, it highlights practical full-stack AI skills, modular system design, and applied NLP implementation in a production-style setup. 

---

## Demo

- Live Demo: [Open App](https://document-intelligence-rag.vercel.app/)
- Demo Video: [Watch Demo](https://www.loom.com/share/ace0f95142a84df199a3c7a19e6a49b6)
---

## Author

**Abinash A**  
Information Technology Student  
Vel Tech Tech Multi Tech Engineering College

- GitHub: [https://github.com/Abinash123iou](https://github.com/your-username)
- LinkedIn: [https://www.linkedin.com/in/abinash-ayyappan-3669b4359/](https://linkedin.com/in/your-profile)

---

## License
MIT License

Copyright (c) 2026 Abinash123iou

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
