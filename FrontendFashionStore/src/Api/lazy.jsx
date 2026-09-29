let pending;

export const loadApi = () => {
  pending ??= import("./index.jsx");
  return pending;
};

export default loadApi;
