'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterState {
  search: string;
  category: string;
  risk: string;
  chips: string;
}

interface StrategyFilterProps {
  categories: string[];
  onFilterChange: (filters: FilterState) => void;
  totalStrategies: number;
  filteredCount: number;
}

export function StrategyFilter({ 
  categories, 
  onFilterChange, 
  totalStrategies, 
  filteredCount 
}: StrategyFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    risk: '',
    chips: ''
  });
  
  const [isExpanded, setIsExpanded] = useState(false);

  const riskLevels = ['Baixo', 'Médio', 'Alto'];
  const chipsOptions = ['1', '2', '3', '4', '1-2', '2-3', '3-4'];

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      category: '',
      risk: '',
      chips: ''
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg">
              <Filter className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-urbanist">Filtros de Estratégias</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 font-jakarta">
                {filteredCount} de {totalStrategies} estratégias
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="gap-1"
              >
                <X className="w-4 h-4" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="lg:hidden"
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Busca por nome */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar estratégia por nome..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10 font-jakarta"
          />
        </div>

        {/* Filtros avançados */}
        <AnimatePresence>
          {(isExpanded || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Filtro por categoria */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground font-jakarta">
                  Categoria
                </label>
                <Select value={filters.category || undefined} onValueChange={(value) => updateFilter('category', value || '')}>
                  <SelectTrigger className="font-jakarta">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por risco */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground font-jakarta">
                  Nível de Risco
                </label>
                <Select value={filters.risk || undefined} onValueChange={(value) => updateFilter('risk', value || '')}>
                  <SelectTrigger className="font-jakarta">
                    <SelectValue placeholder="Todos os níveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os níveis</SelectItem>
                    {riskLevels.map((risk) => (
                      <SelectItem key={risk} value={risk}>
                        {risk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por fichas */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground font-jakarta">
                  Número de Fichas
                </label>
                <Select value={filters.chips || undefined} onValueChange={(value) => updateFilter('chips', value || '')}>
                  <SelectTrigger className="font-jakarta">
                    <SelectValue placeholder="Todas as opções" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as opções</SelectItem>
                    {chipsOptions.map((chips) => (
                      <SelectItem key={chips} value={chips}>
                        {chips} {chips.includes('-') ? 'fichas' : 'ficha'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtros ativos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Busca: {filters.search}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => updateFilter('search', '')}
                />
              </Badge>
            )}
            {filters.category && (
              <Badge variant="secondary" className="gap-1">
                {filters.category}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => updateFilter('category', '')}
                />
              </Badge>
            )}
            {filters.risk && (
              <Badge variant="secondary" className="gap-1">
                Risco {filters.risk}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => updateFilter('risk', '')}
                />
              </Badge>
            )}
            {filters.chips && (
              <Badge variant="secondary" className="gap-1">
                {filters.chips} {filters.chips.includes('-') ? 'fichas' : 'ficha'}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => updateFilter('chips', '')}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}