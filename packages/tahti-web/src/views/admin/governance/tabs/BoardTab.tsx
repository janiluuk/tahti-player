import { BoardTermsPanel } from '../board/BoardTermsPanel';
import { ElectionsAdminPanel } from '../board/ElectionsAdminPanel';

/** Admin → Governance → Board: who sits on the board and how they got there. */
export function BoardTab() {
  return (
    <>
      <BoardTermsPanel />
      <ElectionsAdminPanel />
    </>
  );
}
