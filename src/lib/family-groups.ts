export const FAMILY_ROW_DEFINITIONS = [
  ["Grace", "Jack"],
  ["Brendan", "Jo"],
  ["Katie"],
  ["Elizabeth"],
  ["Michael"]
];

export function firstNamesShareFamilyRow(firstName: string, targetFirstName: string) {
  return FAMILY_ROW_DEFINITIONS.some((row) => row.includes(firstName) && row.includes(targetFirstName));
}
