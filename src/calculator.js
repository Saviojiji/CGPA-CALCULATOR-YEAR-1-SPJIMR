// ═══════════════════════════════════════════════════════════════
//  GPA / CGPA Calculation Engine
// ═══════════════════════════════════════════════════════════════

import { GRADE_SCALE } from './data.js';

/**
 * Convert letter grade to grade points.
 */
export function gradeToPoints(gradeLabel) {
    const g = GRADE_SCALE.find(g => g.label === gradeLabel);
    return g ? g.value : null;
}

/**
 * Calculate GPA from an array of { credits, grade } objects.
 * Only courses with a valid grade (not null / '—') are included.
 * Returns { gpa, totalCredits, gradedCredits }.
 */
export function calcTermGPA(courses) {
    let totalPoints = 0;
    let gradedCredits = 0;

    for (const c of courses) {
        const pts = gradeToPoints(c.grade);
        if (pts !== null) {
            totalPoints += pts * c.credits;
            gradedCredits += c.credits;
        }
    }

    return {
        gpa: gradedCredits > 0 ? totalPoints / gradedCredits : 0,
        totalCredits: courses.reduce((s, c) => s + c.credits, 0),
        gradedCredits,
    };
}

/**
 * Calculate cumulative GPA across multiple term results.
 * @param {Array<{ gpa: number, credits: number, isDirectInput: boolean }>} termResults
 * Each entry is either from course-by-course calc or direct GPA input.
 * Returns { cgpa, totalCredits }.
 */
export function calcCGPA(termResults) {
    let totalWeightedPoints = 0;
    let totalCredits = 0;

    for (const tr of termResults) {
        if (tr.credits > 0 && (tr.gpa > 0 || tr.hasGrades)) {
            totalWeightedPoints += tr.gpa * tr.credits;
            totalCredits += tr.credits;
        }
    }

    return {
        cgpa: totalCredits > 0 ? totalWeightedPoints / totalCredits : 0,
        totalCredits,
    };
}

/**
 * Count grades across an array of { grade } course objects.
 */
export function countGrades(allCourses) {
    const counts = { F: 0, D: 0, I: 0, total: 0 };
    for (const c of allCourses) {
        if (c.grade && c.grade !== '—') {
            counts.total++;
            if (c.grade === 'F') counts.F++;
            if (c.grade === 'D') counts.D++;
            if (c.grade === 'I') counts.I++;
        }
    }
    return counts;
}
