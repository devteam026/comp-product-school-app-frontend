export type Student = {
  id: string;
  name: string;
  grade: string;
  section: string;
  classCode: string;
  gender: "Male" | "Female";
  dateOfBirth: string;
  admissionNumber: string;
  rollNumber: string;
  address: string;
  parentName: string;
  parentRelation: string;
  parentPhone: string;
  parentEmail: string;
  parentOccupation: string;
  status: "Active" | "Inactive";
  history: string[];
};

export const seedStudents: Student[] = [
  {
    id: "1",
    name: "Ava Wilson",
    grade: "5",
    section: "A",
    classCode: "5A",
    gender: "Female",
    dateOfBirth: "2013-04-11",
    admissionNumber: "ADM-1023",
    rollNumber: "15",
    address: "12 Oak Street",
    parentName: "Emma Wilson",
    parentRelation: "Mother",
    parentPhone: "555-0101",
    parentEmail: "emma.wilson@example.com",
    parentOccupation: "Nurse",
    status: "Active",
    history: ["Student record created"],
  },
  {
    id: "2",
    name: "Noah Smith",
    grade: "6",
    section: "B",
    classCode: "6B",
    gender: "Male",
    dateOfBirth: "2012-09-22",
    admissionNumber: "ADM-1041",
    rollNumber: "9",
    address: "45 Maple Ave",
    parentName: "Olivia Smith",
    parentRelation: "Mother",
    parentPhone: "555-0133",
    parentEmail: "olivia.smith@example.com",
    parentOccupation: "Accountant",
    status: "Active",
    history: ["Student record created"],
  },
  {
    id: "3",
    name: "Mia Patel",
    grade: "7",
    section: "A",
    classCode: "7A",
    gender: "Female",
    dateOfBirth: "2011-01-05",
    admissionNumber: "ADM-1088",
    rollNumber: "21",
    address: "89 Pine Road",
    parentName: "Ravi Patel",
    parentRelation: "Father",
    parentPhone: "555-0199",
    parentEmail: "ravi.patel@example.com",
    parentOccupation: "Engineer",
    status: "Active",
    history: ["Student record created"],
  },
  {
    id: "4",
    name: "Liam Carter",
    grade: "8",
    section: "C",
    classCode: "8C",
    gender: "Male",
    dateOfBirth: "2010-07-14",
    admissionNumber: "ADM-1120",
    rollNumber: "4",
    address: "210 River Lane",
    parentName: "Sophia Carter",
    parentRelation: "Mother",
    parentPhone: "555-0220",
    parentEmail: "sophia.carter@example.com",
    parentOccupation: "Teacher",
    status: "Active",
    history: ["Student record created"],
  },
  {
    id: "5",
    name: "Sophia Kim",
    grade: "9",
    section: "B",
    classCode: "9B",
    gender: "Female",
    dateOfBirth: "2009-11-30",
    admissionNumber: "ADM-1184",
    rollNumber: "18",
    address: "77 Lake View",
    parentName: "Daniel Kim",
    parentRelation: "Father",
    parentPhone: "555-0312",
    parentEmail: "daniel.kim@example.com",
    parentOccupation: "Business Owner",
    status: "Active",
    history: ["Student record created"],
  },
];

export const teacherClasses: Record<string, string[]> = {
  teacher: ["5A", "6B", "9B"],
  teacher2: ["7A", "8C"],
};

export function filterStudents(
  students: Student[],
  role: string,
  username: string,
  classCode?: string
): Student[] {
  if (role === "teacher" && classCode) {
    return students.filter((student) => student.classCode === classCode);
  }

  if (role === "admin" && classCode && classCode !== "all") {
    return students.filter((student) => student.classCode === classCode);
  }

  return students;
}
