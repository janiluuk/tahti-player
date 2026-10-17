import { AssociationEditPanel } from '../records/AssociationEditPanel';
import { AuditorsPanel } from '../records/AuditorsPanel';
import { CorrectionsQueuePanel } from '../records/CorrectionsQueuePanel';

/** Admin → Governance → Records: members' correction requests and the
 * association's own records. */
export function RecordsTab() {
  return (
    <>
      <CorrectionsQueuePanel />
      <AssociationEditPanel />
      <AuditorsPanel />
    </>
  );
}
