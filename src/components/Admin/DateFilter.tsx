"use client";

import React, { useState, useRef, useEffect } from "react";

/**
 * Interface para los props del componente
 */
export interface DateFilterProps {
  onDateChange: (start: Date, end: Date, label: string) => void;
  initialLabel?: string;
}

/**
 * Opciones disponibles para el filtro
 */
export type FilterOption = "Hoy" | "Ayer" | "Esta semana" | "Semana pasada" | "Este mes" | "Mes pasado";

/**
 * Componente DateFilter: Un selector de rango de fechas con lógica estricta (ISO Week)
 * Diseñado para paneles administrativos modernos.
 */
export default function DateFilter({ onDateChange, initialLabel = "Este mes" }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(initialLabel);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Cálculos estrictos de fecha
   * Garantiza inicio a las 00:00:00 y fin a las 23:59:59
   */
  const calculateDates = (option: FilterOption) => {
    const now = new Date();
    // Clonar para evitar mutaciones accidentales
    let start = new Date(now);
    let end = new Date(now);

    switch (option) {
      case "Hoy":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case "Ayer":
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;

      case "Esta semana": {
        // Regla estricta: Semana inicia el Lunes (ISO 8601)
        const day = now.getDay();
        const diff = day === 0 ? -6 : 1 - day; // Domingo (0) retrocede 6, otros retroceden hasta lunes (1)
        start.setDate(now.getDate() + diff);
        start.setHours(0, 0, 0, 0);
        
        end = new Date(start);
        end.setDate(start.getDate() + 6); // Termina el domingo
        end.setHours(23, 59, 59, 999);
        break;
      }

      case "Semana pasada": {
        const day = now.getDay();
        const diffToThisMonday = day === 0 ? -6 : 1 - day;
        const lastMonday = new Date(now);
        lastMonday.setDate(now.getDate() + diffToThisMonday - 7);
        
        start = lastMonday;
        start.setHours(0, 0, 0, 0);
        
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }

      case "Este mes":
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case "Mes pasado":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
    }

    return { start, end };
  };

  const handleSelect = (option: FilterOption) => {
    const { start, end } = calculateDates(option);
    setSelectedLabel(option);
    onDateChange(start, end, option);
    setIsOpen(false);
  };

  const options: FilterOption[] = ["Hoy", "Ayer", "Esta semana", "Semana pasada", "Este mes", "Mes pasado"];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex w-full justify-between items-center gap-x-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          id="menu-button"
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span className="truncate">{selectedLabel}</span>
          </div>
          <svg className={`-mr-1 h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div 
          className="absolute right-0 z-[100] mt-2 w-52 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden transition-all animate-in fade-in zoom-in duration-200" 
        >
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`flex w-full items-center px-4 py-2.5 text-sm transition-colors ${
                  selectedLabel === option 
                    ? "bg-indigo-50 text-indigo-700 font-bold" 
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {option}
                {selectedLabel === option && (
                  <svg className="ml-auto h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
