import React, { useState, useEffect } from 'react';
import { COURSES_DATA, CourseProgram } from '@/data/courses';
import { Search, Filter, BookOpen, Clock, DollarSign, Award, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface CourseCatalogViewProps {
  onSelectCourseForChat: (course: CourseProgram) => void;
  onApplyForCourse: (course: CourseProgram) => void;
  onExploreUnit: (unitCode: string) => void;
}

export const CourseCatalogView: React.FC<CourseCatalogViewProps> = ({
  onSelectCourseForChat,
  onApplyForCourse,
  onExploreUnit
}) => {
  const [courses, setCourses] = useState<CourseProgram[]>(COURSES_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  useEffect(() => {
    fetch('/api/sheets/sync')
      .then((res) => res.json())
      .then((data) => {
        if (data.courses && data.courses.length > 0) {
          setCourses(data.courses);
        }
      })
      .catch((err) => console.log('Using default course catalog:', err));
  }, []);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.overview.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.majors.some((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLevel = selectedLevel === 'All' || c.degreeLevel === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-indigo-500/30 text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-indigo-400/20">
            Degree Catalog 2026
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Explore Degree Programs & Courses
        </h1>
        <p className="text-sm text-indigo-200 mt-1 max-w-2xl">
          Browse undergraduate and postgraduate qualifications, entry requirements, fee structures, and specialized majors.
        </p>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by degree title, code (e.g. CS100), or major (e.g. AI, Cyber)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-indigo-200 focus:outline-hidden focus:bg-white/20 focus:border-indigo-400 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-300 shrink-0" />
            {['All', 'Undergraduate', 'Postgraduate'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedLevel === lvl
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/10 text-indigo-200 hover:bg-white/20'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-mono font-bold">
                    {course.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {course.durationYears} Years • {course.degreeLevel}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{course.faculty}</p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {course.overview}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-500 font-medium">Entry Req</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">
                      {course.atarRequirement ? `ATAR ${course.atarRequirement}` : `GPA ${course.gpaRequirement}`}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-500 font-medium">Domestic Fee</div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">
                      ${(course.annualTuitionDomestic / 1000).toFixed(1)}k/yr
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-500 font-medium">Intl Fee</div>
                    <div className="text-xs font-bold text-blue-700 mt-0.5">
                      ${(course.annualTuitionInternational / 1000).toFixed(1)}k/yr
                    </div>
                  </div>
                </div>

                {/* Core Units */}
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Core Units
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {course.coreUnits.map((uCode) => (
                      <button
                        key={uCode}
                        onClick={() => onExploreUnit(uCode)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md text-[11px] font-mono font-medium border border-slate-200 transition-colors"
                      >
                        {uCode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
              <button
                onClick={() => onSelectCourseForChat(course)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ask AI Agent</span>
              </button>

              <button
                onClick={() => onApplyForCourse(course)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Apply Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
