from fastapi import APIRouter
from app.shared.schemas import ApiResponse
from app.modules.hitl_studio.schemas import LabelTask, SaveAnnotationRequest, ChatPromptRequest, ChatPromptResponse
from app.modules.hitl_studio.service import hitl_studio_service
from app.modules.hitl_studio.rag_guideline import GuidelineRagAssistant

router = APIRouter(prefix="/hitl", tags=["HITL Studio"])

@router.get("/next-task", response_model=ApiResponse[LabelTask])
async def get_next_task():
    task = hitl_studio_service.get_current_task()
    return ApiResponse(message="Lấy ảnh tiếp theo thành công", data=task)

@router.post("/save-annotation", response_model=ApiResponse[bool])
async def save_annotation(req: SaveAnnotationRequest):
    hitl_studio_service.save_annotation(req.image_id, req.boxes)
    return ApiResponse(message="Đã lưu nhãn chuẩn YOLO thành công", data=True)

@router.post("/ask-guideline", response_model=ApiResponse[ChatPromptResponse])
async def ask_guideline(req: ChatPromptRequest):
    res = GuidelineRagAssistant.answer(req.question)
    return ApiResponse(
        message="Trả lời quy chuẩn gán nhãn thành công",
        data=ChatPromptResponse(answer=res["answer"], source_clause=res.get("source_clause"))
    )
