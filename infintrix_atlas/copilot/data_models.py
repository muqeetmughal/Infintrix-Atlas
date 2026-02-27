
from pydantic import BaseModel, Field
from typing import List, Optional, Literal


# ---------- Breakdown ----------
class GeneralResponse(BaseModel):
    message: str


        
class SuggestedTask(BaseModel):
    subject: str
    task_type: Literal["Task"]
    reason: str


class SuggestedSubtask(BaseModel):
    subject: str
    task_type: Literal["SubTask"]
    reason: str


class BreakdownResponse(BaseModel):
    message: str
    suggested_subtasks: List[SuggestedSubtask]


class CreateTasksResponse(BaseModel):
    message: str
    suggested_tasks: List[SuggestedTask]

# ---------- Improve ----------

class Improvement(BaseModel):
    original: str
    improved: str
    reason: str


class ImproveResponse(BaseModel):
    suggestions: List[Improvement]


# ---------- Risk ----------

class RiskItem(BaseModel):
    risk: str
    severity: Literal["Low", "Medium", "High"]
    mitigation: str


class RiskResponse(BaseModel):
    risks: List[RiskItem]


# ---------- Effort ----------

class EffortPhase(BaseModel):
    phase: str
    hours: str


class EffortEstimate(BaseModel):
    estimated_hours: str
    complexity: Literal["Low", "Medium", "High"]
    breakdown: List[EffortPhase]


class EffortResponse(BaseModel):
    estimate: EffortEstimate

