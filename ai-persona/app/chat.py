from dataclasses import dataclass, field

from openai import OpenAI

from app.config import Settings, get_client, get_settings
from app.prompts.system_prompt import SYSTEM_PROMPT

Message = dict[str, str]


@dataclass
class ChatSession:
    client: OpenAI = field(default_factory=get_client)
    settings: Settings = field(default_factory=get_settings)
    system_prompt: str = SYSTEM_PROMPT
    messages: list[Message] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.messages:
            self.messages.append({"role": "system", "content": self.system_prompt})

    def send(self, user_input: str) -> str:
        self.messages.append({"role": "user", "content": user_input})
        response = self.client.chat.completions.create(
            model=self.settings.model,
            messages=self.messages,
        )
        reply = response.choices[0].message.content or ""
        self.messages.append({"role": "assistant", "content": reply})
        return reply