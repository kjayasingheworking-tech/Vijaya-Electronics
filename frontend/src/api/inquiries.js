import api from "../api/axios";

// List all damage inquiries (admin only)
export const adminListDamageInquiries = async (params = {}) => {
  const { data } = await api.get("/inv/admin/damage-inquiries", { params });
  return data;
};

// Get one inquiry
export const adminGetDamageInquiry = async (id) => {
  const { data } = await api.get(`/inv/admin/damage-inquiries/${id}`);
  return data;
};
