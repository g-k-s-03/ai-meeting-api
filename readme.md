# AI Meeting Transcription & Summary API

Backend API for uploading meeting audio, generating transcripts, and producing AI summaries.

## Tech Stack

- FastAPI
- PostgreSQL
- SQLAlchemy
- Speech-to-Text API
- LLM Summarization

## Features

- Upload meeting audio
- Store meeting records
- Generate transcript
- Generate AI meeting summaries
- Extract action items and decisions

## Run locally

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
