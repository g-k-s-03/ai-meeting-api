# app/services/meeting.py
import os
import json
import assemblyai as aai
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not ASSEMBLYAI_API_KEY:
    print("ERROR: ASSEMBLYAI_API_KEY is not set")
if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY is not set")

aai.settings.api_key = ASSEMBLYAI_API_KEY
groq_client = Groq(api_key=GROQ_API_KEY)

def transcribe_audio(file_url: str) -> str:
    try:
        print(f"[transcribe] Starting transcription for: {file_url}")
        print(f"[transcribe] AssemblyAI API key set: {bool(ASSEMBLYAI_API_KEY)}")
        config = aai.TranscriptionConfig(speech_models=aai.SpeechModel.best)
        transcriber = aai.Transcriber(config=config)
        transcript = transcriber.transcribe(file_url)
        print(f"[transcribe] Status: {transcript.status}")
        if transcript.status == aai.TranscriptStatus.error:
            print(f"[transcribe] Error: {transcript.error}")
            raise Exception(f"Transcription failed: {transcript.error}")
        print(f"[transcribe] Success, text length: {len(transcript.text or '')}")
        return transcript.text
    except Exception as e:
        print(f"[transcribe] Exception: {str(e)}")
        raise Exception(f"Transcription error: {str(e)}")


def analyze_transcript(transcript: str) -> dict:
    try:
        print(f"[analyze] Starting Groq analysis, transcript length: {len(transcript)}")
        print(f"[analyze] Groq API key set: {bool(GROQ_API_KEY)}")
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert meeting analyzer.
Analyze the transcript and return ONLY a JSON object with no extra text:
{
    "summary": "clear concise summary of the meeting",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "action_items": [
        {"task": "task description", "owner": "person name or unknown", "deadline": "deadline or unknown"}
    ],
    "decisions": ["decision 1", "decision 2"]
}"""
                },
                {
                    "role": "user",
                    "content": f"Analyze this meeting transcript:\n\n{transcript}"
                }
            ],
            max_tokens=1000
        )

        raw = response.choices[0].message.content
        print(f"[analyze] Raw Groq response: {raw[:200]}")
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        print(f"[analyze] Success, keys: {list(result.keys())}")
        return result

    except Exception as e:
        print(f"[analyze] Exception: {str(e)}")
        raise Exception(f"Analysis error: {str(e)}")


def process_meeting(file_url: str) -> dict:
    print(f"[process_meeting] Starting for URL: {file_url}")

    # Step 1: Transcribe
    transcript = transcribe_audio(file_url)
    print(f"[process_meeting] Transcription done")

    # Step 2: Analyze
    result = analyze_transcript(transcript)
    print(f"[process_meeting] Analysis done")

    return {
        "transcript": transcript,
        "summary": result.get("summary", ""),
        "keywords": ", ".join(result.get("keywords", [])),
        "action_items": json.dumps(result.get("action_items", [])),
        "decisions": ", ".join(result.get("decisions", []))
    }