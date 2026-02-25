// ═══════════════════════════════════════════════════════════════
//  SPJIMR PGDM 2025-27 — Course & Grading Data
// ═══════════════════════════════════════════════════════════════

export const GRADE_SCALE = [
    { label: '—', value: null },
    { label: 'A+', value: 4.0 },
    { label: 'A', value: 3.5 },
    { label: 'B+', value: 3.0 },
    { label: 'B', value: 2.5 },
    { label: 'C+', value: 2.0 },
    { label: 'C', value: 1.5 },
    { label: 'D', value: 1.0 },
    { label: 'F', value: 0.0 },
];

// Absolute grading for Abhyudaya, ADMAP & DoCC
export const ABSOLUTE_GRADE_RANGES = [
    { min: 90, max: 100, grade: 'A+' },
    { min: 83, max: 89.99, grade: 'A' },
    { min: 77, max: 82.99, grade: 'B+' },
    { min: 67, max: 76.99, grade: 'B' },
    { min: 60, max: 66.99, grade: 'C+' },
    { min: 50, max: 59.99, grade: 'D' },
    { min: 40, max: 49.99, grade: 'F' },
    { min: 0, max: 39.99, grade: 'F' },
];

export const TERMS = [
    {
        id: 'term1',
        name: 'Term 1',
        weeks: 12,
        color: '#2196F3',
        courses: [
            { name: 'Business Communication I', credits: 1 },
            { name: 'Business Policy and Strategy I', credits: 1 },
            { name: 'Decision Analysis Simulation', credits: 2 },
            { name: 'Financial Accounting & Statement Analysis', credits: 2 },
            { name: 'Managerial Economics I', credits: 2 },
            { name: 'Marketing Management I', credits: 2 },
            { name: 'Operations Management I', credits: 2 },
            { name: 'Organisational Behaviour', credits: 1 },
            { name: 'Quantitative Methods-I', credits: 1 },
            { name: 'Science of Spirituality I', credits: 1 },
            { name: 'Wise Innovation Foundation', credits: 1 },
        ],
    },
    {
        id: 'term2',
        name: 'Term 2',
        weeks: 12,
        color: '#4CAF50',
        courses: [
            { name: 'Business Communication II', credits: 2 },
            { name: 'Corporate Finance', credits: 2 },
            { name: 'Data Visualisation for Decision Making', credits: 1 },
            { name: 'Business in Digital Age', credits: 2 },
            { name: 'Managerial Economics II', credits: 3 },
            { name: 'Marketing Management II', credits: 2 },
            { name: 'Operations Management II', credits: 1 },
            { name: 'Organisational Dynamics', credits: 2 },
            { name: 'Quantitative Methods-II', credits: 3 },
        ],
    },
    {
        id: 'term3',
        name: 'Term 3',
        weeks: 13,
        color: '#FF5722',
        courses: [
            { name: 'Business Policy & Strategy II', credits: 2 },
            { name: 'Human Resource Management', credits: 1 },
            { name: 'Decision Science', credits: 2 },
            { name: 'Management Accounting', credits: 2 },
            { name: 'Specialization Course 1', credits: 2 },
            { name: 'Specialization Course 2', credits: 2 },
            { name: 'Specialization Course 3', credits: 2 },
            { name: 'Specialization Course 4', credits: 2 },
        ],
    },
];

export const NCL = {
    id: 'ncl',
    name: 'Non-Classroom Learning (NCL)',
    color: '#9C27B0',
    courses: [
        { name: 'Comprehensive Examination', credits: 1, category: 'Year I', grading: 'standard' },
        { name: 'Assessment & Development of Managerial and Administrative Potential (ADMAP)', credits: 2, category: 'Term II to IV', grading: 'absolute' },
        { name: 'Abhyudaya Mentorship', credits: 2, category: 'Term II to IV', grading: 'absolute' },
    ],
};

// Total credits by term
export function getTermCredits(termId) {
    if (termId === 'ncl') {
        return NCL.courses.reduce((s, c) => s + c.credits, 0);
    }
    const t = TERMS.find(t => t.id === termId);
    return t ? t.courses.reduce((s, c) => s + c.credits, 0) : 0;
}

// Total Year I credits = T1 + T2 + T3 + NCL = 54
export const TOTAL_YEAR1_CREDITS = TERMS.reduce((s, t) => s + t.courses.reduce((a, c) => a + c.credits, 0), 0) + NCL.courses.reduce((s, c) => s + c.credits, 0);

// Promotion rule total (T1+T2+T3 = 49 classroom + NCL 5 +  Comp Exam 1 => 56 from the rule doc mentioning 56)
// The document says 56 credits — this seems to be 49 classroom + 5 NCL + possibly DoCC 2
// Using 54 as per the credit structure image (Total Credits For Year I = 54)
export const CGPA_CREDIT_THRESHOLD = 54;
