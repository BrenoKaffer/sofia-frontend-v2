
import { AuthService } from '../../lib/auth-service';
import { createClient } from '@supabase/supabase-js';

// Mock do supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('AuthService', () => {
  describe('getUserWithRole', () => {
    it('deve retornar usuário com plan e status', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_id: '123',
            email: 'test@example.com',
            full_name: 'Test User',
            role: 'user',
            created_at: '2023-01-01',
            status: 'active',
            plan: 'pro'
          },
          error: null
        })
      };

      const result = await AuthService.getUserWithRole('123', undefined, mockSupabase as any);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('123');
      expect(result?.plan).toBe('pro');
      expect(result?.status).toBe('active');
      expect(result?.is_active).toBe(true);
    });
  });
});
