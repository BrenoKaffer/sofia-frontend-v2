"use client";

import React, { useEffect, useMemo, useState } from "react";

type TopologyFeatures = {
  wheelIndexHistogram: number[];
  avgDistanceFromZero: number;
} | null;

type SectorFeatures = {
  voisinsRatio: number;
  tiersRatio: number;
  orphelinsRatio: number;
  noneRatio: number;
} | null;

type FeaturesResponse = {
  success: boolean;
  table_id: string;
  features: {
    topologyFeatures: TopologyFeatures;
    sectorFeatures: SectorFeatures;
    metadata: { totalSpins: number; recentSpins: number; extendedSpins: number };
  };
  data_used?: {
    recent_spins_count: number;
    oldest_spin?: string;
    newest_spin?: string;
  };
  generated_at: string;
};

export default function MLFeaturesPage() {
  const [tableId, setTableId] = useState<string>("");
  const [limit, setLimit] = useState<string>("50");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FeaturesResponse | null>(null);

  const canFetch = useMemo(() => tableId.trim().length > 0, [tableId]);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      const url = `/api/ml/features?table_id=${encodeURIComponent(tableId)}&limit=${encodeURIComponent(limit)}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `Erro ao buscar features (${resp.status})`);
      }
      const json = (await resp.json()) as FeaturesResponse;
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Falha ao buscar features");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // não busca automaticamente; aguarda input do usuário
  }, []);

  const histogram = data?.features.topologyFeatures?.wheelIndexHistogram || [];
  const avgDist = data?.features.topologyFeatures?.avgDistanceFromZero ?? null;
  const sectors = data?.features.sectorFeatures || null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Features do ML: Topologia e Setores</h1>
      <p className="text-sm text-gray-600">
        Visualize proporções setoriais (Voisins, Tiers, Orphelins) e a distribuição de índices da roda.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2 p-4 border rounded-md bg-white">
          <label className="block text-sm font-medium">Table ID</label>
          <input
            className="mt-1 w-full border rounded-md p-2"
            placeholder="Ex: mesa_01"
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
          />
          <label className="block text-sm font-medium mt-3">Limit</label>
          <input
            className="mt-1 w-full border rounded-md p-2"
            placeholder="50"
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            disabled={!canFetch || loading}
            onClick={fetchFeatures}
          >
            {loading ? "Carregando..." : "Buscar Features"}
          </button>
          {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
        </div>

        <div className="p-4 border rounded-md bg-white">
          <h2 className="font-medium">Resumo</h2>
          <ul className="mt-2 text-sm space-y-1">
            <li>
              <span className="font-semibold">Mesa:</span> {data?.table_id || "-"}
            </li>
            <li>
              <span className="font-semibold">Spins usados:</span> {data?.data_used?.recent_spins_count ?? "-"}
            </li>
            <li>
              <span className="font-semibold">Avg Dist. do Zero:</span> {avgDist !== null ? avgDist.toFixed(2) : "-"}
            </li>
            <li>
              <span className="font-semibold">Gerado em:</span> {data?.generated_at ? new Date(data.generated_at).toLocaleString() : "-"}
            </li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-md bg-white">
          <h2 className="font-medium">Setores</h2>
          {!sectors ? (
            <p className="text-sm text-gray-600">Sem dados suficientes</p>
          ) : (
            <ul className="mt-2 text-sm space-y-2">
              <li>
                <span className="inline-block w-40">Voisins de Zero:</span>
                <span className="font-semibold">{(sectors.voisinsRatio * 100).toFixed(1)}%</span>
              </li>
              <li>
                <span className="inline-block w-40">Tiers du Cylindre:</span>
                <span className="font-semibold">{(sectors.tiersRatio * 100).toFixed(1)}%</span>
              </li>
              <li>
                <span className="inline-block w-40">Orphelins:</span>
                <span className="font-semibold">{(sectors.orphelinsRatio * 100).toFixed(1)}%</span>
              </li>
              <li>
                <span className="inline-block w-40">None:</span>
                <span className="font-semibold">{(sectors.noneRatio * 100).toFixed(1)}%</span>
              </li>
            </ul>
          )}
        </div>

        <div className="p-4 border rounded-md bg-white">
          <h2 className="font-medium">Histograma de Índices da Roda</h2>
          {histogram.length === 0 ? (
            <p className="text-sm text-gray-600">Sem dados suficientes</p>
          ) : (
            <div className="mt-2 grid grid-cols-6 gap-1">
              {histogram.map((v, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="bg-blue-500 w-6"
                    style={{ height: `${Math.max(2, v * 120)}px` }}
                    title={`Index ${i} - ${(v * 100).toFixed(1)}%`}
                  />
                  <span className="text-[10px] mt-1">{i}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}