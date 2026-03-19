export interface Task {
  id: number
  module_name: string
  type: 'CORE' | 'ADV'
  number: string
  title: string
  code: boolean
  interview: boolean
  quiz: boolean
  completed: boolean
}

export interface SubjectModule {
  name: string
  coreRequiredSemester: number
  coreRequiredYear: number
  advRequiredSemester: number
  advRequiredYear: number
  coreCompleted: number
  advCompleted: number
  tasks: Task[]
}

export type CheckboxField = 'code' | 'interview' | 'quiz'
