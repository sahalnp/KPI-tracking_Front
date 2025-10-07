import { axiosInstance } from "@/api/axios";


export const logoutSupervisor = async () => {
  await axiosInstance.post("/supervisor/logout");
};

export const logoutOwner = async () => {
  await axiosInstance.post("/owner/logout");
};

export const logoutStaff = async () => {
  await axiosInstance.post("/Staff/logout");
};

export const logoutAccountant = async () => {
  await axiosInstance.post("/accountant/logout");
};
