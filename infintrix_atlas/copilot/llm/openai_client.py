import os
import json
from typing import Type
from openai import OpenAI
from pydantic import BaseModel, ValidationError
import frappe


def get_chat_history(session: str, limit: int = 5):
    """
    Fetch last N messages in correct order for LLM context.
    """
    messages = frappe.get_all(
        "Copilot Message",
        filters={"session": session},
        fields=["role", "content"],
        order_by="sequence asc",
        limit=limit,
    )

    return [
        {
            "role": msg["role"],  # user | assistant | system
            "content": msg["content"],
        }
        for msg in messages
    ]


def _openai_json_schema(model: Type[BaseModel]) -> dict:
    """
    Convert Pydantic model to OpenAI-compatible JSON schema.
    """
    return {
        "name": model.__name__,
        "schema": model.model_json_schema()
    }


def call_openai(
    *,
    system_prompt: str,
    user_prompt: str,
    response_model: Type[BaseModel],
    temperature: float = 0.2,
    session: str = None,  # Pass session for better logging/tracing
) -> BaseModel:
    """
    Calls OpenAI and validates the response strictly using Pydantic.
    """

    settings = frappe.get_single("Atlas Settings")

    if settings.llm_provider != "OpenAI":
        raise RuntimeError("OpenAI provider not enabled")

    api_key = settings.get_password(
        fieldname="openai_api_key",
        raise_exception=True
    )

    model = settings.openai_model or "gpt-4o-2024-08-06"

    client = OpenAI(api_key=api_key)

    # history = get_chat_history(session) if session else []

    response = client.chat.completions.create(
        model=model,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system_prompt}
        ] + [
            {"role": "user", "content": user_prompt}
        ],
        # messages=[{"role": "system", "content": system_prompt}]
        # + history
        # + [{"role": "user", "content": user_prompt}],
        response_format={
            "type": "json_schema",
            "json_schema": _openai_json_schema(response_model),
        },
    )

    raw_content = response.choices[0].message.content

    print(f"Raw LLM response: {raw_content}")

    try:
        return response_model.model_validate_json(raw_content)
    except ValidationError as e:
        frappe.throw(
            "LLM response validation failed."
            f"\n\nSchema: {response_model.__name__}"
            f"\n\nRaw Response:\n{raw_content}"
            f"\n\nValidation Error:\n{e}"
        )
