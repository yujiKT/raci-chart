export type RACIValue = "" | "R" | "A" | "C" | "I";

export interface Role {
  id: string;
  label: string;
}

export interface Task {
  name: string;
  raci: Record<string, RACIValue>;
}

export interface Phase {
  name: string;
  color: string;
  tasks: Task[];
}

export const INITIAL_ROLES: Role[] = [
  { id: "pm", label: "Project Manager" },
  { id: "designer", label: "Designer" },
  { id: "engineer", label: "Engineer" },
  { id: "client", label: "Client" },
];

export const INITIAL_PHASES: Phase[] = [
  {
    name: "Planning",
    color: "#6366f1",
    tasks: [
      { name: "Project Planning", raci: { pm: "R", designer: "I", engineer: "I", client: "A" } },
      { name: "Requirements Definition", raci: { pm: "R", designer: "C", engineer: "C", client: "A" } },
    ],
  },
  {
    name: "Design & Dev",
    color: "#8b5cf6",
    tasks: [
      { name: "UI/UX Design", raci: { pm: "A", designer: "R", engineer: "C", client: "C" } },
      { name: "Implementation", raci: { pm: "A", designer: "C", engineer: "R", client: "I" } },
    ],
  },
];
