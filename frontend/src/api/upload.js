import client from "./client"

export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append("file", file)
  return client.post("/upload/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
}
