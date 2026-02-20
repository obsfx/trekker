import { Section, SubSection } from "../Section";
import { InlineCode } from "../CodeBlock";

const PRIORITY_ROWS = [
  { priority: 0, label: "Critical" },
  { priority: 1, label: "High" },
  { priority: 2, label: "Medium (default)" },
  { priority: 3, label: "Low" },
  { priority: 4, label: "Backlog" },
  { priority: 5, label: "Someday" },
];

export function StatusAndPriority() {
  return (
    <Section title="Status & Priority">
      <SubSection title="Priority Scale">
        <div className="overflow-x-auto">
          <table className="w-full text-fluid-sm">
            <thead>
              <tr className="border-b-2 border-white/20">
                <th className="text-left py-3 pr-4 font-semibold text-white">
                  Priority
                </th>
                <th className="text-left py-3 font-semibold text-white">Label</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              {PRIORITY_ROWS.map((row, i) => (
                <tr key={row.priority} className={`border-b border-white/10 ${i % 2 === 1 ? 'bg-white/5' : ''}`}>
                  <td className="py-3 pr-4 font-mono text-white">{row.priority}</td>
                  <td className="py-3">{row.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SubSection>

      <SubSection title="Status Values">
        <p className="text-fluid-base text-white/70 mb-3">
          <strong className="text-white">Tasks:</strong>{" "}
          <InlineCode>todo</InlineCode>, <InlineCode>in_progress</InlineCode>,{" "}
          <InlineCode>completed</InlineCode>,{" "}
          <InlineCode>wont_fix</InlineCode>, <InlineCode>archived</InlineCode>
        </p>
        <p className="text-fluid-base text-white/70">
          <strong className="text-white">Epics:</strong>{" "}
          <InlineCode>todo</InlineCode>, <InlineCode>in_progress</InlineCode>,{" "}
          <InlineCode>completed</InlineCode>,{" "}
          <InlineCode>archived</InlineCode>
        </p>
      </SubSection>

      <SubSection title="ID Formats">
        <ul className="space-y-2 text-fluid-base text-white/70">
          <li className="flex items-center gap-2">
            <span className="text-white">Epics:</span>
            <InlineCode>EPIC-1</InlineCode>,{" "}
            <InlineCode>EPIC-2</InlineCode>, ...
          </li>
          <li className="flex items-center gap-2">
            <span className="text-white">Tasks:</span>
            <InlineCode>TREK-1</InlineCode>,{" "}
            <InlineCode>TREK-2</InlineCode>, ...
          </li>
          <li className="flex items-center gap-2">
            <span className="text-white">Comments:</span>
            <InlineCode>CMT-1</InlineCode>,{" "}
            <InlineCode>CMT-2</InlineCode>, ...
          </li>
        </ul>
      </SubSection>
    </Section>
  );
}
