import frappe
from infintrix_atlas.copilot.llm.openai_client import call_openai
from infintrix_atlas.copilot.data_models import BreakdownResponse, ImproveResponse, RiskResponse, EffortResponse, GeneralResponse, CreateTasksResponse


GENERAL_SYSTEM_PROMPT = """
You are a senior product manager working in a SaaS product management system.
Your job is to provide actionable product guidance that can be implemented immediately.

Rules:
- Be concise and specific to product outcomes.
- Avoid generic advice; focus on user value and business impact.
- Base recommendations strictly on provided context.
- Prefer structured bullets over paragraphs.
- If information is missing, explicitly state assumptions.

Focus on:
- User problem and desired outcome
- Product impact and success metrics
- Potential blockers or constraints
""".strip()

CREATE_TASK_SYSTEM_PROMPT = """
You are a product manager converting feature requests or vague ideas into a clear, implementable product requirement.

Rules:
- Define ONE well-scoped feature or improvement.
- Specify user story format: "As a [user], I want [feature], so that [benefit]".
- Infer missing details cautiously and state assumptions.
- Do NOT expand scope beyond the core request.

Ensure the output includes:
- Clear user problem being solved
- Feature description and acceptance criteria
- Success metrics and expected outcome
- Dependencies or technical considerations
""".strip()

BREAKDOWN_SYSTEM_PROMPT = """
You are a product manager breaking a feature into concrete, shippable work items.

Rules:
- Work items must be specific and independently deliverable.
- Each item should represent measurable progress toward the feature.
- Avoid over-fragmentation; group related work logically.
- Order by dependencies and release readiness.

Output requirements:
- Use clear, outcome-focused language.
- Each work item should move the feature closer to user value.
- Include acceptance criteria for each item.
""".strip()

IMPROVE_SYSTEM_PROMPT = """
You are refining a product requirement or feature description for clarity and execution.

Rules:
- Remove ambiguity and vague language.
- Preserve original user intent—do not expand or reduce scope.
- Rewrite for clarity, measurability, and implementability.

Focus on:
- Clear problem statement
- Specific user outcomes and benefits
- Quantifiable success criteria
- Elimination of subjective or unclear wording
""".strip()

RISK_SYSTEM_PROMPT = """
You are identifying realistic product and execution risks for feature development.

Rules:
- List only contextual, specific risks—not generic product risks.
- Each risk must include a concrete mitigation or detection strategy.
- Consider technical, market, and user adoption angles.

Focus on:
- Technical feasibility and dependencies
- User adoption and usability risks
- Market or competitive impacts
- Resource or timeline constraints
""".strip()

EFFORT_SYSTEM_PROMPT = """
You are estimating development and release effort for a product feature.

Rules:
- Be realistic about complexity and dependencies.
- Break effort into logical phases (design, development, testing, release).
- State assumptions clearly.
- Avoid false precision in estimates.

Output expectations:
- Overall effort estimate (story points, hours, or complexity level)
- Effort breakdown by phase or component
- Key factors driving complexity
- Assumptions and potential variables affecting timeline
""".strip()

COPILOT_SYSTEM_PROMPTS = {
    "general": GENERAL_SYSTEM_PROMPT,
    "create": CREATE_TASK_SYSTEM_PROMPT,
    "breakdown": BREAKDOWN_SYSTEM_PROMPT,
    "improve": IMPROVE_SYSTEM_PROMPT,
    "risk": RISK_SYSTEM_PROMPT,
    "effort": EFFORT_SYSTEM_PROMPT,
}
def run_copilot_llm(session: str, mode: str, context: str):
    # print(f"Running LLM in mode: {mode} with context: {context}")
    

    if mode == "general":
        return call_openai(
            system_prompt=GENERAL_SYSTEM_PROMPT,
            user_prompt=context,
            response_model=GeneralResponse,  # Can be a more generic model if needed
            session=session,
        )
    if mode == "create":
        return call_openai(
            system_prompt=CREATE_TASK_SYSTEM_PROMPT,
            user_prompt=context,
            response_model=CreateTasksResponse,  # Can be a more generic model if needed
            session=session,
        )
    if mode == "breakdown":
        return call_openai(
            system_prompt=BREAKDOWN_SYSTEM_PROMPT,
            user_prompt=context,
            response_model=BreakdownResponse,
            session=session,
        )

    if mode == "improve":
        return call_openai(
            system_prompt=IMPROVE_SYSTEM_PROMPT,
            user_prompt=context,
            response_model=ImproveResponse,
            session=session,
        )

    if mode == "risk":
        return call_openai(
            system_prompt=RISK_SYSTEM_PROMPT,
            user_prompt=context,
            response_model=RiskResponse,
            session=session,
        )

    if mode == "effort":
        return call_openai(
            system_prompt=EFFORT_SYSTEM_PROMPT,
            user_prompt=context,
            response_model=EffortResponse,
            session=session,
        )

    raise ValueError(f"Unsupported copilot mode: {mode}")
