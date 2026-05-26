# Deployment

This project is designed for split deployment:

- Frontend: Vercel
- Backend: Render

## 1. Deploy Backend on Render

Create a new Render Web Service from this GitHub repository.

Use these settings:

```text
Environment: Python
Build Command: pip install -r backend/requirements.txt
Start Command: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

Set these environment variables in Render:

```text
GROQ_API_KEY=<your-new-groq-key>
FRONTEND_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5173
FRONTEND_ORIGIN_REGEX=^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$|^https://.*\.vercel\.app$
VECTOR_STORE_DIR=vector_store
UPLOAD_DIR=backend/uploads
EMBEDDING_PROVIDER=hash
EMBEDDING_DIMENSION=384
```

After deploy, your API base URL will look like:

```text
https://your-render-service.onrender.com/api/v1
```

## 2. Deploy Frontend on Vercel

Create a new Vercel project from this GitHub repository.

Use these settings:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Set this environment variable in Vercel:

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com/api/v1
```

## 3. Important Storage Note

Render free instances use ephemeral local storage. Uploaded files and FAISS vector data may be lost after redeploys or restarts.

For production, use one of these:

- Render persistent disk
- S3-compatible file storage for uploads
- Qdrant, Pinecone, Weaviate, or another hosted vector database

## 4. Embedding Mode

The Render Free instance has only 512 MB RAM. The deployed backend defaults to:

```text
EMBEDDING_PROVIDER=hash
```

This avoids loading PyTorch/Sentence Transformers on the free instance. For stronger semantic quality, use a larger Render instance and install `sentence-transformers`, or move embeddings/vector search to a hosted provider.

## 5. Security Note

Do not commit `.env` files. Set secrets only in Render/Vercel environment variables.

If a secret key was ever exposed locally or in logs, rotate it before production deployment.
