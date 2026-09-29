import { post } from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const uploadImage = (file, { onUploadProgress } = {}) => {
  const form = new FormData();
  form.append("image", file);
  return post(ENDPOINTS.upload.single, form, { onUploadProgress });
};

export const uploadImages = (files, { onUploadProgress } = {}) => {
  const form = new FormData();
  Array.from(files)
    .slice(0, 8)
    .forEach((file) => form.append("images", file));
  return post(ENDPOINTS.upload.multiple, form, { onUploadProgress });
};

export default { uploadImage, uploadImages };
