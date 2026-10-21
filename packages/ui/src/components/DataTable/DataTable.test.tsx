import { render, screen } from '@testing-library/react';

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '.';

describe('DataTable', () => {
  it('(Snapshot) renders head and body rows', () => {
    const { container } = render(
      <DataTable>
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Date</DataTableHeaderCell>
            <DataTableHeaderCell>Amount</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          <DataTableRow>
            <DataTableCell>2026-10-21</DataTableCell>
            <DataTableCell>€12.00</DataTableCell>
          </DataTableRow>
        </DataTableBody>
      </DataTable>,
    );
    expect(container).toMatchSnapshot();
  });

  it('gives header cells column scope by default', () => {
    render(
      <DataTable>
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Year</DataTableHeaderCell>
            <DataTableHeaderCell scope="row">Total</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
      </DataTable>,
    );
    expect(screen.getByRole('columnheader', { name: 'Year' })).toHaveAttribute(
      'scope',
      'col',
    );
    expect(screen.getByText('Total')).toHaveAttribute('scope', 'row');
  });
});
