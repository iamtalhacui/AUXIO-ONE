/**
 * Built-in required tasks per service line (v1).
 * Used when an organisation has not customised its catalogue yet.
 * Copied onto each shift at create time.
 */
export const DEFAULT_SERVICE_LINE_TASKS: Record<string, string[]> = {
  'Personal care': [
    'Assist with personal care as required',
    'Check participant wellbeing',
    'Secure premises on departure',
  ],
  'Community access': [
    'Confirm outing plan with participant',
    'Support community activity safely',
    'Ensure safe return home',
  ],
  Respite: [
    'Confirm respite handover details',
    'Support participant during respite',
    'Complete handover notes for family/carer',
  ],
  'Behaviour support': [
    'Review behaviour support plan before start',
    'Record significant behaviours if any',
    'Use agreed de-escalation strategies',
  ],
  'High intensity': [
    'Confirm high-intensity supports required',
    'Complete all prescribed support tasks',
    'Document any incidents or concerns',
  ],
  'Medication support': [
    'Check medication chart before administering',
    'Administer medication as prescribed',
    'Record medication outcome',
  ],
};

/** Fallback when the service line has no catalogue entry. */
export const GENERIC_SERVICE_LINE_TASKS = [
  'Complete scheduled support activities',
  'Check participant wellbeing',
  'Record any concerns for the organisation',
];

export function defaultTasksForServiceLine(serviceLine: string): string[] {
  return DEFAULT_SERVICE_LINE_TASKS[serviceLine] ?? GENERIC_SERVICE_LINE_TASKS;
}
