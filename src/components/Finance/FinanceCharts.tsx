"use client";
import React from 'react';

interface FinanceChartsProps {
  grossRevenue: number;
  totalCogs: number;
  cogsByGroup: Record<string, number>;
}

export default function FinanceCharts({ grossRevenue, totalCogs, cogsByGroup }: FinanceChartsProps) {
  const profit = grossRevenue - totalCogs;
  const marginPercent = grossRevenue > 0 ? (profit / grossRevenue) * 100 : 0;
  
  // Data for Donut Chart
  const sortedGroups = Object.entries(cogsByGroup).sort((a, b) => b[1] - a[1]);
  const colors = [
    'var(--accent-color)', 
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#64748b'  // slate
  ];

  // SVG Donut Calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const fmtL = (val: number) =>
    `L. ${val.toLocaleString("es-HN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
      
      {/* Chart 1: Profitability Balance */}
      <div className="glass-panel" style={{ flex: 1, minWidth: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          ⚖️ Balance de Rentabilidad
        </h3>
        
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            <span style={{ fontWeight: 600 }}>Eficiencia de Margen</span>
            <span style={{ fontWeight: 800, color: marginPercent >= 40 ? 'var(--success)' : 'var(--warning)' }}>{marginPercent.toFixed(1)}%</span>
          </div>
          <div style={{ position: 'relative', width: '100%', height: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
             {/* COGS Segment */}
             <div style={{ 
                position: 'absolute', 
                left: 0, top: 0, bottom: 0, 
                width: `${(totalCogs / (grossRevenue || 1)) * 100}%`, 
                backgroundColor: 'var(--warning)', 
                opacity: 0.6,
                transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' 
             }}></div>
             {/* Profit Segment */}
             <div style={{ 
                position: 'absolute', 
                left: `${(totalCogs / (grossRevenue || 1)) * 100}%`, 
                top: 0, bottom: 0, 
                width: `${marginPercent}%`, 
                backgroundColor: 'var(--accent-color)',
                transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 20px var(--accent-color)'
             }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Costo ({((totalCogs / (grossRevenue || 1)) * 100 || 0).toFixed(0)}%)</span>
            <span>Ganancia ({marginPercent.toFixed(0)}%)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
           <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 700, marginBottom: '0.25rem' }}>Punto de Equilibrio</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>L {totalCogs.toLocaleString()}</p>
           </div>
           <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 700, marginBottom: '0.25rem' }}>Utilidad Proyectada</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>L {profit.toLocaleString()}</p>
           </div>
        </div>
      </div>

      {/* Chart 2: COGS Composition Donut (Percentage) */}
      <div className="glass-panel" style={{ flex: 1, minWidth: '400px', padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background Circle */}
            <circle cx="90" cy="90" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="15" />
            
            {/* Segments */}
            {sortedGroups.map(([group, amount], index) => {
              const share = amount / (totalCogs || 1);
              const dashArray = share * circumference;
              const offset = currentOffset;
              currentOffset += dashArray;
              
              return (
                <circle
                  key={group + "-pct"}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="transparent"
                  stroke={colors[index % colors.length]}
                  strokeWidth="15"
                  strokeDasharray={`${dashArray} ${circumference}`}
                  strokeDashoffset={-offset}
                  style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
                />
              );
            })}
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Costo</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{totalCogs > 0 ? '100%' : '0%'}</p>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-muted)' }}>📍 Mezcla de Costos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sortedGroups.slice(0, 5).map(([group, amount], index) => {
              const share = (amount / (totalCogs || 1)) * 100;
              return (
                <div key={group + "-pct-leg"} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors[index % colors.length] }}></div>
                  <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-muted)' }}>{group}</span>
                  <span style={{ fontWeight: 800 }}>{share.toFixed(1)}%</span>
                </div>
              );
            })}
            {sortedGroups.length > 5 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>+ {sortedGroups.length - 5} grupos adicionales</p>
            )}
          </div>
        </div>
      </div>

      {/* Chart 3: COGS Composition Donut (Numeric) */}
      <div className="glass-panel" style={{ flex: 1, minWidth: '400px', padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background Circle */}
            <circle cx="90" cy="90" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="15" />
            
            {/* Segments - Reset offset for second donut */}
            {(() => {
              let secondOffset = 0;
              return sortedGroups.map(([group, amount], index) => {
                const share = amount / (totalCogs || 1);
                const dashArray = share * circumference;
                const offset = secondOffset;
                secondOffset += dashArray;
                
                return (
                  <circle
                    key={group + "-num"}
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="transparent"
                    stroke={colors[index % colors.length]}
                    strokeWidth="15"
                    strokeDasharray={`${dashArray} ${circumference}`}
                    strokeDashoffset={-offset}
                    style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
                  />
                );
              });
            })()}
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Costo Total</p>
            <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--warning)' }}>{fmtL(totalCogs)}</p>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-muted)' }}>📍 Mezcla de Costos (L)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sortedGroups.slice(0, 5).map(([group, amount], index) => {
              return (
                <div key={group + "-num-leg"} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors[index % colors.length] }}></div>
                  <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-muted)' }}>{group}</span>
                  <span style={{ fontWeight: 800 }}>{fmtL(amount)}</span>
                </div>
              );
            })}
            {sortedGroups.length > 5 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>+ {sortedGroups.length - 5} grupos adicionales</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
