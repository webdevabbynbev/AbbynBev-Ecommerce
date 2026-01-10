import http from "../../api/http";

export async function importProductCSV(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await http.post(
    "/api/v1/admin/product/import-csv",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}
