// ═══════════════════════════════════════════════════════════════
//  Promotion Rules Engine  (Rule 2.10)
// ═══════════════════════════════════════════════════════════════

/**
 * Evaluate all promotion rules.
 * @param {{ term1GPA, cgpa, totalCredits, compExamGrade, gradeCounts }} data
 * @returns {Array<{ id, label, status: 'pass'|'fail'|'pending', detail }>}
 */
export function evaluatePromotionRules(data) {
    const rules = [];

    // 2.10.1  Term 1 GPA >= 2.4
    rules.push({
        id: 'term1_gpa',
        label: 'Term 1 GPA ≥ 2.4',
        status: data.term1GPA === null ? 'pending'
            : data.term1GPA >= 2.4 ? 'pass' : 'fail',
        detail: data.term1GPA !== null
            ? `Term 1 GPA: ${data.term1GPA.toFixed(2)}`
            : 'Not yet calculated',
    });

    // 2.10.2  Comprehensive Exam — No F
    const compStatus = data.compExamGrade === null ? 'pending'
        : data.compExamGrade === 'F' ? 'fail' : 'pass';
    rules.push({
        id: 'comp_exam',
        label: 'Comprehensive Exam Cleared (No F)',
        status: compStatus,
        detail: data.compExamGrade
            ? `Grade: ${data.compExamGrade}`
            : 'Grade not entered',
    });

    // 2.10.3  Cumulative GPA >= 2.4
    rules.push({
        id: 'cgpa',
        label: 'Cumulative GPA ≥ 2.4',
        status: data.cgpa === null ? 'pending'
            : data.cgpa >= 2.4 ? 'pass' : 'fail',
        detail: data.cgpa !== null
            ? `CGPA: ${data.cgpa.toFixed(2)} (${data.totalCredits} credits)`
            : 'Not yet calculated',
    });

    // 2.10.3a  Max 1 F
    rules.push({
        id: 'max_f',
        label: 'Maximum 1 F Grade',
        status: data.gradeCounts.total === 0 ? 'pending'
            : data.gradeCounts.F <= 1 ? 'pass' : 'fail',
        detail: `F grades: ${data.gradeCounts.F}`,
    });

    // 2.10.3b/c  D limits
    const maxD = data.gradeCounts.F > 0 ? 1 : 3;
    rules.push({
        id: 'max_d',
        label: `Maximum ${maxD} D Grade${maxD > 1 ? 's' : ''} (${data.gradeCounts.F > 0 ? 'has F → max 1 D' : 'no F → max 3 Ds'})`,
        status: data.gradeCounts.total === 0 ? 'pending'
            : data.gradeCounts.D <= maxD ? 'pass' : 'fail',
        detail: `D grades: ${data.gradeCounts.D}`,
    });

    // Incomplete check
    if (data.gradeCounts.I > 0) {
        rules.push({
            id: 'incomplete',
            label: 'No Incomplete (I) Grades',
            status: 'fail',
            detail: `Incomplete grades: ${data.gradeCounts.I} — not eligible for promotion`,
        });
    }

    return rules;
}

/**
 * Get overall status from rules list.
 */
export function getOverallStatus(rules) {
    if (rules.some(r => r.status === 'fail')) return 'at-risk';
    if (rules.some(r => r.status === 'pending')) return 'pending';
    return 'on-track';
}
