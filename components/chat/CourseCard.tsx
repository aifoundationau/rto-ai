import React from 'react';
import { CourseProgram } from '@/data/courses';
import { GraduationCap, Clock, Award, DollarSign, MapPin, Sparkles, BookOpen, ArrowRight } from 'lucide-react';

interface CourseCardProps {
  course: CourseProgram;
  onExploreUnits?: (unitCode: string) => void;
  onApplyForCourse?: (course: CourseProgram) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onExploreUnits, onApplyForCourse }) => {
  return (
    <div className="my-3 bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-primary-800 p-5 text-white">
        <div className="flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase">
            {course.code} • {course.degreeLevel}
          </span>
          <span className="flex items-center gap-1 text-xs text-indigo-200">
            <Clock className="w-3.5 h-3.5" />
            {course.durationYears} Years Full-time
          </span>
        </div>
        <h3 className="text-xl font-bold mt-2 text-white">{course.title}</h3>
        <p className="text-xs text-indigo-200 mt-1">{course.faculty}</p>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">{course.overview}</p>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              {course.atarRequirement ? 'Min ATAR' : 'Min GPA'}
            </div>
            <div className="text-base font-bold text-slate-800 mt-1">
              {course.atarRequirement || `${course.gpaRequirement}/7.0`}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Tuition (Dom)
            </div>
            <div className="text-base font-bold text-slate-800 mt-1">
              ${course.annualTuitionDomestic.toLocaleString()}<span className="text-xs font-normal text-slate-400">/yr</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
              Tuition (Intl)
            </div>
            <div className="text-base font-bold text-slate-800 mt-1">
              ${course.annualTuitionInternational.toLocaleString()}<span className="text-xs font-normal text-slate-400">/yr</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              Campuses
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1 truncate" title={course.campus.join(', ')}>
              {course.campus[0]}
            </div>
          </div>
        </div>

        {/* Majors */}
        {course.majors && course.majors.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Available Majors & Specializations
            </h4>
            <div className="space-y-1.5">
              {course.majors.map((m, idx) => (
                <div key={idx} className="p-2.5 bg-indigo-50/60 rounded-lg text-xs">
                  <span className="font-semibold text-indigo-950">{m.name}: </span>
                  <span className="text-slate-600">{m.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Core Units Pills */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            Core Syllabus Units
          </h4>
          <div className="flex flex-wrap gap-2">
            {course.coreUnits.map((unitCode) => (
              <button
                key={unitCode}
                onClick={() => onExploreUnits?.(unitCode)}
                className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>{unitCode}</span>
                <span className="text-[10px] opacity-70">Syllabus &rarr;</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Next intake: {course.intakes[0]}</span>
          {onApplyForCourse && (
            <button
              onClick={() => onApplyForCourse(course)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:gap-2"
            >
              <span>Apply for this Degree</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
