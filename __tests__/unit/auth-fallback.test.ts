import AuthService, { DEFAULT_ROLES } from '../../lib/auth-service';

describe('AuthService fallback via RPC', () => {
  it('cria perfil via RPC quando user_profiles não possui registro e retorna usuário válido', async () => {
    const mockSupabase: any = {
      _table: null as string | null,
      _select: null as string | null,
      _eq: null as { col: string; val: any } | null,
      from(table: string) {
        this._table = table;
        return this;
      },
      select(sel: string) {
        this._select = sel;
        return this;
      },
      eq(col: string, val: any) {
        this._eq = { col, val };
        return this;
      },
      async single() {
        if (this._table === 'user_profiles' && this._select !== '*') {
          return { data: null, error: { message: 'Not found' } };
        }
        if (this._table === 'user_profiles' && this._select === '*') {
          return {
            data: {
              user_id: 'uid_test',
              email: 'test@example.com',
              full_name: 'Usuário',
              created_at: '2024-01-01T00:00:00.000Z',
              status: 'active',
              plan: null,
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
      async rpc(fn: string, args: Record<string, any>) {
        if (fn === 'insert_user_profile_on_registration') {
          return { data: null, error: null };
        }
        return { data: null, error: null };
      },
      auth: {
        admin: {
          getUserById: jest.fn(),
        },
      },
    };

    const authUser: any = {
      id: 'uid_test',
      email: 'test@example.com',
      user_metadata: {},
    };

    const result = await AuthService.getUserWithRole('uid_test', authUser, mockSupabase);
    expect(result).toBeTruthy();
    expect(result?.id).toBe('uid_test');
    expect(result?.email).toBe('test@example.com');
    expect(result?.role.id).toBe(DEFAULT_ROLES.user.id);
    expect(result?.is_active).toBe(true);
  });
});

