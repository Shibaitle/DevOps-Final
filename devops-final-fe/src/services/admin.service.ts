import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';

export interface AdminUser {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  is_approve: boolean;
  created_at: string;
  role: {
    id: string;
    name: string;
  };
}

class AdminService {
  async getAllUsers(): Promise<AdminUser[]> {
    const response = await apiClient.get<ApiResponse<AdminUser[]>>('/api/admin/users');
    return response.data.result || [];
  }

  async updateUserApproval(userId: string, isApprove: boolean): Promise<void> {
    await apiClient.patch<ApiResponse<null>>(`/api/admin/users/${userId}/approval`, {
      is_approve: isApprove,
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/api/admin/users/${userId}`);
  }
}

export const adminService = new AdminService();
export default adminService;
