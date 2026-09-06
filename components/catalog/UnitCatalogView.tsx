import React, { useState, useEffect } from 'react';
import { UNITS_DATA, UnitDetail } from '@/data/units';
import { UnitCard } from '@/components/chat/UnitCard';
import { Search, Filter, BookOpen, Layers, Sparkles, Award } from 'lucide-react';

interface UnitCatalogViewProps {
  onAskAgentAboutUnit: (unitCode: string) => void;
}

export const UnitCatalogView: React.FC<UnitCatalogViewProps> = ({ onAskAgentAboutUnit }) => {
  const [units, setUnits] = useState<UnitDetail[]>(UNITS_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('All');
  const [selectedUnitCode, setSelectedUnitCode] = useState<string | null>(UNITS_DATA[0].code);

  useEffect(() => {
    fetch('/api/sheets/sync')
      .then((res) => res.json())
      .then((data) => {
        if (data.units && data.units.length > 0) {
          setUnits(data.units);
          if (!data.units.some((u: UnitDetail) => u.code === selectedUnitCode)) {
            setSelectedUnitCode(data.units[0].code);
          }
        }
      })
      .catch((err) => console.log('Using default units catalog:', err));
  }, []);

  const faculties = ['All', 'Faculty of Engineering & Computer Science', 'Faculty of Science & Data Systems', 'Business School'];

  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.overview.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.topics.some((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFaculty = selectedFaculty === 'All' || u.faculty === selectedFaculty;

    return matchesSearch && matchesFaculty;
  });

  const activeUnit = units.find((u) => u.code === selectedUnitCode) || filteredUnits[0] || units[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-400/20">
            Unit & Subject Syllabus Directory
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Individual Unit Descriptions & Syllabuses
        </h1>
        <p className="text-sm text-blue-200 mt-1 max-w-2xl">
          Search unit codes, inspect weekly lecture topics, assessment weightings, prerequisites, and learning outcomes.
        </p>

        {/* Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code (e.g. COMP1001, AI5001) or topic (e.g. Algorithms, Neural Networks)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-blue-200 focus:outline-hidden focus:bg-white/20 focus:border-blue-400 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-blue-300 shrink-0" />
            {faculties.map((fac) => (
              <button
                key={fac}
                onClick={() => setSelectedFaculty(fac)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFaculty === fac
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                {fac === 'All' ? 'All Faculties' : fac.replace('Faculty of ', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Unit List, Right Detailed Syllabus */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Unit Selector List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            Available Units ({filteredUnits.length})
          </h3>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredUnits.map((unit) => {
              const isSelected = activeUnit?.code === unit.code;
              return (
                <div
                  key={unit.code}
                  onClick={() => setSelectedUnitCode(unit.code)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white/80 border-slate-200 hover:border-indigo-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-mono font-bold border border-blue-100">
                      {unit.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {unit.creditPoints} CP • {unit.level}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mt-2">{unit.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{unit.overview}</p>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Semesters: {unit.semestersOffered.join(', ')}</span>
                    <span className="text-indigo-600 font-semibold">View Syllabus &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Full Detailed Unit Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Detailed Unit Syllabus
            </h3>

            {activeUnit && (
              <button
                onClick={() => onAskAgentAboutUnit(activeUnit.code)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 border border-indigo-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Discuss {activeUnit.code} with AI</span>
              </button>
            )}
          </div>

          {activeUnit ? (
            <UnitCard unit={activeUnit} />
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              Select a unit from the list to view its complete syllabus.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
