import { get } from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const getHealth = () => get(ENDPOINTS.health);

export default { getHealth };
