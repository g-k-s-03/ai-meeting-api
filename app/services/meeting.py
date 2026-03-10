# app/services/meeting.py
import os
import json
import assemblyai as aai
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def transcribe_audio(file_url: str) -> str:
    try:
        config = aai.TranscriptionConfig(
            speech_models=[aai.SpeechModel.universal]
        )
        transcriber = aai.Transcriber(config=config)
        transcript = transcriber.transcribe(file_url)
        if transcript.status == aai.TranscriptStatus.error:
            raise Exception(f"Transcription failed: {transcript.error}")
        return transcript.text
    except Exception as e:
        raise Exception(f"Transcription error: {str(e)}")


def analyze_transcript(transcript: str) -> dict:
    try:
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
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        return result

    except Exception as e:
        raise Exception(f"Analysis error: {str(e)}")


def process_meeting(file_url: str) -> dict:
    # Step 1: Transcribe
    transcript = transcribe_audio(file_url)

    # Step 2: Analyze
    result = analyze_transcript(transcript)

    return {
        "transcript": transcript,
        "summary": result.get("summary", ""),
        "keywords": ", ".join(result.get("keywords", [])),
        "action_items": json.dumps(result.get("action_items", [])),
        "decisions": ", ".join(result.get("decisions", []))
    }