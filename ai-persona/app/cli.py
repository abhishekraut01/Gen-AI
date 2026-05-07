from app.chat import ChatSession
from app.config import get_settings


def run() -> None:
    settings = get_settings()
    session = ChatSession(settings=settings)

    print('Type "exit" and press Enter to end the conversation.')

    while True:
        try:
            user_input = input(f"{settings.user_label} --> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not user_input:
            continue
        if user_input.lower() == "exit":
            break

        reply = session.send(user_input)
        print(f"{settings.persona_name} --> {reply}")