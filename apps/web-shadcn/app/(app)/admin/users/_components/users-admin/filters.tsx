'use client';

import { Input } from '@desko/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@desko/ui/components/select';

import { useUsersAdmin } from './context';
import { ROLE_FILTER_OPTIONS, type Role } from './types';

export function Filters() {
  const { search, setSearch, roleFilter, setRoleFilter, filteredUsers, users } =
    useUsersAdmin();

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="flex-1">
        <Input
          placeholder="Cerca per nome o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="w-full sm:w-56">
        <Select
          value={roleFilter}
          onValueChange={(v) => v && setRoleFilter(v as Role | 'all')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <span className="text-xs text-muted-foreground font-mono whitespace-nowrap px-2">
        {filteredUsers.length} di {users.length}
      </span>
    </div>
  );
}
