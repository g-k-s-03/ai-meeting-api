# app/services/meeting.py
import os
import assemblyai as aai
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Setup API clients
aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def transcribe_audio(file_url: str) -> str:
    """Send Supabase file URL to AssemblyAI and get transcript"""
    try:
        config = aai.TranscriptionConfig(
            speech_models=[aai.SpeechModel.universal]  # ← "speech_models" with 's' and list []
        )
        transcriber = aai.Transcriber(config=config)
        transcript = transcriber.transcribe(file_url)

        if transcript.status == aai.TranscriptStatus.error:
            raise Exception(f"Transcription failed: {transcript.error}")

        return transcript.text

    except Exception as e:
        raise Exception(f"Transcription error: {str(e)}")

def summarize_transcript(transcript: str) -> str:
    """Send transcript to Groq LLaMA and get summary"""
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert meeting summarizer. Summarize the meeting transcript clearly and concisely. Include: key discussion points, decisions made, and action items."
                },
                {
                    "role": "user",
                    "content": f"Please summarize this meeting transcript:\n\n{transcript}"
                }
            ],
            max_tokens=500
        )
        return response.choices[0].message.content

    except Exception as e:
        raise Exception(f"Summarization error: {str(e)}")


def process_meeting(file_url: str) -> dict:
    """Full pipeline: transcribe + summarize"""
    # Step 1: Transcribe
    transcript = transcribe_audio(file_url)

    # Step 2: Summarize
    summary = summarize_transcript(transcript)

    return {
        "transcript": transcript,
        "summary": summary
    }