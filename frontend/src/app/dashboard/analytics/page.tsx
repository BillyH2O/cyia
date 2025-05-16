'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from '@/components/features/layout/DashboardLayout';

interface ModelUsageData {
  name: string;
  count: number;
}

interface FeatureUsageData {
  evaluateSources: number;
  useReranker: number;
  useMultiQuery: number;
  useStreaming: number;
}

interface ConsumptionData {
  date: string; 
  count: number;
}

interface AnalyticsSummary {
  totalMessages: number;
  modelUsage: ModelUsageData[];
  featureUsage: FeatureUsageData;
  consumptionOverTime: ConsumptionData[];
  avgCostPerReq: number;
  avgPromptTokensPerReq: number;
  avgCompletionTokensPerReq: number;
  avgTotalTokensPerReq: number;
  totalCost: number;
  totalTokens: number;
}

interface TooltipProps {
  payload?: Array<{
    value: number;
    name: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#6a89cc', '#4bcffa', '#fad390', '#b8e994', '#f368e0'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/analytics/summary'); 
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch analytics summary');
        }
        const result: AnalyticsSummary = await response.json();
        setData(result);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="flex items-center justify-center h-[calc(100vh-10rem)]">Chargement des analyses...</div>;
    }
  
    if (error) {
      return <div className="flex items-center justify-center h-[calc(100vh-10rem)] text-destructive">Erreur: {error}</div>;
    }
  
    if (!data || data.totalMessages === 0) {
      return <div className="flex items-center justify-center h-[calc(100vh-10rem)]">Aucune donnée d&apos;analyse disponible.</div>;
    }

    // Préparation des données pour l'histogramme avec les couleurs attribuées
    const barData = data.modelUsage.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length]
    }));

    return (
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Statistiques d&apos;Utilisation</h1>
  
        {/* Statistiques Globales */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé Global</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold">{data.totalMessages}</p>
              <p className="text-sm text-muted-foreground">Messages Envoyés</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{data.featureUsage.evaluateSources}</p>
              <p className="text-sm text-muted-foreground">Éval. Sources</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{data.featureUsage.useReranker}</p>
              <p className="text-sm text-muted-foreground">Reranker</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{data.featureUsage.useStreaming}</p>
              <p className="text-sm text-muted-foreground">Streaming</p>
            </div>
          </CardContent>
        </Card>
  
        {/* Token and Cost Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métriques de Coût et Tokens</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold">${data.avgCostPerReq.toFixed(6)}</p>
              <p className="text-sm text-muted-foreground">Coût Moyen / Req</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{Math.round(data.avgPromptTokensPerReq)}</p>
              <p className="text-sm text-muted-foreground">Tokens Prompt / Req</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{Math.round(data.avgCompletionTokensPerReq)}</p>
              <p className="text-sm text-muted-foreground">Tokens Réponse / Req</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{Math.round(data.avgTotalTokensPerReq)}</p>
              <p className="text-sm text-muted-foreground">Total Tokens / Req</p>
            </div>
          </CardContent>
        </Card>
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Histogramme Modèles avec couleurs différentes et légende personnalisée */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Utilisation des Modèles</CardTitle>
              <CardDescription>Nombre de fois où chaque modèle a été utilisé</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Légende personnalisée */}
              <div className="flex flex-wrap gap-4 mb-4 justify-center">
                {data.modelUsage.map((model, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{model.name}</span>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide={true} />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value: number, name: string, props: TooltipProps) => [`${value} utilisations`, props?.payload?.[0]?.name ?? '']} 
                    labelFormatter={() => ''}
                  />
                  <Bar dataKey="count" name="Utilisations" fill="#8884d8">
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
  
          {/* Activité au fil du temps */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activité au Fil du Temps</CardTitle>
              <CardDescription>Nombre de messages envoyés par jour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.consumptionOverTime} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [`${value} messages`, 'Activité']} />
                  <Legend />
                  <Area type="monotone" dataKey="count" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Messages" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* Wrap content in a scrollable container */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
} 