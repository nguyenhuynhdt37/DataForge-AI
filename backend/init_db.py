import asyncio
from sqlalchemy import text
from app.core.database import engine, Base

# Import tất cả các model để SQLAlchemy nhận diện
from app.modules.auth.models import User, UserSession
from app.modules.projects.models import Project, ProjectMember, Task, Job, JobMember

async def init_models():
    async with engine.begin() as conn:
        print("Đang dọn dẹp và khởi tạo lại Database sạch 100%...")
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.run_sync(Base.metadata.create_all)
        print("Khởi tạo thành công toàn bộ các bảng Auth và Projects!")

if __name__ == "__main__":
    asyncio.run(init_models())
