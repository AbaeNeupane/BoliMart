from fastapi import APIRouter, File, UploadFile

router = APIRouter()

@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    return {"message": "Upload image - to be implemented", "filename": file.filename}

@router.post("/gallery")
async def upload_gallery(files: list[UploadFile] = File(...)):
    return {"message": "Upload gallery - to be implemented", "files": [f.filename for f in files]}
