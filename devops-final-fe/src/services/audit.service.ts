import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';

export interface AuditLog {
  id?: string;
  table_name: string;
  record_id: string;
  user_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

class AuditService {
  async getLogs(): Promise<AuditLog[]> {
    const response = await apiClient.get<ApiResponse<AuditLog[]>>('/api/admin/audit-logs');
    return response.data.result || [];
  }

  async searchLogs(query: string): Promise<AuditLog[]> {
    const response = await apiClient.get<ApiResponse<AuditLog[]>>(`/api/admin/audit-logs/search?search=${encodeURIComponent(query)}`);
    return response.data.result || [];
  }
}

export const auditService = new AuditService();
export default auditService;
