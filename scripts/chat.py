#!/usr/bin/env python3
"""Bridge: build context from retrieved chunks (JSON), load/save history, POST to llama.cpp (llamacpp-droid)."""
import os
import sys
import json
import urllib.request

DEFAULT_URL = "http://localhost:8080"
ENDPOINT = "/v1/chat/completions"
MAX_CONTEXT_CHARS = 15_000


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 chat.py <query> [json_chunk ...]", file=sys.stderr)
        sys.exit(1)

    query = sys.argv[1]
    raw_chunks = [a.strip() for a in sys.argv[2:] if a.strip()]

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.environ.get("D1_PROJECT_ROOT") or os.path.join(script_dir, "..")
    history_file = os.path.join(project_root, "data", "chat_history.json")

    history = []
    if os.path.exists(history_file):
        try:
            with open(history_file, "r", encoding="utf-8") as f:
                history = json.load(f)
        except (json.JSONDecodeError, OSError):
            history = []

    context = ""

    # Pinned documents (always included in context)
    pinned_json = os.environ.get("D1_PINNED_JSON")
    if pinned_json:
        try:
            pinned = json.loads(pinned_json)
            for item in (pinned if isinstance(pinned, list) else []):
                p = item.get("path", "")
                c = item.get("content", "")
                if p or c:
                    context += f"--- Pinned: {p} ---\n{c}\n\n"
        except (json.JSONDecodeError, TypeError, KeyError):
            pass

    for raw in raw_chunks:
        try:
            chunk_data = json.loads(raw)
            path = chunk_data.get("path", "")
            content = chunk_data.get("content", "")
            if path or content:
                context += f"--- Source: {path} ---\n{content}\n\n"
        except (json.JSONDecodeError, TypeError, KeyError):
            continue

    if len(context) > MAX_CONTEXT_CHARS:
        context = context[:MAX_CONTEXT_CHARS] + "\n\n... [Context truncated for token limit]"

    system_message = {
        "role": "system",
        "content": "You are a concise planning assistant. Use the provided chunks to answer. Maintain context of the ongoing conversation.",
    }

    current_prompt = f"Context:\n{context}\n\nQuestion:\n{query}" if context else query
    messages = [system_message] + history + [{"role": "user", "content": current_prompt}]

    base_url = os.environ.get("D1_LLM_URL", DEFAULT_URL).rstrip("/")
    url = base_url + ENDPOINT
    prompt_data = {"messages": messages, "temperature": 0.2}

    request = urllib.request.Request(
        url,
        data=json.dumps(prompt_data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        estimated_tokens = len(json.dumps(prompt_data)) // 4

        with urllib.request.urlopen(request, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
            ai_response = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            ai_response = ai_response or "(empty response)"

            print("D1_META_START")
            print(json.dumps({"tokens": estimated_tokens}))
            print("D1_META_END")
            print("\n" + ai_response + "\n")

            history.append({"role": "user", "content": query})
            history.append({"role": "assistant", "content": ai_response})

            os.makedirs(os.path.dirname(history_file), exist_ok=True)
            with open(history_file, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=2)

    except urllib.error.URLError as e:
        print(
            f"\nConnection failed. Ensure llamacpp-droid is running (e.g. port 8080). Set D1_LLM_URL if different. Error: {e}\n",
            file=sys.stderr,
        )
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}\n", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
